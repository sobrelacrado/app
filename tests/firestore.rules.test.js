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
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-17'), dia({ type: 'criptico', level: 4 })))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-18'), dia({ type: 'inventado' })))
})
test('Diario: la marca "late" (resuelto desde el archivo) es opcional y solo booleana', async () => {
  const ana = persona('ana')
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-17'), dia({ late: true })))
  await assertSucceeds(setDoc(doc(ana, 'users/ana/diario/2026-10-18'), dia()))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-19'), dia({ late: 'si' })))
  await assertFails(setDoc(doc(ana, 'users/ana/diario/2026-10-20'), dia({ puntos: 9999 }))) // los puntos no se guardan
})
