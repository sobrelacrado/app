import assert from 'node:assert/strict'
import { test, before, after, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection,
  serverTimestamp, writeBatch, Timestamp, query, where, deleteField,
} from 'firebase/firestore'

const ADMIN = 'sobrelacradojuegos@gmail.com'
let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sobre-lacrado',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
after(() => env.cleanup())

// Datos base: un juego con 4 pasos y una partida en curso.
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'games/g1'), { name: 'Caso 1', active: true, timeLimitMinutes: 240 })
    await setDoc(doc(db, 'games/g2'), { name: 'Caso off', active: false, timeLimitMinutes: 240 })
    const steps = {
      v0: { type: 'start', label: 'V0', url: 'https://x/0', active: true },
      p1: { type: 'clue', label: 'Pista 1', url: 'https://x/1', active: true },
      off: { type: 'normal', label: 'Inactivo', url: 'https://x/2', active: false },
      sol: { type: 'solution', label: 'Solución', url: 'https://x/3', active: true },
    }
    for (const [id, s] of Object.entries(steps)) await setDoc(doc(db, `games/g1/steps/${id}`), s)
    await setDoc(doc(db, 'runs/r1'), {
      gameId: 'g1', alias: 'Equipo', startedAt: Timestamp.now(), endedAt: null,
    })
  })
})

const player = () => env.unauthenticatedContext().firestore()
const admin = () =>
  env.authenticatedContext('a1', { email: ADMIN, email_verified: true }).firestore()
const other = () =>
  env.authenticatedContext('u2', { email: 'otro@gmail.com', email_verified: true }).firestore()
const unverified = () =>
  env.authenticatedContext('a1', { email: ADMIN, email_verified: false }).firestore()

// ---------- Juegos y pasos ----------
test('jugador puede abrir un paso por id pero no listar', async () => {
  await assertSucceeds(getDoc(doc(player(), 'games/g1/steps/sol')))
  await assertFails(getDocs(collection(player(), 'games/g1/steps')))
  await assertFails(getDocs(collection(player(), 'games')))
})
test('jugador no puede escribir juegos ni pasos', async () => {
  await assertFails(setDoc(doc(player(), 'games/gX'), { name: 'x' }))
  await assertFails(updateDoc(doc(player(), 'games/g1/steps/sol'), { url: 'https://evil' }))
  await assertFails(deleteDoc(doc(player(), 'games/g1')))
})
test('solo el admin verificado gestiona juegos', async () => {
  await assertSucceeds(setDoc(doc(admin(), 'games/gN'), { name: 'Nuevo' }))
  await assertFails(setDoc(doc(other(), 'games/gN2'), { name: 'Nuevo' }))
  await assertFails(setDoc(doc(unverified(), 'games/gN3'), { name: 'Nuevo' }))
})

// ---------- Crear partida ----------
const newRun = (over = {}) => ({
  gameId: 'g1', alias: 'Los Sabuesos', startedAt: serverTimestamp(), endedAt: null, ...over,
})
test('jugador crea partida válida', async () => {
  await assertSucceeds(setDoc(doc(player(), 'runs/nueva'), newRun()))
})
test('alias vacío vale; alias de más de 30 caracteres no', async () => {
  await assertSucceeds(setDoc(doc(player(), 'runs/a'), newRun({ alias: '' })))
  await assertFails(setDoc(doc(player(), 'runs/b'), newRun({ alias: 'x'.repeat(31) })))
})
test('partida con hora falsa, ya cerrada, campos extra o juego inactivo/inexistente: rechazada', async () => {
  await assertFails(setDoc(doc(player(), 'runs/c'), newRun({ startedAt: Timestamp.fromMillis(1000) })))
  await assertFails(setDoc(doc(player(), 'runs/d'), newRun({ endedAt: serverTimestamp() })))
  await assertFails(setDoc(doc(player(), 'runs/e'), newRun({ ip: '1.2.3.4' })))
  await assertFails(setDoc(doc(player(), 'runs/f'), newRun({ gameId: 'g2' })))
  await assertFails(setDoc(doc(player(), 'runs/g'), newRun({ gameId: 'nada' })))
})
test('jugador no puede listar ni borrar partidas; admin sí', async () => {
  await assertFails(getDocs(collection(player(), 'runs')))
  await assertFails(deleteDoc(doc(player(), 'runs/r1')))
  await assertSucceeds(getDocs(collection(admin(), 'runs')))
  await assertSucceeds(getDoc(doc(player(), 'runs/r1')))
})

// ---------- Escaneos ----------
const scan = (db, step, runId = 'r1') => setDoc(doc(db, `runs/${runId}/scans/${step}`), { scannedAt: serverTimestamp() })

test('escaneo válido se registra y el repetido se rechaza', async () => {
  await assertSucceeds(scan(player(), 'v0'))
  await assertSucceeds(scan(player(), 'p1'))
  await assertFails(scan(player(), 'p1'))
})
test('escaneo de paso inexistente o inactivo, hora falsa o campos extra: rechazado', async () => {
  await assertFails(scan(player(), 'inventado'))
  await assertFails(scan(player(), 'off'))
  await assertFails(setDoc(doc(player(), 'runs/r1/scans/p1'), { scannedAt: Timestamp.fromMillis(5) }))
  await assertFails(setDoc(doc(player(), 'runs/r1/scans/p1'), { scannedAt: serverTimestamp(), x: 1 }))
})
test('escaneo en partida inexistente: rechazado', async () => {
  await assertFails(scan(player(), 'p1', 'noexiste'))
})
test('no se puede modificar ni borrar un escaneo', async () => {
  await assertSucceeds(scan(player(), 'p1'))
  await assertFails(updateDoc(doc(player(), 'runs/r1/scans/p1'), { scannedAt: serverTimestamp() }))
  await assertFails(deleteDoc(doc(player(), 'runs/r1/scans/p1')))
})
test('pasada la hora límite no se registran escaneos', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'runs/vieja'), {
      gameId: 'g1', alias: '', endedAt: null,
      startedAt: Timestamp.fromMillis(Date.now() - 241 * 60 * 1000),
    })
  })
  await assertFails(scan(player(), 'p1', 'vieja'))
})
test('el límite se lee del juego (no 4 h fijas)', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'games/corto'), { name: 'Corto', active: true, timeLimitMinutes: 30 })
    await setDoc(doc(db, 'games/corto/steps/p'), { type: 'clue', active: true })
    await setDoc(doc(db, 'runs/rc'), {
      gameId: 'corto', alias: '', endedAt: null,
      startedAt: Timestamp.fromMillis(Date.now() - 31 * 60 * 1000),
    })
  })
  await assertFails(scan(player(), 'p', 'rc'))
})

