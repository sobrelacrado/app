// Escítala: el mensaje se escribe por filas en una cuadrícula y se lee por columnas (como la tira de cuero enrollada en un palo).
// Lógica pura (sin pantalla) para poder probarla con `npm test`.
import { normalize } from './ciphers.js'

export const MIN_ROWS = 2
export const MAX_ROWS = 10

// Cifra: el texto (solo letras) debe caber exacto en `rows` filas. Se lee la cuadrícula columna a columna.
export function escitalaEncode(text, rows) {
  const t = normalize(text)
  if (rows < MIN_ROWS || t.length % rows !== 0) throw new Error(`Escítala: ${t.length} letras no caben exactas en ${rows} filas`)
  const cols = t.length / rows
  let out = ''
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out += t[r * cols + c]
  return out
}

// Cuadrícula que verá el jugador con `rows` filas: se rellena columna a columna. Casillas sin letra = ''.
export function escitalaGrid(cipher, rows) {
  const t = normalize(cipher)
  const cols = Math.ceil(t.length / rows)
  const grid = Array.from({ length: rows }, () => Array(cols).fill(''))
  let i = 0
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows && i < t.length; r++) grid[r][c] = t[i++]
  return grid
}

// Lo que se lee en esa cuadrícula, fila a fila.
export const escitalaRead = (cipher, rows) => escitalaGrid(cipher, rows).map((r) => r.join('')).join('')

// Grosores que dejan la cuadrícula completa (los que dividen exacto el largo).
export const escitalaFits = (cipher) => {
  const n = normalize(cipher).length
  const out = []
  for (let r = MIN_ROWS; r <= Math.min(MAX_ROWS, n / 2); r++) if (n % r === 0) out.push(r)
  return out
}
