// Reto de tu nivel: un acertijo extra al día cuya dificultad depende del rango de puntos. Lógica pura (probada en tests/diario.test.js).
// Sale del banco de retos (tanda aparte, fuera del calendario) y de los acertijos de días que ya han pasado; nunca de los que aún no han salido.
import { dayIndex, shuffled } from './ciphers.js'
import { levelForPoints } from './points.js'

export const BANK_BASE = 1000 // los del banco se numeran 1000, 1001... para no mezclarlos con la posición en la lista del calendario
const slot = (key, len) => ((dayIndex(key) % len) + len) % len
export const retoPuzzle = (puzzles, bank, i) => (i >= BANK_BASE ? bank[i - BANK_BASE] : puzzles[i])

// Elige el reto de una fecha: { i, level } o null si aún no hay ninguno disponible.
// - Del nivel que toca por rango, entre los que esa persona todavía no ha resuelto (ni en su día, ni en el archivo, ni como reto) y que no son el de hoy.
// - Si ya resolvió todos los de su nivel, baja al nivel anterior; si ya no queda ninguno sin resolver, repite uno del suyo.
// - El orden de cada nivel es fijo y solo depende de la fecha: quien tiene el mismo rango y el mismo historial recibe el mismo reto.
export function retoFor(puzzles, bank, key, points, days = {}, retos = {}) {
  const L = puzzles.length
  const idx = dayIndex(key)
  const solved = new Set()
  for (const [k, d] of Object.entries(days)) if (d?.done) solved.add(slot(k, L))
  for (const r of Object.values(retos)) if (r?.done && Number.isInteger(r.i)) solved.add(r.i)
  const today = slot(key, L)
  const pool = [] // { id, level }
  puzzles.forEach((p, i) => { if (i !== today && (idx >= L || i < idx)) pool.push({ id: i, level: p.level }) })
  bank.forEach((p, j) => pool.push({ id: BANK_BASE + j, level: p.level }))
  const top = levelForPoints(points)
  const order = (lv) => shuffled(pool.filter((c) => c.level === lv).map((c) => c.id), 700 + lv)
  const at = (ids) => ((idx % ids.length) + ids.length) % ids.length
  for (let lv = top; lv >= 1; lv--) {
    const ids = order(lv)
    for (let t = 0; t < ids.length; t++) {
      const i = ids[(at(ids) + t) % ids.length]
      if (!solved.has(i)) return { i, level: lv }
    }
  }
  const ids = order(top) // todo resuelto: se repite uno de su nivel
  return ids.length ? { i: ids[at(ids)], level: top } : null
}
