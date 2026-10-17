// Sopa de letras escondidas: lógica pura (sin pantalla) para poder probarla con `npm test`.
// Las 8 direcciones: [fila, columna]. Los niveles fáciles usan solo algunas; "al revés" es ← ↑ ↖ ↙.
export const DIRS8 = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]
export const NAMES8 = ['→', '↓', '↘', '↗', '←', '↑', '↖', '↙']
// Direcciones permitidas por nivel (índices de DIRS8): 1 = →↓↘; 2 = añade ↗ y algunas al revés; 3 = todas.
export const LEVEL_DIRS = { 1: [0, 1, 2], 2: [0, 1, 2, 3, 4, 5], 3: [0, 1, 2, 3, 4, 5, 6, 7] }

// Casillas de una línea recta que va de a a b (ambas [fila, columna], incluidas). null si no es recta u horizontal/vertical/diagonal.
export function sopaLine(a, b) {
  const dr = b[0] - a[0], dc = b[1] - a[1], n = Math.max(Math.abs(dr), Math.abs(dc))
  if (n === 0 || (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc))) return null
  const sr = Math.sign(dr), sc = Math.sign(dc)
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + sr * i, a[1] + sc * i])
}

// Letras de esas casillas, leídas en orden.
export const sopaRead = (rows, cells) => cells.map(([r, c]) => rows[r][c]).join('')

// Todas las veces que una palabra aparece en la cuadrícula (en las 8 direcciones). Devuelve las casillas de cada aparición.
export function sopaOccurrences(rows, word) {
  const n = rows.length, out = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (let d = 0; d < 8; d++) {
    const [dr, dc] = DIRS8[d]
    const cells = []
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i, cc = c + dc * i
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || rows[rr][cc] !== word[i]) break
      cells.push([rr, cc])
    }
    if (cells.length === word.length) out.push({ cells, dir: d })
  }
  return out
}

// Letras que sobran (casillas no cubiertas por las palabras encontradas), en orden de lectura.
export function sopaLeftover(rows, foundCells) {
  const used = new Set(foundCells.map(([r, c]) => r * rows.length + c))
  let out = ''
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows.length; c++) if (!used.has(r * rows.length + c)) out += rows[r][c]
  return out
}
