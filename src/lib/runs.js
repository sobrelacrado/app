export const ADMIN_EMAIL = 'sobrelacradojuegos@gmail.com' // solo orientativo: la seguridad real son las reglas
export const DEFAULT_LIMIT_MIN = 240
export const IDLE_MIN = 20 // minutos sin escanear para marcar "sin actividad"

// Estado de una partida. Sin servidor que la cierre, el límite se calcula aquí.
export function runStatus(run, game, now) {
  const limit = (game?.timeLimitMinutes ?? DEFAULT_LIMIT_MIN) * 60000
  const start = run.startedAt.getTime()
  if (run.endedAt) return { kind: 'finished', ms: run.endedAt.getTime() - start }
  if (now >= start + limit) return { kind: 'timeout', ms: limit }
  return { kind: 'open', ms: now - start }
}

export function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

export const fmtClock = (d, lang) =>
  d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
export const fmtDateTime = (d, lang) =>
  d.toLocaleString(lang, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function sortSteps(steps) {
  return [...steps].sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.label).localeCompare(b.label))
}
