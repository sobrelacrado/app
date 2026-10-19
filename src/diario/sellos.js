// Sellos: puzzle de práctica ilimitada. En un tablero de n×n con n regiones de color hay que poner n sellos de lacre:
// uno por fila, uno por columna, uno por región de color, y sin que dos se toquen (ni en diagonal).
// Los tableros se fabrican en el móvil y se comprueba que cada uno tiene UNA sola solución, así que nunca se acaban.

import { nextKey } from './ciphers.js'

export const SIZES = [5, 6, 7, 8, 9]

// Generador de números al azar con semilla: la misma semilla da siempre el mismo tablero (así se puede retomar una partida).
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = (list, rand) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Una colocación válida al azar: queens[fila] = columna, sin repetir columna y sin tocarse con la fila de arriba.
function placement(n, rand) {
  const cols = new Array(n)
  const used = new Array(n).fill(false)
  const go = (r) => {
    if (r === n) return true
    for (const c of shuffle([...Array(n).keys()], rand)) {
      if (used[c] || (r > 0 && Math.abs(c - cols[r - 1]) < 2)) continue
      cols[r] = c
      used[c] = true
      if (go(r + 1)) return true
      used[c] = false
    }
    return false
  }
  return go(0) ? cols : null
}

// Regiones: cada sello es la semilla de una región, que crece al azar por casillas vecinas hasta cubrir todo el tablero.
function grow(n, cols, rand) {
  const reg = new Array(n * n).fill(-1)
  cols.forEach((c, r) => { reg[r * n + c] = r })
  let left = n * n - n
  while (left > 0) {
    const id = Math.floor(rand() * n)
    const edge = []
    for (let i = 0; i < reg.length; i++) if (reg[i] === id) for (const j of around(n, i)) if (reg[j] === -1) edge.push(j)
    if (!edge.length) continue
    reg[edge[Math.floor(rand() * edge.length)]] = id
    left--
  }
  return reg
}

// Busca soluciones (se para en `limit`): fila a fila, una columna por fila, una región por sello, sin tocarse con la fila de arriba.
// Cada solución es una lista con la columna de cada fila.
export function solutions(n, regions, limit = 2) {
  const out = []
  const cols = new Array(n)
  const used = new Array(n).fill(false)
  const usedReg = new Array(n).fill(false)
  const go = (r) => {
    if (r === n) { out.push([...cols]); return }
    for (let c = 0; c < n && out.length < limit; c++) {
      const g = regions[r * n + c]
      if (used[c] || usedReg[g] || (r > 0 && Math.abs(c - cols[r - 1]) < 2)) continue
      cols[r] = c
      used[c] = usedReg[g] = true
      go(r + 1)
      used[c] = usedReg[g] = false
    }
  }
  go(0)
  return out
}

export const countSolutions = (n, regions, limit = 2) => solutions(n, regions, limit).length

const around = (n, i) => {
  const r = Math.floor(i / n), c = i % n
  return [r > 0 && i - n, r < n - 1 && i + n, c > 0 && i - 1, c < n - 1 && i + 1].filter((v) => v !== false)
}

// ¿La región `id` sigue siendo de una sola pieza si se le quita la casilla `skip`?
function connected(n, regions, id, skip) {
  const cells = []
  regions.forEach((g, i) => { if (g === id && i !== skip) cells.push(i) })
  if (!cells.length) return false
  const seen = new Set([cells[0]])
  const todo = [cells[0]]
  while (todo.length) for (const j of around(n, todo.pop())) if (j !== skip && regions[j] === id && !seen.has(j)) { seen.add(j); todo.push(j) }
  return seen.size === cells.length
}

// Si hay otra solución además de la buscada, cambia de región una casilla de esa otra solución para romperla.
function repair(n, regions, cols, rand) {
  const mine = new Set(cols.map((c, r) => r * n + c))
  for (let step = 0; step < 120; step++) {
    const other = solutions(n, regions, 2).find((s) => s.some((c, r) => c !== cols[r]))
    if (!other) return true
    const cells = shuffle(other.map((c, r) => r * n + c).filter((i) => !mine.has(i)), rand)
    let moved = false
    for (const i of cells) {
      const options = shuffle([...new Set(around(n, i).map((j) => regions[j]).filter((g) => g !== regions[i]))], rand)
      const to = options[0]
      if (to === undefined || !connected(n, regions, regions[i], i)) continue
      regions[i] = to
      moved = true
      break
    }
    if (!moved) return false
  }
  return false
}

// Fabrica un tablero con una única solución. Devuelve { n, regions, solution } (solution[fila] = columna).
export function generate(n, seed) {
  const rand = rng(seed)
  for (let tries = 0; tries < 400; tries++) {
    const cols = placement(n, rand)
    const regions = grow(n, cols, rand)
    if (repair(n, regions, cols, rand) && countSolutions(n, regions) === 1) return { n, regions, solution: cols }
  }
  throw new Error('No se pudo fabricar un tablero')
}

// Casillas que se estorban entre sí: dos sellos en la misma fila, columna o región, o tocándose. `seals` = índices de casilla.
export function conflicts(n, regions, seals) {
  const bad = new Set()
  for (let a = 0; a < seals.length; a++) {
    for (let b = a + 1; b < seals.length; b++) {
      const i = seals[a], j = seals[b]
      const ri = Math.floor(i / n), ci = i % n, rj = Math.floor(j / n), cj = j % n
      if (ri === rj || ci === cj || regions[i] === regions[j] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)) { bad.add(i); bad.add(j) }
    }
  }
  return bad
}

// Resuelto = n sellos y ninguno estorba a otro (como la solución es única, es la solución).
export const isSolved = (n, regions, seals) => seals.length === n && conflicts(n, regions, seals).size === 0

// Pista: una casilla de la solución que todavía no tiene sello.
export function hintCell(board, seals) {
  const mine = new Set(seals)
  const left = board.solution.map((c, r) => r * board.n + c).filter((i) => !mine.has(i))
  return left.length ? left[0] : null
}

// Estadísticas de práctica (se guardan en el móvil): partidas, mejor tiempo por tamaño (solo sin pista) y racha de días jugando.
export function recordWin(stats, { n, ms, hinted, day }) {
  const best = { ...(stats.best ?? {}) }
  if (!hinted && (best[n] == null || ms < best[n])) best[n] = ms
  let streak = stats.streak ?? 0
  if (stats.last !== day) streak = stats.last && nextKey(stats.last) === day ? streak + 1 : 1
  return { played: (stats.played ?? 0) + 1, best, last: day, streak }
}
