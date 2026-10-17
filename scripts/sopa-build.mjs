// Construye la cuadrícula de una "Sopa de letras escondidas": coloca las palabras sin solaparse (con una semilla fija, siempre sale lo mismo),
// y las casillas que quedan libres se rellenan, en orden de lectura, con las letras de la respuesta secreta.
// Exige: cada palabra aparece UNA sola vez (en cualquier dirección), mezcla de direcciones y, desde el nivel 2, palabras al revés.
import { normalize, rng } from '../src/diario/ciphers.js'
import { DIRS8, LEVEL_DIRS, sopaOccurrences } from '../src/diario/sopa.js'

export function sopaBuild(p) {
  const N = p.size, words = p.words.map((w) => normalize(typeof w === 'string' ? w : w.w))
  const secret = normalize(p.text)
  const total = words.reduce((n, w) => n + w.length, 0)
  // Las palabras pueden cruzarse en una letra igual; cada cruce libera una casilla. Cruces necesarios = letras de palabras + respuesta - casillas.
  const cross = total + secret.length - N * N
  if (cross < 0) throw new Error(`Sopa "${p.title}": sobran casillas (palabras ${total} + respuesta ${secret.length} < ${N * N}): añade letras a las palabras`)
  if (words.some((w) => w.length > N || w.length < 3 || w === [...w].reverse().join(''))) throw new Error(`Sopa "${p.title}": una palabra es demasiado larga, corta o capicúa`)
  const allowed = LEVEL_DIRS[p.level]
  let seed = 0; for (const ch of p.title) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const r = rng(seed)
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  for (let attempt = 0; attempt < 4000; attempt++) {
    const grid = Array.from({ length: N }, () => Array(N).fill(''))
    const placed = []
    let nodes = 0, overlaps = 0
    // Primero se reparte qué dirección lleva cada palabra (para que siempre haya mezcla) y luego se busca dónde cabe.
    const mixOk = (dirs) => {
      const forward = new Set(dirs.filter((d) => d < 4)), back = dirs.filter((d) => d >= 4).length
      if (p.level === 1) return forward.size >= 3
      if (p.level === 2) return forward.size >= 3 && back >= 1 && back <= Math.ceil(words.length / 2)
      return forward.size >= 3 && back >= 3
    }
    // Algunas palabras llevan una dirección obligada (para que siempre haya mezcla); las demás pueden ir en cualquiera de las permitidas.
    const must = p.level === 1 ? [0, 1, 2] : p.level === 2 ? [2, 3, 1, 0, 4 + Math.floor(r() * 2)] : [4, 5, 6, 7, 2, 3, 1, 0]
    // Las direcciones en diagonal se reparten entre las palabras más cortas (son las que mejor caben); el resto, entre las demás.
    const byLen = shuffle(words.map((w, i) => i)).sort((x, y) => words[x].length - words[y].length)
    const plan = words.map(() => null)
    const diag = must.filter((d) => d === 2 || d === 3 || d === 6 || d === 7), straight = must.filter((d) => !diag.includes(d))
    diag.slice(0, words.length).forEach((d, k) => { plan[byLen[k]] = d })
    const rest = byLen.filter((i) => plan[i] === null).reverse()
    straight.forEach((d, k) => { if (rest[k] !== undefined) plan[rest[k]] = d })
    const order = shuffle(words.map((w, i) => i)).sort((x, y) => words[y].length - words[x].length)
    const place = (k) => {
      if (k === order.length) return overlaps === cross
      if (++nodes > 20000) return false
      const w = words[order[k]], dset = plan[order[k]] === null ? allowed : [plan[order[k]]]
      const opts = []
      const left = cross - overlaps
      for (const d of dset) for (let row = 0; row < N; row++) for (let col = 0; col < N; col++) {
        const [dr, dc] = DIRS8[d], er = row + dr * (w.length - 1), ec = col + dc * (w.length - 1)
        if (er < 0 || ec < 0 || er >= N || ec >= N) continue
        let ok = true, ov = 0
        for (let i = 0; i < w.length && ok; i++) { const g = grid[row + dr * i][col + dc * i]; if (g) { if (g === w[i]) ov++; else ok = false } }
        if (ok && ov <= left) opts.push({ row, col, d, ov })
      }
      shuffle(opts)
      for (const o of opts.slice(0, 40)) {
        const [dr, dc] = DIRS8[o.d]
        const before = []
        for (let i = 0; i < w.length; i++) { before.push(grid[o.row + dr * i][o.col + dc * i]); grid[o.row + dr * i][o.col + dc * i] = w[i] }
        placed[order[k]] = o; overlaps += o.ov
        if (place(k + 1)) return true
        overlaps -= o.ov
        for (let i = 0; i < w.length; i++) grid[o.row + dr * i][o.col + dc * i] = before[i]
      }
      return false
    }
    if (!place(0)) continue
    if (!mixOk(placed.map((o) => o.d))) continue
    let i = 0
    const rows = grid.map((row) => row.map((c) => c || secret[i++]).join(''))
    if (words.some((w) => sopaOccurrences(rows, w).length !== 1)) continue
    // la respuesta no debe leerse como palabra de la lista (ni al revés) en ninguna línea (ya cubierto arriba) y los sobrantes no deben ser todos seguidos en una columna
    const free = []; grid.forEach((row, a) => row.forEach((c, b) => { if (!c) free.push([a, b]) }))
    if (free.length > 4 && new Set(free.map(([a]) => a)).size < 3) continue
    if (free.length > 4 && new Set(free.map(([, b]) => b)).size < 3) continue
    return { rows, placed: placed.map((o, idx) => ({ word: words[idx], ...o })) }
  }
  throw new Error(`Sopa "${p.title}": no se pudo colocar (prueba con otra cuadrícula o palabras)`)
}