// ---------- Cerrar con la solución ----------
test('escanear la solución cierra la partida (lote)', async () => {
  const db = player()
  const b = writeBatch(db)
  b.set(doc(db, 'runs/r1/scans/sol'), { scannedAt: serverTimestamp() })
  b.update(doc(db, 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'sol' })
  await assertSucceeds(b.commit())
  // ya cerrada: no se puede escanear más ni cerrar otra vez
  await assertFails(scan(player(), 'p1'))
  await assertFails(updateDoc(doc(player(), 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'sol' }))
})
test('no se puede cerrar sin escanear la solución ni con un paso que no es solución', async () => {
  await assertFails(updateDoc(doc(player(), 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'sol' }))
  const db = player()
  const b = writeBatch(db)
  b.set(doc(db, 'runs/r1/scans/p1'), { scannedAt: serverTimestamp() })
  b.update(doc(db, 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'p1' })
  await assertFails(b.commit())
})
test('el jugador no puede cambiar otros campos de la partida', async () => {
  await assertFails(updateDoc(doc(player(), 'runs/r1'), { alias: 'otro' }))
  await assertFails(updateDoc(doc(player(), 'runs/r1'), { startedAt: Timestamp.fromMillis(1) }))
  const db = player()
  const b = writeBatch(db)
  b.set(doc(db, 'runs/r1/scans/sol'), { scannedAt: serverTimestamp() })
  b.update(doc(db, 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'sol', alias: 'hack' })
  await assertFails(b.commit())
})

// ---------- Guardado de juegos desde el editor (src/lib/games.js) ----------
import { saveGame, deleteGame, deleteRun } from '../src/lib/games.js'

const draft = (over = {}) => ({
  id: 'nuevo1', isNew: true, name: ' Caso nuevo ', timeLimitMinutes: '90', active: true,
  steps: [
    { id: 'aaaa2222', label: 'V0', type: 'start', url: 'https://youtube.com/shorts/a', active: true },
    { id: 'bbbb3333', label: 'Solución', type: 'solution', url: 'https://drive.google.com/x', active: true },
  ],
  ...over,
})

test('el admin guarda un juego y un jugador puede abrir sus pasos por id (pero no listar)', async () => {
  await saveGame(admin(), draft())
  const g = await getDoc(doc(player(), 'games/nuevo1'))
  assert.equal(g.data().name, 'Caso nuevo')
  assert.equal(g.data().timeLimitMinutes, 90)
  const s = await getDoc(doc(player(), 'games/nuevo1/steps/bbbb3333'))
  assert.deepEqual([s.data().type, s.data().order, s.data().url], ['solution', 2, 'https://drive.google.com/x'])
  await assertFails(getDocs(collection(player(), 'games/nuevo1/steps')))
})

test('un jugador no puede guardar juegos', async () => {
  await assertFails(saveGame(player(), draft({ id: 'hack' })))
  await assertFails(saveGame(other(), draft({ id: 'hack2' })))
})

test('editar no cambia los ids ni borra pasos: el destino se corrige y el orden se actualiza', async () => {
  await saveGame(admin(), draft())
  const steps = draft().steps.reverse() // cambia el orden
  steps[1].url = 'https://youtube.com/shorts/corregido'
  steps[0].active = false // desactivar, no borrar
  await saveGame(admin(), draft({ isNew: false, steps }))
  const a = await getDoc(doc(player(), 'games/nuevo1/steps/aaaa2222'))
  const b = await getDoc(doc(player(), 'games/nuevo1/steps/bbbb3333'))
  assert.equal(a.data().url, 'https://youtube.com/shorts/corregido')
  assert.equal(a.data().order, 2)
  assert.equal(b.data().active, false)
  assert.equal(b.data().order, 1)
})

test('flujo completo: juego creado en el editor + partida de jugador cerrada con la solución', async () => {
  await saveGame(admin(), draft())
  const db = player()
  await assertSucceeds(setDoc(doc(db, 'runs/rn'), { gameId: 'nuevo1', alias: '', startedAt: serverTimestamp(), endedAt: null }))
  await assertSucceeds(setDoc(doc(db, 'runs/rn/scans/aaaa2222'), { scannedAt: serverTimestamp() }))
  const b = writeBatch(db)
  b.set(doc(db, 'runs/rn/scans/bbbb3333'), { scannedAt: serverTimestamp() })
  b.update(doc(db, 'runs/rn'), { endedAt: serverTimestamp(), endStepId: 'bbbb3333' })
  await assertSucceeds(b.commit())
})

test('borrar un juego se lleva sus pasos, partidas y escaneos; un jugador no puede', async () => {
  await saveGame(admin(), draft())
  const db = player()
  await setDoc(doc(db, 'runs/rd'), { gameId: 'nuevo1', alias: '', startedAt: serverTimestamp(), endedAt: null })
  await setDoc(doc(db, 'runs/rd/scans/aaaa2222'), { scannedAt: serverTimestamp() })
  await assertFails(deleteGame(player(), 'nuevo1'))
  await assertFails(deleteGame(other(), 'nuevo1'))
  assert.equal(await deleteGame(admin(), 'nuevo1'), 1)
  const a = admin()
  assert.equal((await getDoc(doc(a, 'games/nuevo1'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'games/nuevo1/steps/aaaa2222'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'runs/rd'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'runs/rd/scans/aaaa2222'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'games/g1'))).exists(), true) // otros juegos intactos
})

test('borrar una partida se lleva sus escaneos y deja las demás', async () => {
  await saveGame(admin(), draft())
  const db = player()
  for (const id of ['borra1', 'borra2']) {
    await setDoc(doc(db, 'runs/' + id), { gameId: 'nuevo1', alias: '', startedAt: serverTimestamp(), endedAt: null })
    await setDoc(doc(db, 'runs/' + id + '/scans/aaaa2222'), { scannedAt: serverTimestamp() })
  }
  await assertFails(deleteRun(player(), 'borra1'))
  await deleteRun(admin(), 'borra1')
  const a = admin()
  assert.equal((await getDoc(doc(a, 'runs/borra1'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'runs/borra1/scans/aaaa2222'))).exists(), false)
  assert.equal((await getDoc(doc(a, 'runs/borra2'))).exists(), true)
})

