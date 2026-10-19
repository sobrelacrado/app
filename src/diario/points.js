// Puntos del Diario (lógica pura, probada en tests/diario.test.js). No hay ranking entre jugadores: los puntos son personales y se calculan en el móvil.
//
// Un acertijo resuelto el MISMO DÍA da:  10 puntos por nivel  ×  (1 + 0,5 si no hubo fallos + 0,25 si no se pidió pista)  ×  multiplicador de racha.
// El multiplicador de racha es 1 + 0,1 por cada día seguido anterior (máximo ×2 con 10 días).
// Un acertijo del archivo (resuelto otro día) da la mitad, sin multiplicador, y no suma racha.
// Los puntos no se guardan: se calculan siempre a partir de los días resueltos (así cualquier cambio de reglas es coherente).
import { nextKey } from './ciphers.js'

export const POINTS_PER_LEVEL = 10
export const MAX_STREAK_FOR_BONUS = 10
export const onTime = (d) => !!d?.done && !d.late

// Días seguidos resueltos en su día justo antes de `key`.
export function streakBefore(days, key) {
  let n = 0
  for (let k = nextKey(key, -1); onTime(days[k]); k = nextKey(k, -1)) n++
  return n
}

// ×1, ×1,1 ... ×2 (se calcula con enteros para evitar 1.3000000000000003)
export const multiplier = (streak) => (10 + Math.min(Math.max(streak, 0), MAX_STREAK_FOR_BONUS)) / 10

// Desglose de los puntos de un día resuelto. streak = racha anterior a ese día.
export function dayPoints(d, streak) {
  const base = (d.level ?? 1) * POINTS_PER_LEVEL
  const firstTry = !d.tries
  const noHint = !d.hint
  const bonus = (firstTry ? 0.5 : 0) + (noHint ? 0.25 : 0)
  const subtotal = Math.round(base * (1 + bonus))
  if (d.late) return { base, firstTry, noHint, subtotal, multiplier: 1, late: true, total: Math.round(subtotal / 2) }
  const mult = multiplier(streak)
  return { base, firstTry, noHint, subtotal, multiplier: mult, late: false, total: Math.round(subtotal * mult) }
}

// Reto de tu nivel (un acertijo extra al día, elegido según el rango): los mismos puntos por nivel y bonus que el del día,
// sin multiplicador de racha, y un extra del 50 % por ser un reto personal.
export const RETO_BONUS = 1.5
export function retoPoints(d) {
  const base = (d.level ?? 1) * POINTS_PER_LEVEL
  const firstTry = !d.tries
  const noHint = !d.hint
  const subtotal = Math.round(base * (1 + (firstTry ? 0.5 : 0) + (noHint ? 0.25 : 0)))
  return { base, firstTry, noHint, subtotal, extra: RETO_BONUS, total: Math.round(subtotal * RETO_BONUS) }
}

// `retos` = los retos de nivel resueltos (mismo formato que los días, uno por fecha).
export function totalPoints(days, retos = {}) {
  let sum = 0
  for (const [key, d] of Object.entries(days)) if (d?.done) sum += dayPoints(d, streakBefore(days, key)).total
  for (const r of Object.values(retos)) if (r?.done) sum += retoPoints(r).total
  return sum
}

// Multiplicador que tendría el acertijo de hoy si se resolviera ahora.
export const todayMultiplier = (days, todayKey) => multiplier(streakBefore(days, todayKey))

export const RANKS = [
  { name: 'Aprendiz', from: 0 },
  { name: 'Ayudante', from: 200 },
  { name: 'Detective', from: 600 },
  { name: 'Inspector', from: 1500 },
  { name: 'Comisario', from: 3500 },
  { name: 'Maestro del código', from: 7000 },
]

export function rankOf(points) {
  let i = 0
  while (i + 1 < RANKS.length && points >= RANKS[i + 1].from) i++
  const next = RANKS[i + 1] ?? null
  const span = next ? next.from - RANKS[i].from : 1
  return { name: RANKS[i].name, next: next?.name ?? null, toNext: next ? next.from - points : 0, fraction: next ? (points - RANKS[i].from) / span : 1 }
}

// Nivel (1-5) del reto personal según el rango: Aprendiz 1, Ayudante 2, Detective 3, Inspector 4, Comisario y Maestro 5.
export const levelForPoints = (points) => Math.min(5, RANKS.findIndex((r) => r.name === rankOf(points).name) + 1)

// ---------- Semana (ranking entre amigos): de lunes a domingo ----------
// Lunes de la semana a la que pertenece una fecha (AAAA-MM-DD).
export function weekStart(key) {
  const [y, m, d] = key.split('-').map(Number)
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7 // 0 = lunes
  return nextKey(key, -dow)
}
// Puntos de esa semana: los acertijos resueltos EN SU DÍA (con racha y bonus) y los retos de nivel. El archivo no cuenta.
// Devuelve { pts, solved } (solved = acertijos del día + retos resueltos, como mucho 14).
export function weeklyPoints(days, retos, weekKey) {
  let pts = 0, solved = 0
  for (let i = 0; i < 7; i++) {
    const k = nextKey(weekKey, i)
    const d = days[k]
    if (d?.done && !d.late) { pts += dayPoints(d, streakBefore(days, k)).total; solved++ }
    const r = retos?.[k]
    if (r?.done) { pts += retoPoints(r).total; solved++ }
  }
  return { pts, solved }
}

// Clasificación de un grupo en una semana: más puntos primero; a igualdad, más acertijos y luego por nombre.
// members = [{ uid, name }], scores = { semana: { uid: { pts, solved, streak } } }; `mine` = { uid, pts, solved, streak } para poner tu fila al día.
export function weeklyRanking(members, scores, week, mine = null) {
  return members
    .map((m) => {
      const s = mine && mine.uid === m.uid ? mine : scores?.[week]?.[m.uid]
      return { ...m, pts: s?.pts ?? 0, solved: s?.solved ?? 0, streak: s?.streak ?? 0 }
    })
    .sort((a, b) => b.pts - a.pts || b.solved - a.solved || a.name.localeCompare(b.name, 'es'))
}

export const fmtMult = (m) => `×${String(m).replace('.', ',')}`
