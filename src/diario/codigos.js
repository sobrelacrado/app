// Códigos sencillos del Diario: números a letras, binario a letras y texto sin vocales.
// Lógica pura (sin pantalla) para poder probarla con `npm test`.
import { normalize } from './ciphers.js'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const VOWELS = 'AEIOU'
const words = (text) => String(text).toUpperCase().split(/\s+/).filter(Boolean).map((w) => normalize(w)).filter(Boolean)
const join = (groups) => groups.map((w) => w.join(' ')).join(' / ')
// "12 1 / 12 12 1" -> [['12','1'],['12','12','1']]
export const codeWords = (code) => String(code).split('/').map((w) => w.trim().split(/\s+/).filter(Boolean)).filter((w) => w.length)

// ---------- Números a letras ----------
// directo: A = 1 ... Z = 26. inverso: A = 26 ... Z = 1.
export const NUM_MODES = ['directo', 'inverso']
export const numberOf = (letter, mode = 'directo') => (mode === 'inverso' ? 26 - ALPHA.indexOf(letter) : ALPHA.indexOf(letter) + 1)
export const letterOf = (n, mode = 'directo') => ALPHA[mode === 'inverso' ? 26 - n : n - 1]
export function numerosEncode(text, mode = 'directo') {
  if (!NUM_MODES.includes(mode)) throw new Error('Números: modo desconocido ' + mode)
  return join(words(text).map((w) => [...w].map((l) => numberOf(l, mode))))
}
export function numerosDecode(code, mode = 'directo') {
  return codeWords(code).map((w) => w.map((n) => letterOf(Number(n), mode)).join('')).join(' ')
}

// ---------- Binario a letras ----------
// Cada letra son 5 cifras (0 y 1): A = 00001, B = 00010 ... Z = 11010 (el número de la letra, en binario).
export const BITS = 5
export const binaryOf = (letter) => (ALPHA.indexOf(letter) + 1).toString(2).padStart(BITS, '0')
export const BINARY_TABLE = [...ALPHA].map((l) => [l, binaryOf(l)])
export const binarioEncode = (text) => join(words(text).map((w) => [...w].map(binaryOf)))
export function binarioDecode(code) {
  return codeWords(code).map((w) => w.map((b) => ALPHA[parseInt(b, 2) - 1]).join('')).join(' ')
}

// ---------- Texto sin vocales ----------
// De cada palabra se quitan las vocales; se anota cuántas letras tenía. Las palabras solo de vocales no se pueden usar.
export function sinVocales(text) {
  const out = words(text).map((w) => ({ c: [...w].filter((l) => !VOWELS.includes(l)).join(''), len: w.length }))
  if (out.some((x) => !x.c)) throw new Error('Sin vocales: hay una palabra formada solo por vocales')
  return out
}
