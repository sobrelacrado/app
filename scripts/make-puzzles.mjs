// Genera src/diario/puzzles.js (lo que viaja en la web) a partir de src/diario/puzzles.src.mjs (con soluciones en claro).
// Uso: node scripts/make-puzzles.mjs
import { writeFileSync } from 'node:fs'
import src from '../src/diario/puzzles.src.mjs'
import {
  atbash, caesarEncode, hashAnswer, keypadEncode, lockCandidates, lockFeedback, morseEncode, normalize, pigpenStore, rng, shuffled,
} from '../src/diario/ciphers.js'

// Cerradura: elige intentos al azar (siempre los mismos para el mismo acertijo) hasta que solo quede un código posible.
function lockClues(code, seed) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const r = rng(seed * 1000 + attempt)
    const clues = []
    while (clues.length < 7) {
      const g = shuffled([...'0123456789'], Math.floor(r() * 1e9)).slice(0, 3).join('')
      if (g === code || clues.some((c) => c.g === g)) continue
      clues.push({ g, ...lockFeedback(code, g) })
      if (lockCandidates(clues).length === 1) break
    }
    if (lockCandidates(clues).length !== 1) continue
    // quita los intentos que no hacen falta
    for (let i = clues.length - 1; i >= 0; i--) {
      const rest = clues.filter((_, k) => k !== i)
      if (lockCandidates(rest).length === 1) clues.splice(i, 1)
    }
    if (clues.length >= 3 && clues.length <= 5) return clues
  }
  throw new Error('No se pudo generar la cerradura ' + code)
}

function anagram(text, seed) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean)
  const letters = [...normalize(text)]
  for (let k = 0; k < 50; k++) {
    const pool = shuffled(letters, seed * 100 + k).join('')
    if (pool !== letters.join('') && !words.some((w) => pool.includes(w))) return { pool, lens: words.map((w) => w.length) }
  }
  throw new Error('No se pudo mezclar ' + text)
}

const encode = {
  cesar: (p) => caesarEncode(p.text, p.shift),
  morse: (p) => morseEncode(p.text),
  teclado: (p) => keypadEncode(p.text),
  espejo: (p) => atbash(p.text),
  simbolos: (p) => pigpenStore(p.text),
  anagrama: (p, i) => anagram(p.text, i + 1),
  cerradura: (p, i) => lockClues(p.text, i + 1),
  acrostico: (p) => {
    const initials = p.lines.map((l) => normalize(l)[0]).join('')
    if (initials !== normalize(p.text)) throw new Error(`Acróstico "${p.title}": las iniciales dan ${initials}, no ${p.text}`)
    return p.lines
  },
}

const out = src.map((p, i) => {
  if (!encode[p.type]) throw new Error(`Tipo desconocido: ${p.type}`)
  if (i > 0 && src[i - 1].type === p.type) throw new Error(`Acertijo ${i + 1}: mismo tipo que el anterior`)
  const expectLevel = [1, 1, 2, 2, 3, 4, 5][i % 7]
  if (p.level !== expectLevel) throw new Error(`Acertijo ${i + 1}: el nivel de ese día de la semana debe ser ${expectLevel}`)
  if (p.type === 'cesar' && /[^A-Z ]/.test(p.text)) throw new Error(`Acertijo ${i + 1}: César solo admite A-Z`)
  return { id: i + 1, type: p.type, theme: p.theme, level: p.level, title: p.title, clue: p.clue, hint: p.hint, data: encode[p.type](p, i), h: hashAnswer(p.text) }
})
if (src.at(-1).type === src[0].type) throw new Error('El último acertijo tiene el mismo tipo que el primero (la lista se repite)')
if (src.length % 7) throw new Error('La lista debe tener semanas completas (múltiplo de 7)')
writeFileSync(new URL('../src/diario/puzzles.js', import.meta.url),
  `// GENERADO por scripts/make-puzzles.mjs: no editar a mano.\nexport default ${JSON.stringify(out, null, 2)}\n`)
const count = {}
out.forEach((p) => { count[p.type] = (count[p.type] ?? 0) + 1 })
console.log(`${out.length} acertijos generados`, count)
