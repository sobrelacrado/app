// Baraja el orden de los días para que los tipos nuevos salgan pronto. Uso: node scripts/shuffle-days.mjs [primerDiaQueSePuedeMover]
// - Los días anteriores a ese (por defecto el 8: del 1 al 7 ya se jugaron) se quedan EXACTAMENTE como están hoy (los lee de orden.src.mjs).
// - Cada acertijo solo cambia de sitio con otros del MISMO día de la semana (así el nivel de cada día y los días de golpes, escítala, etc. no cambian).
// - Nunca dos tipos iguales seguidos (ni al volver a empezar) y, en los días 8 a 28, sale al menos uno de cada tipo nuevo.
// Escribe src/diario/orden.src.mjs (la lista de títulos en el orden final; no se sube a GitHub).
// OJO: no volver a lanzarlo con un primer día anterior a lo ya jugado: se cambiaría un acertijo que alguien ya resolvió.
import { writeFileSync } from 'node:fs'
import { rng } from '../src/diario/ciphers.js'
import { loadRawSources } from './load-sources.mjs'

const first = Number(process.argv[2] ?? 8) - 1 // índice del primer día que se puede mover
const raw = await loadRawSources()
const L = raw.length
if (L % 7) throw new Error('La lista debe tener semanas completas')
const NUEVOS = ['numeros', 'rebus', 'sinvocales', 'intruso', 'coartada', 'binario']

// Días ya jugados: se quedan como están en el orden actual.
const actual = (await import(new URL('../src/diario/orden.src.mjs', import.meta.url))).default
const byTitle = new Map(raw.map((p, i) => [p.title, { p, i }]))
if (byTitle.size !== raw.length) throw new Error('Hay títulos repetidos en los acertijos')
const fixed = actual.slice(0, first).map((t, k) => {
  const e = byTitle.get(t)
  if (!e) throw new Error(`El día ${k + 1} ("${t}") ya no existe en los archivos fuente`)
  if (e.i % 7 !== k % 7) throw new Error(`El día ${k + 1} ("${t}") no está en su día de la semana en los archivos fuente`)
  return e.p
})
const fixedTitles = new Set(fixed.map((p) => p.title))

function violations(list) {
  let v = 0
  list.forEach((p, i) => { if (p.type === list[(i + 1) % L].type) v++ })
  return v
}

const pools = []
for (let w = 0; w < 7; w++) {
  const items = raw.filter((p, i) => i % 7 === w && !fixedTitles.has(p.title))
  const slots = []
  for (let i = first; i < L; i++) if (i % 7 === w) slots.push(i)
  if (items.length !== slots.length) throw new Error(`Día de la semana ${w}: ${items.length} acertijos para ${slots.length} huecos`)
  pools.push({ items, slots })
}

for (let seed = 1; seed < 20000; seed++) {
  const r = rng(seed)
  const list = new Array(L)
  fixed.forEach((p, k) => { list[k] = p })
  for (const { items, slots } of pools) {
    const it = [...items]
    for (let i = it.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [it[i], it[j]] = [it[j], it[i]] }
    slots.forEach((s, k) => { list[s] = it[k] })
  }
  // arreglar vecinos del mismo tipo cambiando de sitio acertijos del mismo día de la semana
  for (let pass = 0; pass < 600 && violations(list) > 0; pass++) {
    const bad = list.map((p, i) => (p.type === list[(i + 1) % L].type ? i : -1)).filter((i) => i >= 0)
    const i = bad[Math.floor(r() * bad.length)]
    const cand = [i, (i + 1) % L].filter((x) => x >= first)
    if (!cand.length) continue
    const a = cand[Math.floor(r() * cand.length)]
    const group = []
    for (let k = first; k < L; k++) if (k % 7 === a % 7 && k !== a) group.push(k)
    const b = group[Math.floor(r() * group.length)]
    const before = violations(list);
    [list[a], list[b]] = [list[b], list[a]]
    if (violations(list) > before) [list[a], list[b]] = [list[b], list[a]]
  }
  if (violations(list) > 0) continue
  const pronto = new Set(list.slice(first, 28).map((p) => p.type))
  if (!NUEVOS.every((t) => pronto.has(t))) continue
  // niveles intactos y nada de lo ya jugado cambiado
  if (!list.every((p, i) => p.level === [1, 1, 2, 2, 3, 4, 5][i % 7])) throw new Error('Se rompió el nivel de algún día')
  if (!fixed.every((p, k) => list[k] === p)) throw new Error('Se movió un día ya jugado')
  writeFileSync(new URL('../src/diario/orden.src.mjs', import.meta.url),
    '// ORDEN FINAL de los acertijos (títulos). Lo escribe scripts/shuffle-days.mjs y lo aplica scripts/load-sources.mjs. NO se sube a GitHub.\nexport default ' +
    JSON.stringify(list.map((p) => p.title), null, 2) + '\n')
  console.log(`Orden escrito (semilla ${seed}, ${L} días). Días ${first + 1} a 28:`)
  list.slice(first, 28).forEach((p, k) => console.log(`  día ${first + k + 1}: ${p.type} · ${p.title}`))
  process.exit(0)
}
throw new Error('No se encontró un orden válido')
