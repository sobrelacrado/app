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

export function totalPoints(days) {
  let sum = 0
  for (const [key, d] of Object.entries(days)) if (d?.done) sum += dayPoints(d, streakBefore(days, key)).total
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

export const fmtMult = (m) => `×${String(m).replace('.', ',')}`