// ---------- Progreso personal del Diario ----------
const persona = (uid) => env.authenticatedContext(uid, { email: uid + '@gmail.com', email_verified: true }).firestore()
const dia = (extra = {}) => ({ done: true, tries: 1, hint: false, ms: 95000, type: 'morse', level: 2, n: 5, at: serverTimestamp(), ...extra })

test('Diario: cada persona guarda, lee y borra solo su progreso', async () => {
  const ana = persona('ana')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-16'), dia()))
  assert.equal((await getDoc(doc(ana, 'users/ana/diario/2026-10-16'))).data().ms, 95000)
  assert.equal((await getDocs(collection(ana, 'users/ana/diario'))).size, 1)
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-16'), dia({ tries: 2 }))) // se puede actualizar
  await assertFails(setDoc(doc(persona('beto'), 'users/ana/diario/2026-10-17'), dia())) // no escribe en la cuenta de otra
  await assertFails(getDoc(doc(persona('beto'), 'users/ana/diario/2026-10-16'))) // ni la lee
  await assertFails(getDocs(collection(persona('beto'), 'users/ana/diario')))
  await assertFails(getDoc(doc(player(), 'users/ana/diario/2026-10-16'))) // sin sesión, nada
  await assertFails(setDoc(doc(player(), 'users/ana/diario/2026-10-17'), dia()))
  await assertFails(deleteDoc(doc(persona('beto'), 'users/ana/diario/2026-10-16')))
  await assertSucceeds(deleteDoc(doc(ana, 'users/ana/diario/2026-10-16')))
})

test('Diario: el administrador puede leer el progreso de todos pero no escribirlo por ellos', async () => {
  await assertSucceeds(setDoc(doc(persona('ana'), 'users/ana/diario/2026-10-16'), dia()))
  await assertSucceeds(getDoc(doc(admin(), 'users/ana/diario/2026-10-16')))
  await assertSucceeds(getDocs(collection(admin(), 'users/ana/diario')))
  await assertFails(setDoc(doc(admin(), 'users/ana/diario/2026-10-17'), dia()))
})

test('Diario: se rechazan datos con forma incorrecta', async () => {
  const ana = persona('ana')
  const ruta = (d) => doc(ana, 'users/ana/diario/' + d)
  await assertFails(setDoc(ruta('hoy'), dia())) // el id debe ser una fecha AAAA-MM-DD
  await assertFails(setDoc(ruta('2026-10-16'), dia({ extra: 1 }))) // campo no permitido
  await assertFails(setDoc(ruta('2026-10-16'), dia({ type: 'otro' })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ level: 9 })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ ms: -5 })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ ms: 999999999 })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ tries: 5000 })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ done: 'si' })))
  await assertFails(setDoc(ruta('2026-10-16'), dia({ at: Timestamp.fromMillis(0) }))) // la hora la pone el servidor
  const sin = dia(); delete sin.level
  await assertFails(setDoc(ruta('2026-10-16'), sin))
  await assertFails(setDoc(doc(ana, 'users/ana/otra/2026-10-16'), dia())) // solo existe la carpeta "diario"
  await assertFails(setDoc(doc(ana, 'users/ana'), { x: 1 }))
})

// ---------- Avisos diarios del Diario ----------
const SUB_ID = 'a'.repeat(64)
const sub = (extra = {}) => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'BKey', auth: 'secret', at: serverTimestamp(), ...extra })

test('Avisos: cualquiera puede suscribirse y darse de baja, pero nadie puede leer las suscripciones', async () => {
  await assertSucceeds(setDoc(doc(player(), `pushSubs/${SUB_ID}`), sub()))
  await assertFails(getDoc(doc(player(), `pushSubs/${SUB_ID}`)))
  await assertFails(getDoc(doc(other(), `pushSubs/${SUB_ID}`)))
  await assertFails(getDocs(collection(player(), 'pushSubs')))
  await assertSucceeds(getDoc(doc(admin(), `pushSubs/${SUB_ID}`)))
  await assertSucceeds(deleteDoc(doc(player(), `pushSubs/${SUB_ID}`)))
})
test('Avisos: se rechazan ids y datos con forma incorrecta', async () => {
  await assertFails(setDoc(doc(player(), 'pushSubs/corto'), sub()))
  await assertFails(setDoc(doc(player(), `pushSubs/${SUB_ID}`), sub({ endpoint: 'http://no-seguro' })))
  await assertFails(setDoc(doc(player(), `pushSubs/${SUB_ID}`), sub({ extra: 1 })))
  await assertFails(setDoc(doc(player(), `pushSubs/${SUB_ID}`), sub({ endpoint: 'https://x/' + 'a'.repeat(1000) })))
  await assertFails(setDoc(doc(player(), `pushSubs/${SUB_ID}`), sub({ at: Timestamp.now() })))
  await assertFails(setDoc(doc(player(), `pushSubs/${SUB_ID}`), { endpoint: 'https://x/', p256dh: 'k', at: serverTimestamp() }))
})

// ---------- Mis casos (vincular partidas a la cuenta) ----------
const withUid = (uid) => env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'runs/r1'), { uid }))
const mine = () => env.authenticatedContext('u2', { email: 'otro@gmail.com', email_verified: true }).firestore()
const third = () => env.authenticatedContext('u3', { email: 'tercero@gmail.com', email_verified: true }).firestore()

