// Calendario del archivo del Diario (lógica pura): meses desde el primer día hasta hoy, con el estado de cada día.
import { DAY_ONE, dayIndex, nextKey } from './ciphers.js'

// Estado de un día: 'done' (resuelto en su día) · 'late' (resuelto desde el archivo) · 'started' (empezado sin resolver)
// · 'miss' (sin jugar) · 'today' · 'future' (aún no existe) · 'before' (antes del primer día)
export function dayState(days, key, todayKey) {
  if (key < DAY_ONE) return 'before'
  if (key > todayKey) return 'future'
  const d = days[key]
  if (d?.done) return d.late ? 'late' : 'done'
  if (key === todayKey) return 'today'
  return d && (d.tries > 0 || d.hint || d.ms > 3000) ? 'started' : 'miss'
}

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es', { month: 'long', timeZone: 'UTC' })
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`
}

// Lunes = 0 (DAY_ONE es lunes). Devuelve los meses del más reciente al más antiguo.
// Cada mes: { label, key (AAAA-MM), blanks (huecos antes del día 1), cells: [{ key, day, state }] }
export function archiveMonths(days, todayKey) {
  const months = []
  const [ty, tm] = todayKey.split('-').map(Number)
  const [fy, fm] = DAY_ONE.split('-').map(Number)
  for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? (y++, m = 1) : m++) {
    const first = `${y}-${String(m).padStart(2, '0')}-01`
    const length = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const blanks = ((dayIndex(first) % 7) + 7) % 7
    const cells = Array.from({ length }, (_, i) => {
      const key = nextKey(first, i)
      return { key, day: i + 1, state: dayState(days, key, todayKey) }
    })
    months.push({ label: monthLabel(first), key: first.slice(0, 7), blanks, cells })
  }
  return months.reverse()
}

// Resumen para la cabecera del archivo: días resueltos y días jugables (desde el primero hasta ayer).
export function archiveSummary(days, todayKey) {
  const total = Math.max(0, dayIndex(todayKey))
  let done = 0
  for (let i = 0; i < total; i++) if (days[nextKey(DAY_ONE, i)]?.done) done++
  return { done, total }
}
