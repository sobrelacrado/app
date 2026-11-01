// SUPER SHUFFLE del calendario del Diario. Uso: node scripts/super-shuffle.mjs [primerDiaQueSePuedeMover]   (por defecto el 21: desde el 1/11/2026)
// Reordena los días que aún no se han jugado para que no se repitan los juegos:
//  - Los días anteriores al primero movible se quedan EXACTAMENTE como están hoy (los lee de orden.src.mjs).
//  - El nivel de cada día de la semana no cambia (lunes y martes 1, miércoles y jueves 2, viernes 3, sábado 4, domingo 5)
//    y se respetan los días de cada tipo (golpes, coartada, binario...: las mismas reglas que tests/diario.test.js).
//  - Los lunes-martes y los miércoles-jueves pueden intercambiarse entre sí. Los viernes, sábados y domingos (que repetían mucho)
//    también toman retos del banco de su mismo nivel; los que sobran del calendario bajan al banco.
//  - Un tipo de juego no se repite en los 6 días anteriores (cada semana, 7 tipos distintos) y se evita repetirlo a la semana siguiente.
//  - Los crípticos no pueden salir en dos sábados seguidos (como mucho uno cada 2 semanas).
// Escribe src/diario/orden.src.mjs: `default` = títulos del calendario en orden y `fuera` = los del calendario que bajan al banco. NO se sube a GitHub.
// OJO: no lanzarlo con un primer día anterior a lo ya jugado: se cambiaría un acertijo que alguien ya resolvió.
import { writeFileSync } from 'node:fs'
import { rng } from '../src/diario/ciphers.js'
import { loadRawSources, loadBancoRaw } from './load-sources.mjs'

const first = Number(process.argv[2] ?? 21) - 1 // índice del primer día movible
const LEVELS = [1, 1, 2, 2, 3, 4, 5]
const raw = await loadRawSources()
const bancoRaw = await loadBancoRaw()
const L = 182
const actual = (await import(new URL('../src/diario/orden.src.mjs', import.meta.url))).default
if (actual.length !== L) throw new Error(`El calendario actual tiene ${actual.length} días, no ${L}`)
const todos = [...raw, ...bancoRaw]
const byTitle = new Map(todos.map((p) => [p.title, p]))
if (byTitle.size !== todos.length) throw new Error('Hay títulos repetidos en los acertijos')

// Circuito: cualquier día de la semana (su nivel es el tamaño del tablero: 3×3 = 1 ... 7×7 = 5). Entra desde el banco en todos los niveles.
// Reglas de día de la semana por tipo (w: 0 lunes ... 6 domingo). Son las de tests/diario.test.js.
const DIAS = {
  numeros: (w) => w <= 3, rebus: (w) => w <= 3, golpes: (w) => w === 1 || w === 2, binario: (w) => w >= 4, coartada: (w) => w >= 5,
  sopa: (w) => w <= 4, vigenere: (w) => w === 6, criptico: (w) => w === 5, interrogatorio: (w) => w === 3 || w === 4,
}
const cabe = (p, w) => p.level === LEVELS[w] && (DIAS[p.type]?.(w) ?? true)

const fijos = actual.slice(0, first).map((t, k) => {
  const p = byTitle.get(t)
  if (!p) throw new Error(`El día ${k + 1} ("${t}") ya no existe en los archivos fuente`)
  return p
})
const fijosT = new Set(fijos.map((p) => p.title))

// Quién puede entrar en el calendario: los del calendario que quedan por jugar y, en los niveles 3-5, también los del banco.
const calendarioPend = new Set(actual.slice(first))
const candidatos = todos.filter((p) => !fijosT.has(p.title) && (calendarioPend.has(p.title) || raw.includes(p) || p.level >= 3 || p.type === 'circuito'))
const huecos = []
for (let i = first; i < L; i++) huecos.push(i)
const huecosDeNivel = (n) => huecos.filter((i) => LEVELS[i % 7] === n)
const grupos = [1, 2, 3, 4, 5].map((n) => ({
  n, huecos: huecosDeNivel(n),
  pool: candidatos.filter((p) => p.level === n && (n >= 3 || p.type === 'circuito' || calendarioPend.has(p.title) || raw.includes(p))),
}))
for (const g of grupos) if (g.pool.length < g.huecos.length) throw new Error(`Nivel ${g.n}: ${g.pool.length} acertijos para ${g.huecos.length} huecos`)

const TIPOS = [...new Set(todos.map((p) => p.type))]
const tid = (p) => TIPOS.indexOf(p.type)
const CRIPTICO = TIPOS.indexOf('criptico')
const CIRCUITO = TIPOS.indexOf('circuito')
const OBJ_CIRCUITOS = 16 // circuitos que queremos en los días movibles (uno cada 10 días, más o menos)
const fc = (c) => c.duro * 1000 + c.blando + c.falta * 40

function coste(list) {
  let duro = 0, blando = 0
  for (let i = 0; i < L; i++) {
    const a = tid(list[i])
    for (let d = 1; d <= 13; d++) {
      const j = (i + d) % L
      if (tid(list[j]) !== a || (i < first && j < first)) continue // dos días ya jugados no se pueden arreglar
      if (d <= 6 || (a === CRIPTICO && d < 10)) duro++
      else blando += d === 7 ? 3 : 1
    }
  }
  const nCirc = list.slice(first).filter((p) => tid(p) === CIRCUITO).length
  return { duro, blando, falta: Math.max(0, OBJ_CIRCUITOS - nCirc) }
}