test('Mis casos: quien tiene sesión vincula una partida sin dueño, una sola vez y solo con su uid', async () => {
  await assertFails(updateDoc(doc(player(), 'runs/r1'), { uid: 'u2' })) // sin sesión
  await assertFails(updateDoc(doc(mine(), 'runs/r1'), { uid: 'u3' })) // uid de otra persona
  await assertFails(updateDoc(doc(mine(), 'runs/r1'), { uid: 'u2', alias: 'Otro' })) // no se toca nada más
  await assertFails(updateDoc(doc(mine(), 'runs/r1'), { uid: 'u2', endedAt: serverTimestamp(), endStepId: 'sol' }))
  await assertSucceeds(updateDoc(doc(mine(), 'runs/r1'), { uid: 'u2' }))
  await assertFails(updateDoc(doc(third(), 'runs/r1'), { uid: 'u3' })) // ya tiene dueño
  await assertFails(updateDoc(doc(mine(), 'runs/r1'), { uid: 'u3' })) // ni el dueño la regala
})
test('Mis casos: cada persona lista solo sus partidas y sus escaneos', async () => {
  await withUid('u2')
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'runs/r1/scans/v0'), { scannedAt: Timestamp.now() }))
  const own = await assertSucceeds(getDocs(query(collection(mine(), 'runs'), where('uid', '==', 'u2'))))
  assert.equal(own.size, 1)
  await assertFails(getDocs(collection(mine(), 'runs'))) // sin filtrar por su uid
  await assertFails(getDocs(query(collection(third(), 'runs'), where('uid', '==', 'u2')))) // filtrando por la de otro
  await assertFails(getDocs(query(collection(player(), 'runs'), where('uid', '==', 'u2'))))
  assert.equal((await assertSucceeds(getDocs(collection(mine(), 'runs/r1/scans')))).size, 1)
  await assertFails(getDocs(collection(third(), 'runs/r1/scans')))
  await assertFails(getDocs(collection(player(), 'runs/r1/scans')))
})
test('Mis casos: una partida sin dueño no aparece en mis partidas ni se pueden listar sus escaneos', async () => {
  await assertFails(getDocs(collection(mine(), 'runs/r1/scans')))
  const own = await assertSucceeds(getDocs(query(collection(mine(), 'runs'), where('uid', '==', 'u2'))))
  assert.equal(own.size, 0)
})
test('Mis casos: el dueño la desvincula; otros no; el administrador conserva la partida', async () => {
  await withUid('u2')
  await assertFails(updateDoc(doc(third(), 'runs/r1'), { uid: deleteField() }))
  await assertFails(updateDoc(doc(mine(), 'runs/r1'), { uid: deleteField(), alias: 'x' }))
  await assertSucceeds(updateDoc(doc(mine(), 'runs/r1'), { uid: deleteField() }))
  assert.equal((await getDoc(doc(admin(), 'runs/r1'))).exists(), true)
  assert.equal('uid' in (await getDoc(doc(admin(), 'runs/r1'))).data(), false)
  await assertFails(deleteDoc(doc(mine(), 'runs/r1'))) // borrar la partida sigue siendo solo del administrador
})
test('Mis casos: con dueño asignado, el grupo (sin sesión) sigue escaneando y cerrando', async () => {
  await withUid('u2')
  const db = player()
  await assertSucceeds(scan(db, 'p1'))
  const b = writeBatch(db)
  b.set(doc(db, 'runs/r1/scans/sol'), { scannedAt: serverTimestamp() })
  b.update(doc(db, 'runs/r1'), { endedAt: serverTimestamp(), endStepId: 'sol' })
  await assertSucceeds(b.commit())
})
test('Diario: el tipo críptico se puede guardar y uno inventado no', async () => {
  const ana = persona('ana')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-16'), dia({ type: 'vigenere', level: 5 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-15'), dia({ type: 'golpes', level: 1 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-14'), dia({ type: 'interrogatorio', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-01'), dia({ type: 'numeros', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-02'), dia({ type: 'rebus', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-03'), dia({ type: 'sinvocales', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-04'), dia({ type: 'intruso', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-05'), dia({ type: 'coartada', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-11-06'), dia({ type: 'binario', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-13'), dia({ type: 'escitala', level: 3 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-12'), dia({ type: 'sopa', level: 2 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-17'), dia({ type: 'criptico', level: 4 })))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-18'), dia({ type: 'inventado' })))
})
test('Perfil del jugador: cada persona guarda el suyo con su correo, el administrador lista todos y nadie más los ve', async () => {
  const ana = persona('ana')
  const perfil = (extra = {}) => ({ name: 'Ana', email: 'ana@gmail.com', first: serverTimestamp(), last: serverTimestamp(), ...extra })
  await assertSucceeds(setDoc(doc(ana, 'users/ana'), perfil()))
  assert.equal((await getDoc(doc(ana, 'users/ana'))).data().email, 'ana@gmail.com')
  await assertFails(setDoc(doc(persona('luis'), 'users/ana'), perfil())) // en el perfil de otra persona no
  await assertFails(setDoc(doc(persona('luis'), 'users/luis'), perfil({ email: 'otro@gmail.com' }))) // el correo debe ser el de la sesión
  await assertFails(setDoc(doc(persona('luis'), 'users/luis'), perfil({ foto: 'x' }))) // solo los campos previstos
  await assertFails(getDoc(doc(persona('luis'), 'users/ana'))) // otra persona no lo lee
  await assertFails(getDocs(collection(persona('luis'), 'users'))) // ni lista a todos
  await assertFails(getDocs(collection(player(), 'users')))
  assert.equal((await getDocs(collection(admin(), 'users'))).size, 1) // el administrador sí
  assert.equal((await getDoc(doc(admin(), 'users/ana'))).data().name, 'Ana')
  await assertFails(getDocs(collection(unverified(), 'users')))
})
test('Perfil del jugador: la fecha de la primera visita no se puede cambiar y el dueño puede borrarlo', async () => {
  const ana = persona('ana')
  await assertSucceeds(setDoc(doc(ana, 'users/ana'), { name: 'Ana', email: 'ana@gmail.com', first: serverTimestamp(), last: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(ana, 'users/ana'), { name: 'Ana B', email: 'ana@gmail.com', last: serverTimestamp() }))
  await assertFails(updateDoc(doc(ana, 'users/ana'), { first: Timestamp.fromDate(new Date('2020-01-01')), last: serverTimestamp() }))
  await assertFails(updateDoc(doc(ana, 'users/ana'), { last: Timestamp.fromDate(new Date('2020-01-01')) })) // "last" lo pone el servidor
  await assertSucceeds(deleteDoc(doc(ana, 'users/ana')))
  assert.equal((await getDoc(doc(ana, 'users/ana'))).exists(), false)
  await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'users/ana'), { name: 'Ana', email: 'ana@gmail.com', first: Timestamp.now(), last: Timestamp.now() }) })
  await assertFails(deleteDoc(doc(persona('luis'), 'users/ana')))
})
test('Diario: la marca "late" (resuelto desde el archivo) es opcional y solo booleana', async () => {
  const ana = persona('ana')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-17'), dia({ late: true })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-18'), dia()))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-19'), dia({ late: 'si' })))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-20'), dia({ puntos: 9999 }))) // los puntos no se guardan
})

