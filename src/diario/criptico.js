// Lógica pura de los crípticos del Diario: nombres de los juegos de letras, comprobación de cada pista y texto de la explicación.
// (Se usa al generar los acertijos y en el navegador; no toca la pantalla, así se prueba con `npm test`.)
import { normalize } from './ciphers.js'

export const KIND_NAME = {
  anagrama: 'Anagrama', escondida: 'Palabra escondida', reves: 'Al revés', suma: 'Suma', contenedor: 'Contenedor', quitar: 'Quitar letras', doble: 'Doble definición',
}
export const KIND_HELP = {
  anagrama: 'Las letras de una palabra (la pista puede nombrarla con otras palabras) están mezcladas: reordénalas.',
  escondida: 'La respuesta está escrita, seguida, dentro de la propia pista (puede cruzar de una palabra a otra).',
  reves: 'Una palabra que te describe la pista hay que leerla de atrás hacia delante.',
  suma: 'La respuesta se forma pegando dos o más trozos, uno detrás de otro.',
  contenedor: 'Una pieza se mete dentro de otra y entre las dos forman la respuesta.',
  quitar: 'A una palabra se le quita un trozo y lo que queda es la respuesta.',
  doble: 'No hay juego de letras: la pista dice lo mismo dos veces, de dos maneras distintas.',
}

// La explicación viaja ofuscada (no es seguridad: solo evita leer la solución a simple vista en el código de la web).
const toB64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)))
export const hideText = (s) => toB64([...s].reverse().join(''))
export const showText = (b) => [...fromB64(b)].reverse().join('')

const has = (haystack, needle) => haystack.toLowerCase().includes(String(needle).toLowerCase())
const sortLetters = (s) => [...normalize(s)].sort().join('')
const reverse = (s) => [...s].reverse().join('')

// Longitudes de la respuesta que indica la pista: "... (5)" -> [5] · "... (3,4)" -> [3, 4]. null si no las trae.
export function parseLens(clue) {
  const m = /\((\d+(?:\s*,\s*\d+)*)\)\s*$/.exec(clue)
  return m ? m[1].split(',').map((n) => Number(n)) : null
}
// Pista sin el "(5)" del final.
export const clueBody = (clue) => clue.replace(/\s*\(\d+(?:\s*,\s*\d+)*\)\s*$/, '')

// Comprueba que la mecánica declarada de un críptico cuadra con la respuesta. Devuelve la lista de fallos (vacía = correcto).
// c = { text (respuesta), cryptic: { clue, def, def2?, kind, indicator?, material?, parts?, explain } }
export function validateCryptic(c) {
  const errs = []
  const { text, cryptic: k } = c
  const answer = normalize(text)
  const fail = (m) => errs.push(m)
  if (!k || !k.clue) return ['Falta la pista (cryptic.clue)']
  if (!KIND_NAME[k.kind]) fail(`Tipo de juego desconocido: ${k.kind}`)
  if (!k.explain?.trim()) fail('Falta la explicación (explain)')

  const lens = parseLens(k.clue)
  if (!lens) fail('La pista debe terminar con la longitud entre paréntesis, por ejemplo (5) o (3,4)')
  else {
    const words = String(text).trim().split(/\s+/).map((w) => normalize(w).length)
    if (lens.join(',') !== words.join(',')) fail(`La longitud (${lens.join(',')}) no coincide con la respuesta (${words.join(',')})`)
  }

  const body = clueBody(k.clue)
  if (!k.def || !has(body, k.def)) fail('La definición (def) no aparece en la pista')
  else {
    const atStart = body.toLowerCase().startsWith(k.def.toLowerCase())
    const atEnd = body.toLowerCase().endsWith(k.def.toLowerCase())
    if (k.kind === 'doble') {
      if (!atStart) fail('En una doble definición, def debe ir al principio')
      if (!k.def2 || !has(body, k.def2) || !body.toLowerCase().endsWith(k.def2.toLowerCase())) fail('En una doble definición, def2 debe ir al final de la pista')
    } else if (!atStart && !atEnd) fail('La definición debe ir al principio o al final de la pista')
  }
  if (k.kind !== 'doble') {
    if (!k.indicator || !has(body, k.indicator)) fail('El aviso (indicator) no aparece en la pista')
  }

  const parts = k.parts ?? []
  for (const p of parts) if (!p.word || !p.from || !has(body, p.from)) fail(`La pieza «${p.word}» debe tener "from" y aparecer en la pista`)
  const word = (p) => normalize(p.word)

  switch (k.kind) {
    case 'anagrama':
      if (parts.length) { // la palabra a mezclar viene nombrada con otras palabras (sinónimo)
        if (parts.length !== 1) fail('Un anagrama con sinónimo necesita exactamente una pieza (parts)')
        else if (word(parts[0]) === answer) fail('La pieza no puede ser ya la respuesta')
        else if (sortLetters(parts[0].word) !== sortLetters(answer)) fail('Las letras de la pieza no forman la respuesta')
      } else if (!k.material || !has(body, k.material)) fail('El material no aparece en la pista')
      else if (normalize(k.material) === answer) fail('El material no puede ser ya la respuesta')
      else if (sortLetters(k.material) !== sortLetters(answer)) fail('Las letras del material no forman la respuesta')
      break
    case 'escondida':
      if (!k.material || !has(body, k.material)) fail('El material no aparece en la pista')
      else if (!normalize(k.material).includes(answer)) fail('La respuesta no está dentro del material')
      else if (String(k.material).trim().split(/\s+/).some((w) => normalize(w) === answer)) fail('La respuesta no puede ser una palabra entera del material')
      break
    case 'reves':
      if (parts.length !== 1) fail('Al revés necesita exactamente una pieza (parts)')
      else if (reverse(word(parts[0])) !== answer) fail('La pieza leída al revés no da la respuesta')
      break
    case 'suma':
      if (parts.length < 2) fail('Suma necesita al menos dos piezas')
      else if (parts.map(word).join('') !== answer) fail('Las piezas pegadas no dan la respuesta')
      break
    case 'contenedor': {
      if (parts.length !== 2) { fail('Contenedor necesita dos piezas: la de fuera y la de dentro'); break }
      const [out, inn] = [word(parts[0]), word(parts[1])]
      const ok = Array.from({ length: out.length - 1 }, (_, i) => out.slice(0, i + 1) + inn + out.slice(i + 1)).includes(answer)
      if (!ok) fail('Metiendo la pieza de dentro en la de fuera no se forma la respuesta')
      break
    }
    case 'quitar': {
      if (parts.length !== 2) { fail('Quitar letras necesita dos piezas: la palabra entera y el trozo que se quita'); break }
      const [full, cut] = [word(parts[0]), word(parts[1])]
      const ok = Array.from({ length: full.length - cut.length + 1 }, (_, i) => full.slice(0, i) + full.slice(i + cut.length)).some((r, i) => full.slice(i, i + cut.length) === cut && r === answer)
      if (!ok) fail('Quitando el trozo a la palabra entera no se forma la respuesta')
      break
    }
    default:
  }
  return errs
}
