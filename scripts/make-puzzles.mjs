// Genera src/diario/puzzles.js (lo que viaja en la web) a partir de src/diario/puzzles.src.mjs + lote-NN.src.mjs (con soluciones en claro).
// Uso: node scripts/make-puzzles.mjs
import { writeFileSync } from 'node:fs'
import { loadSources } from './load-sources.mjs'
import {
  atbash, caesarEncode, hashAnswer, keypadEncode, lockCandidates, lockFeedback, morseEncode, normalize, pigpenStore, rng, shuffled,
} from '../src/diario/ciphers.js'
import { clueBody, hideText, parseLens, validateCryptic } from '../src/diario/criptico.js'

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
  criptico: (p) => {
    const errs = validateCryptic(p)
    if (errs.length) throw new Error(`Críptico "${p.title}": ${errs.join('; ')}`)
    const k = p.cryptic
    return {
      clue: clueBody(k.clue), lens: parseLens(k.clue), def: k.def, ...(k.def2 ? { def2: k.def2 } : {}), kind: k.kind,
      ...(k.indicator ? { indicator: k.indicator } : {}), first: normalize(p.text)[0], explain: hideText(k.explain),
    }
  },
  acrostico: (p) => {
    const initials = p.lines.map((l) => normalize(l)[0]).join('')
    if (initials !== normalize(p.text)) throw new Error(`Acróstico "${p.title}": las iniciales dan ${initials}, no ${p.text}`)
    return p.lines
  },
}

const src = await loadSources()

// Comprobaciones extra de calidad: títulos y respuestas sin repetir, solo letras A-Z donde hace falta y pistas que dicen la verdad.
const NUM = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 }
const ORD = { primera: 0, segunda: 1, tercera: 2, cuarta: 3, quinta: 4, sexta: 5, séptima: 6, octava: 7 }
const titles = new Set(), answers = new Set()
src.forEach((p, i) => {
  const n = i + 1
  if (titles.has(p.title)) throw new Error(`Acertijo ${n}: el título "${p.title}" ya existe`)
  titles.add(p.title)
  const key = normalize(p.text)
  if (answers.has(key)) throw new Error(`Acertijo ${n}: la respuesta "${p.text}" ya existe`)
  answers.add(key)
  if (['morse', 'teclado', 'espejo', 'simbolos', 'anagrama'].includes(p.type) && /[^A-Z ]/.test(p.text)) throw new Error(`Acertijo ${n}: ${p.type} solo admite A-Z y espacios`)
  const words = p.text.split(' ')
  const count = /Son (\w+) palabras/.exec(p.hint ?? '')
  if (count && NUM[count[1]] !== words.length) throw new Error(`Acertijo ${n}: la pista dice ${count[1]} palabras y hay ${words.length}`)
  const ord = /(?<!comienzo de )la (\w+) es ([A-ZÑ]+)/.exec(p.hint ?? '')
  if (ord && ORD[ord[1]] !== undefined && words[ORD[ord[1]]] !== ord[2]) throw new Error(`Acertijo ${n}: la pista dice que la ${ord[1]} palabra es ${ord[2]} y es ${words[ORD[ord[1]]]}`)
  const last = /la última es ([A-ZÑ]+)/.exec(p.hint ?? '')
  if (last && words.at(-1) !== last[1]) throw new Error(`Acertijo ${n}: la pista dice que la última palabra es ${last[1]} y es ${words.at(-1)}`)
})

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