test('Perfil: la primera vez no se puede actualizar un perfil que no existe; hay que mirar y crear (cómo lo hace saveProfile)', async () => {
  const ana = persona('ana')
  const datos = () => ({ name: 'Ana', email: 'ana@gmail.com', last: serverTimestamp() })
  await assertFails(updateDoc(doc(ana, 'users/ana'), datos())) // no existe: las reglas lo rechazan (permission-denied, no not-found)
  assert.equal((await assertSucceeds(getDoc(doc(ana, 'users/ana')))).exists(), false) // pero mirar si existe sí se puede
  await assertSucceeds(setDoc(doc(ana, 'users/ana'), { ...datos(), first: serverTimestamp() }))
  await assertSucceeds(updateDoc(doc(ana, 'users/ana'), datos()))
})

// ---------- Valoración de los casos ----------
const cerrar = (id = 'r1', extra = {}) => env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'runs/' + id), { uid: 'u2', endedAt: Timestamp.now(), ...extra }))
const val = (over = {}) => ({ uid: 'u2', gameId: 'g1', runId: 'r1', stars: 4, comment: 'Muy bueno', at: serverTimestamp(), ...over })

test('Valoración: quien terminó el caso lo valora, lo cambia y lo borra; solo una por caso', async () => {
  await cerrar()
  await assertSucceeds(setDoc(doc(mine(), 'valoraciones/u2_g1'), val()))
  await assertSucceeds(setDoc(doc(mine(), 'valoraciones/u2_g1'), val({ stars: 5, comment: '' }))) // cambiar la suya
  assert.equal((await getDoc(doc(mine(), 'valoraciones/u2_g1'))).data().stars, 5)
  await assertFails(setDoc(doc(mine(), 'valoraciones/u2_otra'), val())) // el id debe ser uid_juego
  await assertSucceeds(deleteDoc(doc(mine(), 'valoraciones/u2_g1')))
  assert.equal((await getDoc(doc(admin(), 'valoraciones/u2_g1'))).exists(), false)
})
test('Valoración: no se puede valorar sin partida terminada, con partida ajena ni de otro juego', async () => {
  await assertFails(setDoc(doc(mine(), 'valoraciones/u2_g1'), val())) // la partida no es suya ni está terminada
  await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'runs/r1'), { uid: 'u2' }))
  await assertFails(setDoc(doc(mine(), 'valoraciones/u2_g1'), val())) // suya pero en curso (sin terminar o sin tiempo)
  await assertFails(setDoc(doc(player(), 'valoraciones/u2_g1'), val())) // sin sesión
  await cerrar()
  await assertFails(setDoc(doc(third(), 'valoraciones/u3_g1'), val({ uid: 'u3' }))) // la partida es de u2
  await assertFails(setDoc(doc(mine(), 'valoraciones/u2_g2'), val({ gameId: 'g2' }))) // la partida es del juego g1
  await assertFails(setDoc(doc(mine(), 'valoraciones/u2_g1'), val({ runId: 'noexiste' })))
})
test('Valoración: se rechazan estrellas, comentario y campos con forma incorrecta', async () => {
  await cerrar()
  const ok = (over) => assertSucceeds(setDoc(doc(mine(), 'valoraciones/u2_g1'), val(over)))
  const no = (over) => assertFails(setDoc(doc(mine(), 'valoraciones/u2_g1'), val(over)))
  await no({ stars: 0 }); await no({ stars: 6 }); await no({ stars: 3.5 }); await no({ stars: '5' })
  await no({ comment: 'x'.repeat(301) }); await no({ comment: 7 })
  await no({ at: Timestamp.now() }); await no({ uid: 'u3' }); await no({ extra: 1 })
  await ok({ comment: 'x'.repeat(300), stars: 1 })
})
test('Valoración: cada persona lee solo las suyas; el administrador las lee todas pero no escribe por nadie', async () => {
  await cerrar()
  await assertSucceeds(setDoc(doc(mine(), 'valoraciones/u2_g1'), val()))
  await assertSucceeds(getDoc(doc(mine(), 'valoraciones/u2_g1')))
  await assertFails(getDoc(doc(third(), 'valoraciones/u2_g1')))
  await assertFails(getDoc(doc(player(), 'valoraciones/u2_g1')))
  assert.equal((await assertSucceeds(getDocs(query(collection(mine(), 'valoraciones'), where('uid', '==', 'u2'))))).size, 1)
  await assertFails(getDocs(collection(mine(), 'valoraciones'))) // sin filtrar
  await assertFails(getDocs(query(collection(third(), 'valoraciones'), where('uid', '==', 'u2')))) // filtrando por otra
  assert.equal((await assertSucceeds(getDocs(collection(admin(), 'valoraciones')))).size, 1)
  await assertSucceeds(getDoc(doc(admin(), 'valoraciones/u2_g1')))
  await assertFails(setDoc(doc(admin(), 'valoraciones/u2_g1'), val())) // el admin no escribe como si fuera ella
  await assertFails(deleteDoc(doc(third(), 'valoraciones/u2_g1')))
})

// ---------- Retos de nivel ----------
const reto = (over = {}) => ({ i: 12, done: false, tries: 0, hint: false, ms: 5000, type: 'cesar', level: 2, at: serverTimestamp(), ...over })
test('Reto: cada persona guarda, lee y borra solo los suyos; el administrador los lee pero no escribe por ella', async () => {
  const ana = persona('ana'), otra = persona('bea')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/retos/2026-10-20'), reto()))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/retos/2026-10-20'), reto({ done: true, tries: 1 })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/retos/2026-10-21'), reto({ i: 1003 }))) // acertijo del banco
  assert.equal((await assertSucceeds(getDocs(collection(ana, 'users/ana/retos')))).size, 2)
  await assertFails(getDocs(collection(otra, 'users/ana/retos')))
  await assertFails(setDoc(doc(otra, 'users/ana/retos/2026-10-22'), reto()))
  await assertSucceeds(getDocs(collection(admin(), 'users/ana/retos')))
  await assertFails(setDoc(doc(admin(), 'users/ana/retos/2026-10-22'), reto()))
  await assertSucceeds(deleteDoc(doc(ana, 'users/ana/retos/2026-10-21')))
})
test('Reto: se rechazan datos con forma incorrecta', async () => {
  const ana = persona('ana')
  const no = (over, day = '2026-10-23') => assertFails(setDoc(doc(ana, 'users/ana/retos/' + day), reto(over)))
  await no({ i: -1 }); await no({ i: 5000 }); await no({ i: 'a' }); await no({ level: 6 }); await no({ type: 'inventado' })
  await no({ ms: -1 }); await no({ tries: 1000 }); await no({ at: Timestamp.now() }); await no({ puntos: 99 })
  await no({}, 'mañana')
})

