// Resumen de una partida para "Mis casos" (lógica pura, probada en tests/diario.test.js).
import { runStatus } from '../lib/runs.js'

// run: { startedAt: Date, endedAt: Date|null } · game: { timeLimitMinutes } · scans: [{ id, at: Date }]
// steps: { [stepId]: { label, type } } · devuelve el estado y, por cada paso escaneado, el tiempo desde el paso anterior.
export function caseSummary(run, game, scans, steps, now) {
  const status = runStatus(run, game, now)
  const sorted = scans.filter((s) => s.at).sort((a, b) => a.at - b.at)
  let prev = run.startedAt.getTime()
  const rows = sorted.map((s) => {
    const ms = Math.max(0, s.at.getTime() - prev)
    prev = s.at.getTime()
    const step = steps[s.id] ?? {}
    return { id: s.id, type: step.type, label: step.type === 'start' ? 'Inicio' : step.label ?? 'Paso', ms, elapsed: s.at.getTime() - run.startedAt.getTime() }
  })
  return { status, rows }
}

export const STATUS_TEXT = { finished: 'Terminada', timeout: 'Tiempo agotado', open: 'En curso' }
