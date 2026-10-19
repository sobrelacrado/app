// Lista de una vez los títulos y respuestas del banco de retos que se repiten con el calendario o entre sí (make-puzzles.mjs se para en el primero).
import { loadSources, loadBanco } from './load-sources.mjs'
import { normalize } from '../src/diario/ciphers.js'

const src = await loadSources(), b = await loadBanco()
const libres = ['intruso', 'coartada'] // sus respuestas son nombres u objetos que pueden repetirse
const ans = new Map(src.filter((p) => !libres.includes(p.type)).map((p) => [normalize(p.text), p.title]))
const titles = new Set(src.map((p) => p.title))
const seen = new Set()
let bad = 0
b.forEach((p, j) => {
  const k = normalize(p.text)
  if (!libres.includes(p.type)) {
    if (ans.has(k)) { bad++; console.log(`banco ${j + 1} "${p.title}": respuesta repetida con "${ans.get(k)}" -> ${p.text}`) }
    if (seen.has(k)) { bad++; console.log(`banco ${j + 1} "${p.title}": respuesta repetida dentro del banco -> ${p.text}`) }
    seen.add(k)
  }
  if (titles.has(p.title)) { bad++; console.log(`banco ${j + 1}: título repetido: ${p.title}`) }
  titles.add(p.title)
})
console.log(bad ? `${bad} repetidos` : `Sin repetidos (${b.length} acertijos del banco)`)

// Pistas que no cuadran con la respuesta (mismas reglas que make-puzzles.mjs, pero listando todas a la vez).
const NUM = { dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 }
const ORD = { primera: 0, segunda: 1, tercera: 2, cuarta: 3, quinta: 4, sexta: 5, séptima: 6, octava: 7 }
let malas = 0
b.forEach((p, j) => {
  const w = p.text.split(' ')
  const c = /Son (\w+) palabras/.exec(p.hint ?? '')
  if (c && NUM[c[1]] !== w.length) { malas++; console.log(`banco ${j + 1} "${p.title}": la pista dice ${c[1]} palabras y hay ${w.length}`) }
  const o = /(?<!comienzo de )la (\w+) es ([A-ZÑ]+)/.exec(p.hint ?? '')
  if (o && ORD[o[1]] !== undefined && w[ORD[o[1]]] !== o[2]) { malas++; console.log(`banco ${j + 1} "${p.title}": la ${o[1]} no es ${o[2]} sino ${w[ORD[o[1]]]}`) }
  const l = /la última es ([A-ZÑ]+)/.exec(p.hint ?? '')
  if (l && w.at(-1) !== l[1]) { malas++; console.log(`banco ${j + 1} "${p.title}": la última no es ${l[1]} sino ${w.at(-1)}`) }
})
console.log(malas ? `${malas} pistas que no cuadran` : 'Pistas coherentes')
