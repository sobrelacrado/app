// "Golpes en la pared": el código de golpes de los presos (cuadrado de Polibio 5×5). Lógica pura, probada en tests/diario.test.js.
// Cada letra son dos números: fila y columna de la tabla. La K no está: se escribe con la C.
//    1 2 3 4 5
//  1 A B C D E
//  2 F G H I J
//  3 L M N O P
//  4 Q R S T U
//  5 V W X Y Z

export const SQUARE = ['ABCDE', 'FGHIJ', 'LMNOP', 'QRSTU', 'VWXYZ']

const TO_CODE = {}
SQUARE.forEach((row, r) => [...row].forEach((letter, c) => { TO_CODE[letter] = `${r + 1}${c + 1}` }))
TO_CODE.K = TO_CODE.C
const FROM_CODE = Object.fromEntries(Object.entries(TO_CODE).filter(([l]) => l !== 'K').map(([l, g]) => [g, l]))

// Letras separadas por un espacio y palabras por " / ":  "HOLA ME" -> "23 34 31 11 / 32 15"
export const golpesEncode = (text) =>
  String(text).toUpperCase().split(/\s+/).filter(Boolean)
    .map((w) => [...w].map((c) => TO_CODE[c]).filter(Boolean).join(' ')).join(' / ')

export const golpesDecode = (code) =>
  String(code).split('/').map((w) => w.trim().split(/\s+/).filter(Boolean).map((g) => FROM_CODE[g] ?? '').join('')).join(' ')

// Fila y columna de una letra (para enseñarlas)
export const golpesOf = (letter) => { const g = TO_CODE[String(letter).toUpperCase()]; return g ? [Number(g[0]), Number(g[1])] : null }

export const GOLPES_SPEEDS = { lento: 150, normal: 95 } // milisegundos por unidad

// Código -> [{ on, ms }]: la fila en golpes, una pausa, la columna en golpes. Golpe = 1 unidad; pausa entre golpes = 1;
// entre fila y columna = 3; entre letras = 6; entre palabras = 10.
export function golpesSignals(code, unit) {
  const out = []
  const push = (on, ms) => { const last = out.at(-1); if (last && last.on === on) last.ms += ms; else out.push({ on, ms }) }
  const taps = (n) => { for (let i = 0; i < n; i++) { if (i) push(false, unit); push(true, unit) } }
  const words = String(code).split('/').map((w) => w.trim().split(/\s+/).filter(Boolean)).filter((w) => w.length)
  words.forEach((letters, wi) => {
    if (wi) push(false, 10 * unit)
    letters.forEach((g, li) => {
      if (li) push(false, 6 * unit)
      taps(Number(g[0]))
      push(false, 3 * unit)
      taps(Number(g[1]))
    })
  })
  return out
}
