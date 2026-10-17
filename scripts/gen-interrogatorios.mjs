// Genera los casos de "El interrogatorio" (lógica) con UNA sola solución y los escribe en src/diario/interrogatorios.src.mjs
// (con la solución en claro: no se sube a GitHub). Uso: node scripts/gen-interrogatorios.mjs
// Las declaraciones se inventan al azar (con semilla fija, siempre sale lo mismo) hasta que encajan con una sola persona culpable.
import { writeFileSync } from 'node:fs'
import { normalize, rng } from '../src/diario/ciphers.js'
import { KINDS, consistentCulprits, kindOf, sayFor, validateCase } from '../src/diario/interrogatorio.js'

// Escenarios: nivel 2 = 3 sospechosos; nivel 3 = 4 sospechosos. Para añadir casos nuevos, añadir aquí con una semilla distinta.
const SCENARIOS = [
  { theme: 'detective', level: 2, rule: 'culpableMiente', suspects: ['Marta', 'Luis', 'Ana'], seed: 101, title: 'El reloj del abuelo',
    clue: 'Ha desaparecido el reloj del abuelo. Solo tres personas estaban en la casa y cada una hizo una declaración.' },
  { theme: 'policial', level: 2, rule: 'culpableMiente', suspects: ['Rocío', 'Daniel', 'Alicia'], seed: 102, title: 'Pruebas bajo llave',
    clue: 'Alguien abrió la caja de pruebas de la comisaría. Solo tres agentes tenían las llaves y cada uno declaró.' },
  { theme: 'egipcio', level: 2, rule: 'culpableMiente', suspects: ['Nefer', 'Amón', 'Tuya'], seed: 103, title: 'El saqueo de la tumba',
    clue: 'La tumba del faraón ha sido saqueada. Tres personas del campamento tuvieron ocasión y cada una declaró.' },
  { theme: 'alien', level: 2, rule: 'culpableMiente', suspects: ['Zeta', 'Orión', 'Vega'], seed: 104, title: 'Sabotaje en la nave',
    clue: 'Alguien ha desconectado el radar de la nave. Hay tres tripulantes a bordo y cada uno hizo una declaración.' },
  { theme: 'detective', level: 3, rule: 'unoMiente', suspects: ['Carlos', 'Elena', 'Pablo', 'Sofía'], seed: 105, title: 'El maletín desaparecido',
    clue: 'El maletín del cliente ha desaparecido de la oficina. Cuatro personas estaban allí y cada una declaró.' },
  { theme: 'policial', level: 3, rule: 'culpableMiente', suspects: ['Julián', 'Irene', 'Mateo', 'Lucía'], seed: 106, title: 'La cámara de seguridad',
    clue: 'Alguien apagó la cámara de seguridad del banco. Cuatro empleados estaban de guardia y cada uno declaró.' },
  { theme: 'egipcio', level: 3, rule: 'unoMiente', suspects: ['Kenamón', 'Meritra', 'Ibi', 'Sabu'], seed: 107, title: 'El papiro robado',
    clue: 'El papiro sagrado ha desaparecido del templo. Cuatro sacerdotes estaban dentro y cada uno declaró.' },
  { theme: 'alien', level: 3, rule: 'culpableMiente', suspects: ['Kira', 'Tarn', 'Zeph', 'Lyra'], seed: 108, title: 'Intruso a bordo',
    clue: 'Alguien abrió la compuerta mientras la nave estaba en vuelo. Cuatro tripulantes estaban despiertos y cada uno declaró.' },
]

function buildCase(sc) {
  const r = rng(sc.seed)
  const int = (n) => Math.floor(r() * n)
  const names = sc.suspects
  const culprit = names[int(names.length)]
  for (let attempt = 0; attempt < 200000; attempt++) {
    const statements = names.map((by) => {
      const others = names.filter((n) => n !== by)
      const roll = r()
      const kind = roll < 0.18 ? 'is' : roll < 0.55 ? 'not' : roll < 0.85 ? 'oneof' : 'notoneof'
      const pickTwo = () => { const a = names[int(names.length)]; let b = names[int(names.length)]; while (b === a) b = names[int(names.length)]; return [a, b] }
      if (kind === 'is') return { by, is: others[int(others.length)] }
      if (kind === 'not') return { by, not: names[int(names.length)] }
      if (kind === 'oneof') return { by, oneof: pickTwo() }
      return { by, notoneof: pickTwo() }
    })
    // calidad: variedad, y que no se resuelva con una sola declaración sin pensar
    const kinds = new Set(statements.map(kindOf))
    if (kinds.size < 2) continue
    // con la regla "solo miente el culpable", un inocente que dice "fue X" delataría a X al instante: se descarta
    if (sc.rule === 'culpableMiente' && statements.some((st) => 'is' in st && st.by !== culprit)) continue
    if (consistentCulprits(names, statements, sc.rule).join() !== culprit) continue
    // que no valga cualquier otra regla a la vez (el caso debe necesitar la regla elegida)
    const otherRule = sc.rule === 'culpableMiente' ? 'unoMiente' : 'culpableMiente'
    if (consistentCulprits(names, statements, otherRule).join() === culprit) continue
    const withText = statements.map((st) => ({ ...st, says: sayFor(st, int(3)) }))
    if (new Set(withText.map((st) => st.says)).size < withText.length) continue // nadie dice lo mismo que otro
    // pista: un inocente que no fue
    const inocentes = names.filter((n) => n !== culprit)
    return {
      type: 'interrogatorio', theme: sc.theme, level: sc.level, title: sc.title, clue: sc.clue,
      hint: `No fue ${inocentes[int(inocentes.length)]}.`,
      text: normalize(culprit), rule: sc.rule, suspects: names, statements: withText,
    }
  }
  throw new Error('No se encontró un caso para ' + sc.title)
}

const cases = SCENARIOS.map(buildCase)
for (const c of cases) {
  const errs = validateCase(c)
  if (errs.length) throw new Error(c.title + ': ' + errs.join('; '))
  console.log(`\n${c.title} (nivel ${c.level}, ${c.rule}) -> culpable ${c.text}`)
  for (const st of c.statements) console.log(`  ${st.by}: «${st.says}»`)
  console.log('  Pista:', c.hint)
}
writeFileSync(new URL('../src/diario/interrogatorios.src.mjs', import.meta.url),
  '// FUENTE de los casos de "El interrogatorio" (con la solución en claro). NO se sube a GitHub. Generado por scripts/gen-interrogatorios.mjs\nexport default ' +
  JSON.stringify(cases, null, 2) + '\n')
console.log(`\n${cases.length} casos escritos en src/diario/interrogatorios.src.mjs (kinds posibles: ${KINDS.join(', ')})`)
