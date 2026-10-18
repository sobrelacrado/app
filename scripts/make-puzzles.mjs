// Genera src/diario/puzzles.js (lo que viaja en la web) a partir de src/diario/puzzles.src.mjs + lote-NN.src.mjs (con soluciones en claro).
// Uso: node scripts/make-puzzles.mjs
import { writeFileSync } from 'node:fs'
import { loadSources } from './load-sources.mjs'
import {
  atbash, caesarEncode, hashAnswer, keypadEncode, lockCandidates, lockFeedback, morseEncode, normalize, pigpenStore, rng, shuffled, vigenereDecode, vigenereEncode,
} from '../src/diario/ciphers.js'
import { clueBody, hideText, parseLens, validateCryptic } from '../src/diario/criptico.js'
import { golpesDecode, golpesEncode } from '../src/diario/golpes.js'
import { sopaBuild } from './sopa-build.mjs'
import { escitalaFits, escitalaRead, escitalaEncode } from '../src/diario/escitala.js'
import { validateCase } from '../src/diario/interrogatorio.js'
import { binarioDecode, binarioEncode, numerosDecode, numerosEncode, sinVocales } from '../src/diario/codigos.js'
import { clueText, coartadaClues, coartadaSolve, validateCoartada } from '../src/diario/coartada.js'

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
    // Desde el día 7: cada cifra del código debe dejar rastro en algún intento (que no haya que adivinarla por pura eliminación de las demás).
    const huella = (d) => clues.some((q) => q.g.includes(d) && q.bien + q.mal > 0)
    if (seed > 6 && ![...code].every(huella)) continue
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
  golpes: (p) => {
    if (!/^[A-Z ]+$/.test(p.text) || p.text.includes('K')) throw new Error(`Golpes "${p.title}": solo A-Z y espacios, y sin K (la tabla no la tiene)`)
    const code = golpesEncode(p.text)
    if (golpesDecode(code) !== p.text) throw new Error(`Golpes "${p.title}": el código no se deshace bien`)
    return code
  },
  sopa: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Sopa "${p.title}": la respuesta solo admite A-Z y espacios`)
    const hidden = p.level === 3
    const { rows } = sopaBuild(p)
    const words = p.words.map((x) => {
      const w = normalize(typeof x === 'string' ? x : x.w)
      if (hidden && (typeof x === 'string' || !x.c)) throw new Error(`Sopa "${p.title}": en el nivel 3 cada palabra necesita su pista (c)`)
      if (!hidden && typeof x !== 'string') throw new Error(`Sopa "${p.title}": en los niveles 1 y 2 la lista va con las palabras tal cual`)
      return hidden ? { h: hashAnswer(w, 'sl-sopa'), len: w.length, c: x.c } : { w, h: hashAnswer(w, 'sl-sopa'), len: w.length }
    })
    return { size: p.size, grid: rows, words, secretLen: normalize(p.text).length }
  },
  escitala: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Escítala "${p.title}": solo A-Z y espacios`)
    if (!Number.isInteger(p.rows) || p.rows < 3) throw new Error(`Escítala "${p.title}": falta rows (grosor correcto, 3 o más)`)
    const cipher = escitalaEncode(p.text, p.rows)
    if (escitalaRead(cipher, p.rows) !== normalize(p.text)) throw new Error(`Escítala "${p.title}": no se deshace bien`)
    if (!escitalaFits(cipher).includes(p.rows)) throw new Error(`Escítala "${p.title}": el grosor correcto no se puede elegir`)
    for (const r of escitalaFits(cipher)) if (r !== p.rows && escitalaRead(cipher, r) === normalize(p.text)) throw new Error(`Escítala "${p.title}": otro grosor también da el mensaje`)
    return { cipher }
  },
  interrogatorio: (p) => {
    const errs = validateCase(p)
    if (errs.length) throw new Error(`Interrogatorio "${p.title}": ${errs.join('; ')}`)
    return { suspects: p.suspects, statements: p.statements.map(({ by, says }) => ({ by, says })), rule: p.rule }
  },
  numeros: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Números "${p.title}": la respuesta solo admite A-Z y espacios`)
    const mode = p.mode ?? 'directo'
    const code = numerosEncode(p.text, mode)
    if (numerosDecode(code, mode) !== p.text) throw new Error(`Números "${p.title}": el código no se deshace bien`)
    return { code, mode }
  },
  binario: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Binario "${p.title}": la respuesta solo admite A-Z y espacios`)
    const code = binarioEncode(p.text)
    if (binarioDecode(code) !== p.text) throw new Error(`Binario "${p.title}": el código no se deshace bien`)
    return code
  },
  sinvocales: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Sin vocales "${p.title}": la respuesta solo admite A-Z y espacios`)
    return sinVocales(p.text)
  },
  rebus: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Rebus "${p.title}": la respuesta solo admite A-Z y espacios`)
    if (!Array.isArray(p.parts) || p.parts.length < 2 || p.parts.length > 4) throw new Error(`Rebus "${p.title}": debe llevar de 2 a 4 emojis (parts)`)
    return { parts: p.parts, lens: p.text.split(' ').map((w) => w.length) }
  },
  intruso: (p, i) => {
    if (!Array.isArray(p.items) || p.items.length < 5 || p.items.length > 6) throw new Error(`Intruso "${p.title}": debe haber 5 o 6 opciones (items)`)
    const names = p.items.map((x) => normalize(x.n))
    if (new Set(names).size !== names.length) throw new Error(`Intruso "${p.title}": hay opciones repetidas`)
    if (names.filter((n) => n === normalize(p.text)).length !== 1) throw new Error(`Intruso "${p.title}": la respuesta "${p.text}" debe ser una de las opciones`)
    return shuffled(p.items, i + 1).map(({ e, n }) => (e ? { e, n } : { n }))
  },
  coartada: (p, i) => {
    const errs = validateCoartada(p)
    if (errs.length) throw new Error(`Coartada "${p.title}": ${errs.join('; ')}`)
    const n = p.people.length
    const clues = coartadaClues(n, p.solution, !!p.ordered, i + 1)
    const sols = coartadaSolve(n, clues)
    if (sols.length !== 1 || sols[0].join() !== p.solution.join()) throw new Error(`Coartada "${p.title}": las pistas no dejan una única solución`)
    return { people: p.people, places: p.places, ordered: !!p.ordered, clues: clues.map((c) => clueText(c, p.people, p.places)), ask: p.ask }
  },
  vigenere: (p) => {
    if (!/^[A-Z ]+$/.test(p.text)) throw new Error(`Vigenère "${p.title}": el texto solo admite A-Z y espacios`)
    if (!/^[A-Z]{3,8}$/.test(p.key ?? '')) throw new Error(`Vigenère "${p.title}": la clave debe ser una palabra de 3 a 8 letras A-Z`)
    const cipher = vigenereEncode(p.text, p.key)
    if (vigenereDecode(cipher, p.key) !== p.text || cipher === p.text) throw new Error(`Vigenère "${p.title}": el cifrado no se deshace bien`)
    return { cipher, len: p.key.length, kh: hashAnswer(p.key, 'sl-vigenere-clave'), ...(p.keyGiven ? { key: p.key } : {}) }
  },
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
  if (!['intruso', 'coartada'].includes(p.type)) { // sus respuestas son nombres u objetos que pueden repetirse entre acertijos
    if (answers.has(key)) throw new Error(`Acertijo ${n}: la respuesta "${p.text}" ya existe`)
    answers.add(key)
  }
  if (['morse', 'teclado', 'espejo', 'simbolos', 'anagrama', 'vigenere', 'golpes', 'escitala', 'sopa', 'numeros', 'binario', 'sinvocales', 'rebus'].includes(p.type) && /[^A-Z ]/.test(p.text)) throw new Error(`Acertijo ${n}: ${p.type} solo admite A-Z y espacios`)
  const words = p.text.split(' ')
  const count = /Son (\w+) palabras/.exec(p.hint ?? '')
  if (count && NUM[count[1]] !== words.length) throw new Error(`Acertijo ${n}: la pista dice ${count[1]} palabras y hay ${words.length}`)
  const ord = /(?<!comienzo de )la (\w+) es ([A-ZÑ]+)/.exec(p.hint ?? '')
  if (ord && ORD[ord[1]] !== undefined && words[ORD[ord[1]]] !== ord[2]) throw new Error(`Acertijo ${n}: la pista dice que la ${ord[1]} palabra es ${ord[2]} y es ${words[ORD[ord[1]]]}`)
  if (p.type === 'vigenere' && !p.keyGiven) {
    const name = Object.keys(NUM).find((k) => NUM[k] === p.key.length)
    if (!name || !p.clue.includes(`${name} letras`)) throw new Error(`Acertijo ${n}: la historia debe decir de cuántas letras es la clave ("${name} letras")`)
    if (p.hint !== `La clave empieza por ${p.key[0]}.`) throw new Error(`Acertijo ${n}: la pista debe ser "La clave empieza por ${p.key[0]}."`)
  }
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
