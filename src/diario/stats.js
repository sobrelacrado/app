// Estadísticas personales del Diario y mezcla del progreso del móvil con el de la nube (lógica pura, probada en tests/diario.test.js).
import { dayIndex, nextKey, puzzleFor, streakOf } from './ciphers.js'

// Mejor racha de días seguidos resueltos de todo el historial.
export function bestStreak(days) {
  const keys = Object.keys(days).filter((k) => days[k]?.done && !days[k].late).sort() // los del archivo no cuentan
  let best = 0, run = 0, prev = null
  for (const k of keys) {
    run = prev && nextKey(prev) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

// Cuatro semanas completas (lunes a domingo) que terminan en la semana de hoy: [{ key, state }]
// state: 'done' (resuelto en su día) · 'late' (resuelto desde el archivo) · 'miss' (pasó sin resolver) · 'today' (hoy, sin resolver) · 'future'
export function calendar(days, todayKey, weeks = 4) {
  const dow = ((dayIndex(todayKey) % 7) + 7) % 7 // 0 = lunes (DAY_ONE es lunes)
  const first = nextKey(todayKey, -(dow + 7 * (weeks - 1)))
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const key = nextKey(first, i)
    const state = days[key]?.done ? (days[key].late ? 'late' : 'done') : key === todayKey ? 'today' : key > todayKey ? 'future' : 'miss'
    return { key, state }
  })
}

export function diarioStats(days, todayKey, puzzles) {
  const done = Object.entries(days).filter(([, d]) => d?.done)
  const pct = (n) => (done.length ? Math.round((n / done.length) * 100) : null)
  const byType = {}
  for (const [key, d] of done) {
    const type = d.type ?? puzzleFor(puzzles, key).type
    const t = (byType[type] ??= { count: 0, ms: 0 })
    t.count++
    t.ms += d.ms ?? 0
  }
  const types = Object.entries(byType)
    .map(([type, t]) => ({ type, count: t.count, avgMs: t.ms / t.count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
  return {
    solved: done.length,
    streak: streakOf(days, todayKey),
    best: bestStreak(days),
    avgMs: done.length ? done.reduce((n, [, d]) => n + (d.ms ?? 0), 0) / done.length : null,
    firstTryPct: pct(done.filter(([, d]) => !d.tries).length),
    noHintPct: pct(done.filter(([, d]) => !d.hint).length),
    types,
    calendar: calendar(days, todayKey),
  }
}

// Mezcla lo guardado en el móvil con lo guardado en la nube. Un día resuelto gana a uno sin resolver;
// si ambos están resueltos se queda el de la nube (el primero que se guardó). `upload` = días que hay que subir.
export function mergeDays(local = {}, remote = {}) {
  const merged = {}, upload = []
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const l = local[key], r = remote[key]
    if (!l) { merged[key] = r; continue }
    if (!r) { merged[key] = l; upload.push(key); continue }
    if (r.done) { // resuelto en la nube: manda la nube (también si fue en su día o desde el archivo)
      const m = { ...l, ...r }
      if (!r.late) delete m.late
      merged[key] = m
      continue
    }
    if (l.done) { merged[key] = l; upload.push(key); continue } // resuelto solo en el móvil: se sube
    // ninguno resuelto: se conservan los fallos y la pista de ambos
    const m = { ...l, ...r, hint: !!(l.hint || r.hint), tries: Math.max(l.tries ?? 0, r.tries ?? 0) }
    merged[key] = m
    if (m.hint !== !!r.hint || m.tries !== (r.tries ?? 0)) upload.push(key)
  }
  return { merged, upload }
}