function inicial(r) {
  const list = new Array(L)
  fijos.forEach((p, k) => { list[k] = p })
  const sobran = {}
  for (const g of grupos) {
    const pool = [...g.pool].sort(() => r() - .5)
    // primero los más restringidos (los que caben en menos días)
    const restr = (p) => huecos.length && g.huecos.filter((i) => cabe(p, i % 7)).length
    pool.sort((a, b) => restr(a) - restr(b) || r() - .5)
    const libres = new Set(g.huecos)
    const elegidos = []
    for (const p of pool) {
      if (elegidos.length === g.huecos.length) break
      const opts = [...libres].filter((i) => cabe(p, i % 7))
      if (!opts.length) continue
      const i = opts[Math.floor(r() * opts.length)]
      libres.delete(i); list[i] = p; elegidos.push(p)
    }
    if (libres.size) return null
    sobran[g.n] = pool.filter((p) => !elegidos.includes(p))
  }
  return { list, sobran }
}

function buscar(seed) {
  const r = rng(seed)
  let est = null
  for (let k = 0; k < 200 && !est; k++) est = inicial(r)
  if (!est) return null
  const { list, sobran } = est
  let c = coste(list)
  let f = fc(c)
  const ITER = 120000
  for (let it = 0; it < ITER; it++) {
    const T = 6 * (1 - it / ITER) + 0.05
    const i = huecos[Math.floor(r() * huecos.length)]
    const n = LEVELS[i % 7]
    let j = -1, u = -1
    if (sobran[n].length && r() < 0.4) { // cambiar por uno del banco
      u = Math.floor(r() * sobran[n].length)
      if (!cabe(sobran[n][u], i % 7)) continue
      const tmp = list[i]; list[i] = sobran[n][u]; sobran[n][u] = tmp
    } else { // intercambiar con otro hueco del mismo nivel
      const g = grupos[n - 1].huecos
      j = g[Math.floor(r() * g.length)]
      if (j === i || !cabe(list[i], j % 7) || !cabe(list[j], i % 7)) continue
      const tmp = list[i]; list[i] = list[j]; list[j] = tmp
    }
    const c2 = coste(list)
    const f2 = fc(c2)
    if (f2 <= f || r() < Math.exp((f - f2) / T)) { f = f2; c = c2 } else if (u >= 0) {
      const tmp = list[i]; list[i] = sobran[n][u]; sobran[n][u] = tmp
    } else {
      const tmp = list[i]; list[i] = list[j]; list[j] = tmp
    }
    if (c.duro === 0 && c.blando === 0 && c.falta === 0) break
  }
  return { list, sobran, c, f }
}

let mejor = null
for (let seed = 1; seed <= 6; seed++) {
  const res = buscar(seed)
  if (!res) continue
  console.log(`semilla ${seed}: repeticiones duras ${res.c.duro}, blandas ${res.c.blando}, circuitos que faltan ${res.c.falta}`)
  if (res.c.duro === 0 && (!mejor || res.f < mejor.f)) mejor = res
}
if (!mejor) throw new Error('No se encontró un orden válido')
const { list, sobran } = mejor

// Comprobaciones finales
if (!list.every((p, i) => cabe(p, i % 7))) throw new Error('Algún día no respeta su nivel o su día de la semana')
if (!fijos.every((p, k) => list[k] === p)) throw new Error('Se movió un día ya jugado')
if (new Set(list.map((p) => p.title)).size !== L) throw new Error('Hay un acertijo repetido en el calendario')

const enCal = new Set(list.map((p) => p.title))
const fuera = raw.filter((p) => !enCal.has(p.title)).map((p) => p.title)
writeFileSync(new URL('../src/diario/orden.src.mjs', import.meta.url),
  '// ORDEN FINAL de los acertijos (títulos). Lo escribe scripts/super-shuffle.mjs y lo aplica scripts/load-sources.mjs. NO se sube a GitHub.\n' +
  '// `default` = el calendario, día a día. `fuera` = acertijos de los lotes que bajaron al banco de retos.\n' +
  'export default ' + JSON.stringify(list.map((p) => p.title), null, 2) + '\n\nexport const fuera = ' + JSON.stringify(fuera, null, 2) + '\n')

// Resumen
const DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
console.log(`\nOrden escrito. ${fuera.length} acertijos de los lotes bajan al banco; sobran en el banco: ${Object.entries(sobran).map(([n, a]) => `nivel ${n}: ${a.length}`).join(', ')}`)
const fecha = (k) => { const d = new Date(Date.UTC(2026, 9, 12 + k)); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }
console.log('\nPrimeros 28 días movibles:')
for (let k = first; k < first + 28; k++) console.log(`  ${fecha(k).padEnd(6)} ${DIA[k % 7]} nivel ${list[k].level} · ${list[k].type} · ${list[k].title}`)
const crip = list.map((p, i) => (p.type === 'criptico' ? i : -1)).filter((i) => i >= first)
console.log('\nCrípticos:', crip.map((i) => fecha(i)).join(', '))
const porTipo = {}
list.slice(first).forEach((p) => { porTipo[p.type] = (porTipo[p.type] ?? 0) + 1 })
console.log('Reparto por tipo desde el día', first + 1, JSON.stringify(porTipo))
