// Datos de prueba para el emulador local (nunca toca la base de datos real).
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'app-sobre-lacrado',
  firestore: { host: '127.0.0.1', port: 8080 },
})

const ago = (min) => Timestamp.fromMillis(Date.now() - min * 60000)

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'games/demo'), { name: 'Caso demo', active: true, timeLimitMinutes: 240 })
  const steps = {
    v0: { type: 'start', label: 'V0 · Inicio', url: 'https://example.com/inicio', active: true, order: 1 },
    v1: { type: 'normal', label: 'V1 · Entrevista', url: 'https://example.com/v1', active: true, order: 2 },
    p1: { type: 'clue', label: 'Pista 1', url: 'https://example.com/pista1', active: true, order: 3 },
    p2: { type: 'clue', label: 'Pista 2', url: 'https://example.com/pista2', active: true, order: 4 },
    sol: { type: 'solution', label: 'Solución', url: 'https://example.com/solucion', active: true, order: 5 },
  }
  for (const [id, s] of Object.entries(steps)) await setDoc(doc(db, `games/demo/steps/${id}`), s)

  const runs = [
    // En curso, activa: último escaneo hace 3 min
    { id: 'activa', alias: 'Los Sabuesos', start: 25, endedAgo: null, scans: { v0: 25, v1: 15, p1: 3 } },
    // En curso, atascada: último escaneo hace 40 min
    { id: 'atascada', alias: '', start: 60, endedAgo: null, scans: { v0: 60, v1: 40 } },
    // Terminada en 70 min
    { id: 'terminada', alias: 'Equipo Rojo', start: 200, endedAgo: 130, scans: { v0: 200, v1: 180, p1: 150, p2: 140, sol: 130 }, endStepId: 'sol' },
    // Sin terminar, pasadas las 4 h
    { id: 'agotada', alias: 'Los Lentos', start: 300, endedAgo: null, scans: { v0: 300, v1: 280 } },
  ]
  // Histórico de ~5 semanas para ver las estadísticas (generado de forma repetible, sin azar).
  const alias = ['Los Sabuesos', 'Equipo Rojo', '', 'Lupa y Café', '=SUMA(1+1)', 'Trío Fantástico']
  for (let i = 0; i < 24; i++) {
    const start = 1440 * (1 + Math.floor(i * 1.4)) + (i % 5) * 70 + 400
    const speed = 50 + ((i * 17) % 60) // minutos totales de las que terminan
    const finishes = i % 4 !== 3
    const scans = { v0: start, v1: start - Math.round(speed * 0.2), p1: start - Math.round(speed * 0.5) }
    if (i % 3 === 0) scans.p2 = start - Math.round(speed * 0.7)
    if (finishes) scans.sol = start - speed
    else delete scans.p1 // las que no terminan se quedan atascadas pronto
    runs.push({
      id: `hist${i}`, alias: alias[i % alias.length], start,
      endedAgo: finishes ? start - speed : null, scans, ...(finishes ? { endStepId: 'sol' } : {}),
    })
  }
  for (const r of runs) {
    await setDoc(doc(db, 'runs', r.id), {
      gameId: 'demo', alias: r.alias, startedAt: ago(r.start),
      endedAt: r.endedAgo === null ? null : ago(r.endedAgo),
      ...(r.endStepId ? { endStepId: r.endStepId } : {}),
    })
    for (const [stepId, min] of Object.entries(r.scans)) {
      await setDoc(doc(db, 'runs', r.id, 'scans', stepId), { scannedAt: ago(min) })
    }
  }
})
await env.cleanup()
console.log('Datos de prueba creados')
