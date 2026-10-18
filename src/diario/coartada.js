// La coartada: cada sospechoso estaba en un sitio distinto; con las pistas hay que averiguar quién estaba en el sitio del crimen.
// Lógica pura (sin pantalla): resolver, comprobar que solo hay una solución y generar las pistas a partir de la solución.
import { rng, shuffled } from './ciphers.js'

// Pistas posibles. p y q son índices de personas; pl, a, b índices de sitios (el sitio 0 es el más cercano a la entrada).
//   no: p no estaba en pl · es: p estaba en pl · o: p estaba en a o en b · antes: p más cerca de la entrada que q · junto: p y q en sitios contiguos
export function holds(c, at) { // at[persona] = sitio
  switch (c.t) {
    case 'no': return at[c.p] !== c.pl
    case 'es': return at[c.p] === c.pl
    case 'o': return at[c.p] === c.a || at[c.p] === c.b
    case 'antes': return at[c.p] < at[c.q]
    case 'junto': return Math.abs(at[c.p] - at[c.q]) === 1
    default: throw new Error('Pista desconocida: ' + c.t)
  }
}

function* permutations(n) {
  const a = Array.from({ length: n }, (_, i) => i)
  function* go(k) {
    if (k === n) { yield [...a]; return }
    for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; yield* go(k + 1); [a[k], a[i]] = [a[i], a[k]] }
  }
  yield* go(0)
}

// Todas las formas de colocar a las personas que cumplen las pistas.
export function coartadaSolve(n, clues) {
  const out = []
  for (const at of permutations(n)) if (clues.every((c) => holds(c, at))) out.push(at)
  return out
}

// Pistas que son verdad para la solución (at). Con ordered=false no hay "antes" ni "junto".
function trueClues(n, at, ordered) {
  const out = []
  for (let p = 0; p < n; p++) {
    for (let pl = 0; pl < n; pl++) {
      if (at[p] !== pl) out.push({ t: 'no', p, pl })
      else out.push({ t: 'es', p, pl })
    }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (at[p] === a || at[p] === b) out.push({ t: 'o', p, a, b })
    if (ordered) {
      for (let q = 0; q < n; q++) {
        if (q === p) continue
        if (at[p] < at[q]) out.push({ t: 'antes', p, q })
        if (p < q && Math.abs(at[p] - at[q]) === 1) out.push({ t: 'junto', p, q })
      }
    }
  }
  return out
}

// Genera pistas (siempre las mismas para el mismo acertijo) hasta que solo quede una solución, y quita las que sobran.
// Como mucho una pista dice directamente dónde estaba alguien ("es"), y de 3 a 7 pistas en total (mínimo 4 con 4 sospechosos o más).
export function coartadaClues(n, at, ordered, seed) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const pool = shuffled(trueClues(n, at, ordered), seed * 1000 + attempt)
    let es = 0
    const clues = []
    for (const c of pool) {
      if (c.t === 'es' && es >= 1) continue
      if (c.t === 'es') es++
      clues.push(c)
      if (coartadaSolve(n, clues).length === 1) break
    }
    if (coartadaSolve(n, clues).length !== 1) continue
    for (let i = clues.length - 1; i >= 0; i--) {
      const rest = clues.filter((_, k) => k !== i)
      if (coartadaSolve(n, rest).length === 1) clues.splice(i, 1)
    }
    if (clues.length >= (n === 3 ? 3 : 4) && clues.length <= 7) return clues
  }
  throw new Error('No se pudieron generar las pistas de la coartada')
}

// Texto de cada pista. Los sitios se escriben con su artículo ("la cocina"), así que "en la cocina" siempre suena bien.
export function clueText(c, people, places) {
  const P = (i) => people[i]
  switch (c.t) {
    case 'no': return `${P(c.p)} no estaba en ${places[c.pl]}.`
    case 'es': return `${P(c.p)} estaba en ${places[c.pl]}.`
    case 'o': return `${P(c.p)} estaba en ${places[c.a]} o en ${places[c.b]}.`
    case 'antes': return `${P(c.p)} estaba más cerca de la entrada que ${P(c.q)}.`
    case 'junto': return `${P(c.p)} y ${P(c.q)} estaban en sitios contiguos, uno al lado del otro.`
    default: throw new Error('Pista desconocida: ' + c.t)
  }
}

// Comprueba un acertijo de la lista y devuelve los errores (vacío = bien).
// p = { people:[nombres], places:["la cocina",...], solution:[sitio de cada persona], ordered, ask: índice del sitio del crimen, text: culpable }
export function validateCoartada(p) {
  const errs = []
  const n = p.people?.length
  if (!Number.isInteger(n) || n < 3 || n > 5) return ['debe haber de 3 a 5 sospechosos']
  if (p.places?.length !== n) errs.push('debe haber tantos sitios como sospechosos')
  if (new Set(p.people).size !== n) errs.push('hay nombres repetidos')
  if (new Set(p.places).size !== n) errs.push('hay sitios repetidos')
  if (!Array.isArray(p.solution) || p.solution.length !== n || new Set(p.solution).size !== n || p.solution.some((x) => !(x >= 0 && x < n))) errs.push('la solución debe colocar a cada persona en un sitio distinto')
  if (errs.length) return errs
  if (!(p.ask >= 0 && p.ask < n)) errs.push('falta ask (el sitio del crimen)')
  else if (p.people[p.solution.indexOf(p.ask)] !== p.text) errs.push(`el culpable según la solución es ${p.people[p.solution.indexOf(p.ask)]}, no ${p.text}`)
  return errs
}
