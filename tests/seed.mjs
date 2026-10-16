// Datos de prueba para el emulador local (nunca toca la base de datos real).
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'

const env = await initializeTestEnvironment({
  projectId: 'app-sobre-lacrado',
  firestore: { host: '127.0.0.1', port: 8080 },
})
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'games/demo'), { name: 'Caso demo', active: true, timeLimitMinutes: 240 })
  const steps = {
    v0: { type: 'start', label: 'V0', url: 'https://example.com/inicio', active: true },
    p1: { type: 'clue', label: 'Pista 1', url: 'https://example.com/pista1', active: true },
    sol: { type: 'solution', label: 'Solución', url: 'https://example.com/solucion', active: true },
  }
  for (const [id, s] of Object.entries(steps)) await setDoc(doc(db, `games/demo/steps/${id}`), s)
})
await env.cleanup()
console.log('Datos de prueba creados')