// ---------- Cuaderno de detective ----------
const cuaderno = (over = {}) => ({ text: 'La clienta mintió sobre la hora.', suspects: [{ n: 'Marta', st: 0 }, { n: 'Luis', st: 1 }], at: serverTimestamp(), ...over })
test('Cuaderno: solo su dueño lo lee, escribe y borra; ni el administrador ni nadie más', async () => {
  const ana = persona('ana'), otra = persona('bea')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/cuadernos/g1'), cuaderno()))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/cuadernos/g1'), cuaderno({ text: 'Otra nota', suspects: [] }))) // editar
  assert.equal((await getDoc(doc(ana, 'users/ana/cuadernos/g1'))).data().text, 'Otra nota')
  assert.equal((await assertSucceeds(getDocs(collection(ana, 'users/ana/cuadernos')))).size, 1)
  await assertFails(getDoc(doc(otra, 'users/ana/cuadernos/g1')))
  await assertFails(getDocs(collection(otra, 'users/ana/cuadernos')))
  await assertFails(getDoc(doc(admin(), 'users/ana/cuadernos/g1'))) // privado del todo
  await assertFails(getDocs(collection(admin(), 'users/ana/cuadernos')))
  await assertFails(getDoc(doc(player(), 'users/ana/cuadernos/g1')))
  await assertFails(setDoc(doc(otra, 'users/ana/cuadernos/g2'), cuaderno()))
  await assertFails(setDoc(doc(admin(), 'users/ana/cuadernos/g2'), cuaderno()))
  await assertFails(deleteDoc(doc(otra, 'users/ana/cuadernos/g1')))
  await assertSucceeds(deleteDoc(doc(ana, 'users/ana/cuadernos/g1')))
})
test('Cuaderno: se rechazan textos, listas y sospechosos con forma incorrecta', async () => {
  const ana = persona('ana')
  const ok = (over) => assertSucceeds(setDoc(doc(ana, 'users/ana/cuadernos/g1'), cuaderno(over)))
  const no = (over) => assertFails(setDoc(doc(ana, 'users/ana/cuadernos/g1'), cuaderno(over)))
  await ok({ text: 'x'.repeat(5000) })
  await no({ text: 'x'.repeat(5001) }); await no({ text: 5 })
  const doce = Array.from({ length: 12 }, (_, i) => ({ n: 'S' + i, st: i % 3 }))
  await ok({ suspects: doce })
  await no({ suspects: [...doce, { n: 'Otro', st: 0 }] }) // más de 12
  await no({ suspects: 'Marta' })
  await no({ suspects: [{ n: 'Marta', st: 3 }] }); await no({ suspects: [{ n: 'Marta', st: -1 }] }); await no({ suspects: [{ n: 'Marta', st: 'si' }] })
  await no({ suspects: [{ n: '', st: 0 }] }); await no({ suspects: [{ n: 'x'.repeat(41), st: 0 }] }); await no({ suspects: [{ st: 0 }] })
  await no({ suspects: [{ n: 'Marta', st: 0, extra: 1 }] })
  await no({ suspects: [...doce.slice(0, 11), { n: 'x'.repeat(41), st: 0 }] }) // el último sitio también se comprueba
  await no({ at: Timestamp.now() }); await no({ nota: 'x' })
})

