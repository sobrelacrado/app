// Baraja el orden de los días para que los tipos nuevos salgan pronto. Uso: node scripts/shuffle-days.mjs [primerDiaQueSePuedeMover]
// - Los días anteriores a ese (por defecto el 7: del 1 al 6 ya se jugaron) no se tocan.
// - Cada acertijo solo cambia de sitio con otros del MISMO día de la semana (así el nivel de cada día no cambia).
// - Los 4 Vigenère con la clave a la vista (keyGiven) abren los domingos (son los "de práctica").
// - Nunca dos tipos iguales seguidos (ni al volver a empezar) y, en los días 7 a 28, sale al menos uno de cada tipo nuevo.
// Escribe src/diario/orden.src.mjs (la lista de títulos en el orden final; no se sube a GitHub).
import { writeFileSync } from 'node:fs'
import { rng } from '../src/diario/ciphers.js'
import { loadRawSources } from './load-sources.mjs'

const first = Number(process.argv[2] ?? 7) - 1 // índice del primer día que se puede mover
const raw = await loadRawSources()
const L = raw.length
const NUEVOS = ['golpes', 'interrogatorio', 'escitala', 'sopa', 'criptico', 'vigenere']

function violations(list) {
  let v = 0
  list.forEach((p, i) => { if (p.type === list[(i + 1) % L].type) v++ })
  return v
}

for (let seed = 1; seed < 5000; seed++) {
  const r = rng(seed)
  const list = [...raw]
  for (let w = 0; w < 7; w++) {
    const slots = []
    for (let i = first; i < L; i++) if (i % 7 === w) slots.push(i)
    const items = slots.map((i) => raw[i])
    // barajar (Fisher-Yates)
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [items[i], items[j]] = [items[j], items[i]] }
    if (w === 6) { // domingos: primero los 4 Vigenère de práctica, en su orden de siempre
      const practica = raw.filter((p) => p.type === 'vigenere' && p.keyGiven)
      const resto = items.filter((p) => !practica.includes(p))
      items.splice(0, items.length, ...practica, ...resto)
    }
    slots.forEach((s, k) => { list[s] = items[k] })
  }
  // arreglar vecinos del mismo tipo cambiando de sitio acertijos del mismo día de la semana
  for (let pass = 0; pass < 400 && violations(list) > 0; pass++) {
    const bad = list.map((p, i) => (p.type === list[(i + 1) % L].type ? i : -1)).filter((i) => i >= 0)
    const i = bad[Math.floor(r() * bad.length)]
    const cand = [i, (i + 1) % L].filter((x) => x >= first && !(x % 7 === 6 && list[x].type === 'vigenere' && list[x].keyGiven))
    if (!cand.length) continue
    const a = cand[Math.floor(r() * cand.length)]
    const group = []
    for (let k = first; k < L; k++) if (k % 7 === a % 7 && k !== a && !(k % 7 === 6 && list[k].keyGiven)) group.push(k)
    const b = group[Math.floor(r() * group.length)]
    const before = violations(list);
    [list[a], list[b]] = [list[b], list[a]]
    if (violations(list) > before) [list[a], list[b]] = [list[b], list[a]]
  }
  if (violations(list) > 0) continue
  const pronto = new Set(list.slice(first, 28).map((p) => p.type))
  if (!NUEVOS.every((t) => pronto.has(t))) continue
  // niveles intactos
  if (!list.every((p, i) => p.level === [1, 1, 2, 2, 3, 4, 5][i % 7])) throw new Error('Se rompió el nivel de algún día')
  writeFileSync(new URL('../src/diario/orden.src.mjs', import.meta.url),
    '// ORDEN FINAL de los acertijos (títulos). Lo escribe scripts/shuffle-days.mjs y lo aplica scripts/load-sources.mjs. NO se sube a GitHub.\nexport default ' +
    JSON.stringify(list.map((p) => p.title), null, 2) + '\n')
  console.log(`Orden escrito (semilla ${seed}). Días 7 a 28:`)
  list.slice(first, 28).forEach((p, k) => console.log(`  día ${first + k + 1}: ${p.type} · ${p.title}`))
  process.exit(0)
}
throw new Error('No se encontró un orden válido')
