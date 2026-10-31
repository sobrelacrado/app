// Acróstico: el mensaje se esconde en una letra concreta de cada línea (la primera, la segunda, la tercera o la última),
// leyendo de arriba abajo o de abajo arriba. Lógica pura (sin pantalla) para probarla con `npm test`.
// La regla NO viaja en la web: solo se usa al generar los acertijos y en los tests.
import { normalize } from './ciphers.js'

export const ACROSTIC_RULES = ['primera', 'segunda', 'tercera', 'ultima']

// Letra que toca de una línea según la regla (sin tildes, signos ni espacios).
export function acrosticLetter(line, rule = 'primera') {
  const t = normalize(line)
  if (rule === 'ultima') return t[t.length - 1] ?? ''
  const at = { primera: 0, segunda: 1, tercera: 2 }[rule]
  if (at === undefined) throw new Error(`Acróstico: regla desconocida "${rule}"`)
  return t[at] ?? ''
}

// El mensaje escondido: opts = { rule, reverse }. Con reverse se lee de la última línea a la primera.
export function acrosticRead(lines, { rule = 'primera', reverse = false } = {}) {
  const letters = lines.map((l) => acrosticLetter(l, rule))
  return (reverse ? letters.reverse() : letters).join('')
}