// ---------- Grupos de amigos (ranking semanal) ----------
const grupo = (owner = 'ana', over = {}) => ({ name: 'Los Sabuesos', owner, at: serverTimestamp(), ...over })
const miembro = (name = 'Ana') => ({ name, at: serverTimestamp() })
const puntos = (uid, over = {}) => ({ uid, week: '2026-10-19', pts: 120, solved: 3, streak: 2, at: serverTimestamp(), ...over })
async function crearGrupo(uid = 'ana', code = 'K7M2QX') { // el creador crea el grupo y su ficha de miembro a la vez, como lo hace la app
  const db = persona(uid)
  const b = writeBatch(db)
  b.set(doc(db, 'groups/' + code), grupo(uid))
  b.set(doc(db, `groups/${code}/members/${uid}`), miembro('Ana'))
  b.set(doc(db, `users/${uid}/grupos/${code}`), { name: 'Los Sabuesos', at: serverTimestamp() })
  await assertSucceeds(b.commit())
}
test('Grupos: se crea con código válido y nombre; el creador es el dueño y entra como miembro', async () => {
  await crearGrupo()
  const ana = persona('ana')
  await assertFails(setDoc(doc(ana, 'groups/ABC12'), grupo())) // código corto
  await assertFails(setDoc(doc(ana, 'groups/ABCDE0'), grupo())) // el 0 no vale
  await assertFails(setDoc(doc(ana, 'groups/ABCDEI'), grupo())) // la I no vale
  await assertFails(setDoc(doc(ana, 'groups/PQRSTU'), grupo('otro'))) // el dueño debe ser quien lo crea
  await assertFails(setDoc(doc(ana, 'groups/PQRSTU'), grupo('ana', { name: '' })))
  await assertFails(setDoc(doc(ana, 'groups/PQRSTU'), grupo('ana', { name: 'x'.repeat(41) })))
  await assertFails(setDoc(doc(ana, 'groups/PQRSTU'), grupo('ana', { extra: 1 })))
  await assertFails(setDoc(doc(player(), 'groups/PQRSTU'), grupo('ana'))) // sin sesión
  await assertSucceeds(updateDoc(doc(ana, 'groups/K7M2QX'), { name: 'Los Sabuesos II' })) // el dueño renombra
  await assertFails(updateDoc(doc(ana, 'groups/K7M2QX'), { owner: 'bea' })) // pero no regala el grupo
  await assertFails(updateDoc(doc(persona('bea'), 'groups/K7M2QX'), { name: 'Mío' }))
})
test('Grupos: con el código se ve el nombre y se puede unir; no se pueden listar los grupos', async () => {
  await crearGrupo()
  const bea = persona('bea')
  assert.equal((await assertSucceeds(getDoc(doc(bea, 'groups/K7M2QX')))).data().name, 'Los Sabuesos')
  await assertFails(getDoc(doc(player(), 'groups/K7M2QX'))) // sin sesión no
  await assertFails(getDocs(collection(bea, 'groups')))
  await assertFails(getDocs(collection(bea, 'groups/K7M2QX/members'))) // aún no es miembro
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/members/bea'), miembro('Bea')))
  await assertFails(setDoc(doc(bea, 'groups/K7M2QX/members/otra'), miembro('Falsa'))) // solo se une a sí misma
  await assertFails(setDoc(doc(persona('cam'), 'groups/ZZZZZZ/members/cam'), miembro('Cam'))) // el grupo no existe
  await assertFails(setDoc(doc(bea, 'groups/K7M2QX/members/bea'), { name: 'x'.repeat(31), at: serverTimestamp() }))
  assert.equal((await assertSucceeds(getDocs(collection(bea, 'groups/K7M2QX/members')))).size, 2)
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/members/bea'), miembro('Beatriz'))) // cambia su nombre en el grupo
})
test('Grupos: cada miembro escribe solo sus puntos y solo los miembros ven la clasificación', async () => {
  await crearGrupo()
  const ana = persona('ana'), bea = persona('bea'), cam = persona('cam')
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/members/bea'), miembro('Bea')))
  await assertSucceeds(setDoc(doc(ana, 'groups/K7M2QX/scores/2026-10-19_ana'), puntos('ana')))
  await assertSucceeds(setDoc(doc(ana, 'groups/K7M2QX/scores/2026-10-19_ana'), puntos('ana', { pts: 150 }))) // se actualiza
  await assertFails(setDoc(doc(bea, 'groups/K7M2QX/scores/2026-10-19_ana'), puntos('ana'))) // no escribe por otra
  await assertFails(setDoc(doc(bea, 'groups/K7M2QX/scores/2026-10-19_bea'), puntos('ana'))) // ni se hace pasar
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/scores/2026-10-19_bea'), puntos('bea', { pts: 90 })))
  await assertFails(setDoc(doc(cam, 'groups/K7M2QX/scores/2026-10-19_cam'), puntos('cam'))) // no es miembro
  assert.equal((await assertSucceeds(getDocs(collection(bea, 'groups/K7M2QX/scores')))).size, 2)
  await assertFails(getDocs(collection(cam, 'groups/K7M2QX/scores')))
  await assertFails(getDocs(collection(player(), 'groups/K7M2QX/scores')))
})
test('Grupos: se rechazan puntos con forma incorrecta o fuera de tope', async () => {
  await crearGrupo()
  const ana = persona('ana')
  const ok = (over, id = '2026-10-19_ana') => assertSucceeds(setDoc(doc(ana, 'groups/K7M2QX/scores/' + id), puntos('ana', over)))
  const no = (over, id = '2026-10-19_ana') => assertFails(setDoc(doc(ana, 'groups/K7M2QX/scores/' + id), puntos('ana', over)))
  await ok({ pts: 4000, solved: 14 })
  await no({ pts: 4001 }); await no({ pts: -1 }); await no({ pts: 1.5 }); await no({ pts: '90' })
  await no({ solved: 15 }); await no({ streak: -1 }); await no({ streak: 10000 })
  await no({ week: '19/10/2026' }, '19/10/2026_ana'); await no({ week: '2026-10-26' }) // el id debe ser semana_uid
  await no({ at: Timestamp.now() }); await no({ extra: 1 })
})
test('Grupos: salir, echar y borrar; el administrador lee todo pero no escribe', async () => {
  await crearGrupo()
  const ana = persona('ana'), bea = persona('bea'), cam = persona('cam')
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/members/bea'), miembro('Bea')))
  await assertSucceeds(setDoc(doc(cam, 'groups/K7M2QX/members/cam'), miembro('Cam')))
  await assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/scores/2026-10-19_bea'), puntos('bea')))
  // el administrador ve nombre, miembros y puntos, y lista los grupos; no escribe
  assert.equal((await assertSucceeds(getDocs(collection(admin(), 'groups')))).size, 1)
  assert.equal((await assertSucceeds(getDocs(collection(admin(), 'groups/K7M2QX/members')))).size, 3)
  assert.equal((await assertSucceeds(getDocs(collection(admin(), 'groups/K7M2QX/scores')))).size, 1)
  await assertFails(setDoc(doc(admin(), 'groups/K7M2QX/members/falso'), miembro('Falso')))
  await assertFails(deleteDoc(doc(admin(), 'groups/K7M2QX')))
  // salir: cada uno de sí mismo; echar: solo el dueño
  await assertFails(deleteDoc(doc(cam, 'groups/K7M2QX/members/bea'))) // no echa a otro
  await assertSucceeds(deleteDoc(doc(bea, 'groups/K7M2QX/scores/2026-10-19_bea')))
  await assertSucceeds(deleteDoc(doc(bea, 'groups/K7M2QX/members/bea'))) // sale
  await assertSucceeds(deleteDoc(doc(ana, 'groups/K7M2QX/members/cam'))) // el dueño echa
  await assertFails(getDocs(collection(bea, 'groups/K7M2QX/members'))) // ya no es miembro
  await assertFails(deleteDoc(doc(bea, 'groups/K7M2QX'))) // solo el dueño borra el grupo
  await assertSucceeds(deleteDoc(doc(ana, 'groups/K7M2QX')))
})
test('Grupos: la lista personal de grupos es de su dueño (y la lee el administrador)', async () => {
  const ana = persona('ana')
  const fila = { name: 'Los Sabuesos', at: serverTimestamp() }
  await assertSucceeds(setDoc(doc(ana, 'users/ana/grupos/K7M2QX'), fila))
  await assertFails(setDoc(doc(persona('bea'), 'users/ana/grupos/PQRSTU'), fila))
  await assertFails(setDoc(doc(ana, 'users/ana/grupos/abc'), fila)) // código inválido
  await assertFails(getDocs(collection(persona('bea'), 'users/ana/grupos')))
  assert.equal((await assertSucceeds(getDocs(collection(ana, 'users/ana/grupos')))).size, 1)
  await assertSucceeds(getDocs(collection(admin(), 'users/ana/grupos')))
  await assertSucceeds(deleteDoc(doc(ana, 'users/ana/grupos/K7M2QX')))
})

