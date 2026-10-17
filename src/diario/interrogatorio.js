// "El interrogatorio": acertijos de lógica. Varios sospechosos hacen una declaración cada uno y hay que deducir quién es el culpable.
// Lógica pura: sirve para comprobar que cada caso tiene UNA sola solución, para redactar las declaraciones y para probarlo con `npm test`.
import { normalize } from './ciphers.js'

// Reglas del interrogatorio (el texto es lo que lee el jugador)
export const RULES = {
  culpableMiente: 'Solo el culpable miente. Los inocentes dicen la verdad.',
  unoMiente: 'Exactamente uno de ellos miente (puede ser el culpable o no).',
}

// Una declaración dice algo del culpable:
//   { by, is: 'X' }                 "El culpable es X"
//   { by, not: 'X' }                "X no es el culpable"
//   { by, oneof: ['X', 'Y'] }       "El culpable es X o Y"
//   { by, notoneof: ['X', 'Y'] }    "No es ni X ni Y"
export const KINDS = ['is', 'not', 'oneof', 'notoneof']
export const kindOf = (st) => KINDS.find((k) => k in st)
export const targets = (st) => { const v = st[kindOf(st)]; return Array.isArray(v) ? v : [v] }

// ¿Es verdad la declaración si el culpable fuera `culprit`?
export function holds(st, culprit) {
  switch (kindOf(st)) {
    case 'is': return culprit === st.is
    case 'not': return culprit !== st.not
    case 'oneof': return st.oneof.includes(culprit)
    case 'notoneof': return !st.notoneof.includes(culprit)
    default: throw new Error('Declaración desconocida')
  }
}

// Sospechosos que encajan con todas las declaraciones y la regla (debe quedar exactamente uno).
export function consistentCulprits(suspects, statements, rule) {
  return suspects.filter((c) => {
    const truth = statements.map((st) => holds(st, c))
    if (rule === 'culpableMiente') return statements.every((st, i) => (st.by === c ? !truth[i] : truth[i]))
    if (rule === 'unoMiente') return truth.filter((t) => !t).length === 1
    throw new Error('Regla desconocida: ' + rule)
  })
}

// Comprueba un acertijo { text (culpable), suspects, statements:[{ by, says, ...lógica }], rule }. Devuelve la lista de fallos.
export function validateCase(c) {
  const errs = []
  const { suspects, statements, rule, text } = c
  if (!Array.isArray(suspects) || suspects.length < 3 || suspects.length > 5) return ['Debe haber de 3 a 5 sospechosos']
  if (new Set(suspects).size !== suspects.length) errs.push('Nombres de sospechosos repetidos')
  if (!RULES[rule]) errs.push('Regla desconocida: ' + rule)
  if (!Array.isArray(statements) || statements.length !== suspects.length) return [...errs, 'Debe haber una declaración por sospechoso']
  const by = statements.map((s) => s.by)
  if (new Set(by).size !== by.length || by.some((b) => !suspects.includes(b))) errs.push('Cada sospechoso debe declarar una sola vez')
  for (const st of statements) {
    if (!kindOf(st)) { errs.push(`La declaración de ${st.by} no tiene lógica (is/not/oneof/notoneof)`); continue }
    if (!st.says?.trim()) errs.push(`Falta el texto de la declaración de ${st.by}`)
    for (const t of targets(st)) {
      if (!suspects.includes(t)) errs.push(`${st.by} nombra a "${t}", que no es sospechoso`)
      else if (t !== st.by && !String(st.says).includes(t)) errs.push(`El texto de ${st.by} no nombra a ${t}`)
    }
  }
  if (errs.length) return errs
  const found = consistentCulprits(suspects, statements, rule)
  if (found.length !== 1) errs.push(`Debe haber una sola solución y hay ${found.length}${found.length ? ': ' + found.join(', ') : ''}`)
  else if (normalize(found[0]) !== normalize(text)) errs.push(`El culpable según la lógica es ${found[0]} y la solución dice ${text}`)
  return errs
}

// Redacta una declaración con el nombre de quien habla (versión `v` para variar el texto sin azar).
export function sayFor(st, v = 0) {
  const pick = (list) => list[v % list.length]
  const self = (n) => n === st.by
  switch (kindOf(st)) {
    case 'is':
      return self(st.is) ? pick(['Fui yo.', 'Lo confieso: fui yo.']) : pick([`Fue ${st.is}.`, `Tengo claro que fue ${st.is}.`, `El culpable es ${st.is}, lo vi con mis ojos.`])
    case 'not':
      return self(st.not) ? pick(['Yo no fui.', 'Soy inocente.']) : pick([`${st.not} no fue.`, `Les aseguro que ${st.not} es inocente.`, `No fue ${st.not}.`])
    case 'oneof': {
      const [a, b] = st.oneof
      if (self(a) || self(b)) return `Fui yo o fue ${self(a) ? b : a}.`
      return pick([`Fue ${a} o fue ${b}.`, `El culpable es ${a} o ${b}.`])
    }
    default: {
      const [a, b] = st.notoneof
      if (self(a) || self(b)) return `Ni yo ni ${self(a) ? b : a} fuimos.`
      return pick([`Ni ${a} ni ${b} fueron.`, `No fue ninguno de los dos: ni ${a} ni ${b}.`])
    }
  }
}