// ---------- Chat del grupo (privado: solo miembros; ni el administrador lo lee) ----------
const mensaje = (uid, name, text = 'Hola', over = {}) => ({ uid, name, text, at: serverTimestamp(), ...over })
async function grupoConBea() { // grupo de Ana con Bea (miembro) y Carlos (miembro)
  await crearGrupo()
  await assertSucceeds(setDoc(doc(persona('bea'), 'groups/K7M2QX/members/bea'), miembro('Bea')))
  await assertSucceeds(setDoc(doc(persona('carlos'), 'groups/K7M2QX/members/carlos'), miembro('Carlos')))
}
test('Chat: solo los miembros leen; ni el administrador, ni quien no es del grupo, ni sin sesión', async () => {
  await grupoConBea()
  await assertSucceeds(setDoc(doc(persona('bea'), 'groups/K7M2QX/messages/m1'), mensaje('bea', 'Bea')))
  assert.equal((await assertSucceeds(getDocs(collection(persona('ana'), 'groups/K7M2QX/messages')))).size, 1)
  assert.equal((await assertSucceeds(getDoc(doc(persona('carlos'), 'groups/K7M2QX/messages/m1')))).data().text, 'Hola')
  await assertFails(getDocs(collection(admin(), 'groups/K7M2QX/messages')))
  await assertFails(getDoc(doc(admin(), 'groups/K7M2QX/messages/m1')))
  await assertFails(getDocs(collection(persona('intruso'), 'groups/K7M2QX/messages')))
  await assertFails(getDocs(collection(player(), 'groups/K7M2QX/messages')))
})
test('Chat: se escribe con tu nombre del grupo, 1 a 300 caracteres y sin campos de más', async () => {
  await grupoConBea()
  const bea = persona('bea')
  const ok = (over, id) => assertSucceeds(setDoc(doc(bea, 'groups/K7M2QX/messages/' + id), mensaje('bea', 'Bea', 'Hola', over)))
  const no = (over, id = 'x') => assertFails(setDoc(doc(bea, 'groups/K7M2QX/messages/' + id), mensaje('bea', 'Bea', 'Hola', over)))
  await ok({}, 'a')
  await ok({ text: 'x'.repeat(300) }, 'b')
  await no({ text: '' }); await no({ text: 'x'.repeat(301) }); await no({ text: 5 })
  await no({ name: 'Ana' }) // hacerse pasar por otra persona del grupo
  await no({ uid: 'ana' }); await no({ extra: 1 }); await no({ at: Timestamp.now() })
  await assertFails(setDoc(doc(persona('intruso'), 'groups/K7M2QX/messages/z'), mensaje('intruso', 'Intruso'))) // no es del grupo
  await assertFails(setDoc(doc(admin(), 'groups/K7M2QX/messages/z'), mensaje('a1', 'Admin'))) // el administrador tampoco
  await assertFails(setDoc(doc(player(), 'groups/K7M2QX/messages/z'), mensaje('bea', 'Bea')))
  await assertFails(updateDoc(doc(bea, 'groups/K7M2QX/messages/a'), { text: 'editado' })) // no se editan
})
test('Chat: borra el autor, el creador y los moderadores; nadie más', async () => {
  await grupoConBea()
  const msg = async (id, uid, name) => assertSucceeds(setDoc(doc(persona(uid), 'groups/K7M2QX/messages/' + id), mensaje(uid, name)))
  await msg('m1', 'bea', 'Bea'); await msg('m2', 'bea', 'Bea'); await msg('m3', 'bea', 'Bea'); await msg('m4', 'bea', 'Bea')
  await assertFails(deleteDoc(doc(persona('carlos'), 'groups/K7M2QX/messages/m1'))) // otro miembro, aún sin permiso
  await assertFails(deleteDoc(doc(admin(), 'groups/K7M2QX/messages/m1')))
  await assertFails(deleteDoc(doc(persona('intruso'), 'groups/K7M2QX/messages/m1')))
  await assertSucceeds(deleteDoc(doc(persona('bea'), 'groups/K7M2QX/messages/m1'))) // el autor
  await assertSucceeds(deleteDoc(doc(persona('ana'), 'groups/K7M2QX/messages/m2'))) // el creador
  await assertSucceeds(setDoc(doc(persona('ana'), 'groups/K7M2QX/mods/carlos'), { at: serverTimestamp() })) // Ana nombra moderador a Carlos
  await assertSucceeds(deleteDoc(doc(persona('carlos'), 'groups/K7M2QX/messages/m3'))) // ahora Carlos puede
  await assertSucceeds(deleteDoc(doc(persona('ana'), 'groups/K7M2QX/mods/carlos'))) // Ana le quita el permiso
  await assertFails(deleteDoc(doc(persona('carlos'), 'groups/K7M2QX/messages/m4')))
})
test('Chat: solo el creador nombra moderadores, y deben ser miembros', async () => {
  await grupoConBea()
  const modDoc = { at: serverTimestamp() }
  await assertFails(setDoc(doc(persona('bea'), 'groups/K7M2QX/mods/bea'), modDoc)) // nadie se nombra a sí mismo
  await assertFails(setDoc(doc(persona('bea'), 'groups/K7M2QX/mods/carlos'), modDoc))
  await assertFails(setDoc(doc(admin(), 'groups/K7M2QX/mods/bea'), modDoc))
  await assertFails(setDoc(doc(persona('ana'), 'groups/K7M2QX/mods/intruso'), modDoc)) // no es del grupo
  await assertFails(setDoc(doc(persona('ana'), 'groups/K7M2QX/mods/bea'), { at: serverTimestamp(), extra: 1 }))
  await assertSucceeds(setDoc(doc(persona('ana'), 'groups/K7M2QX/mods/bea'), modDoc))
  await assertFails(setDoc(doc(persona('bea'), 'groups/K7M2QX/mods/carlos'), modDoc)) // un moderador no nombra a otros
  assert.equal((await assertSucceeds(getDocs(collection(persona('carlos'), 'groups/K7M2QX/mods')))).size, 1)
  await assertFails(getDocs(collection(persona('intruso'), 'groups/K7M2QX/mods')))
  await assertSucceeds(deleteDoc(doc(persona('bea'), 'groups/K7M2QX/mods/bea'))) // puede renunciar
})
