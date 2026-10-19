// Pruebas del Diario (lógica pura). Se lanzan con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  atbash, caesarDecode, caesarEncode, dateKey, dayIndex, fmtTime, hashAnswer, isCorrect, keypadDecode, keypadEncode, keypadWords,
  lockCandidates, lockFeedback, morseDecode, morseEncode, nextKey, normalize, pigpenGlyph, pigpenLetters, pigpenStore, puzzleFor,
  shareText, shuffled, streakOf, vigenereDecode, vigenereEncode, vigenereKeyFor, vigenereLetter,
} from '../src/diario/ciphers.js'
import { golpesDecode } from '../src/diario/golpes.js'
import { binarioDecode, numerosDecode } from '../src/diario/codigos.js'
import { clueText, coartadaClues, coartadaSolve, validateCoartada } from '../src/diario/coartada.js'
import { escitalaRead } from '../src/diario/escitala.js'
import { bestStreak, calendar, diarioStats, mergeDays } from '../src/diario/stats.js'
import PUZZLES from '../src/diario/puzzles.js'
// El archivo con las soluciones en claro NO está en GitHub (el repositorio es público): solo en el PC de Alberto.
const SRC = await import('../scripts/load-sources.mjs').then((m) => m.loadSources()).catch(() => null)

test('normalize quita acentos, mayúsculas y signos', () => {
  assert.equal(normalize('¡Está en el reloj!'), 'ESTAENELRELOJ')
})

test('César: A con desplazamiento 3 es D, y se deshace; lo que no son letras se respeta', () => {
  assert.equal(caesarEncode('ABC, XYZ', 3), 'DEF, ABC')
  assert.equal(caesarDecode('DEF, ABC', 3), 'ABC, XYZ')
  for (let s = 0; s < 26; s++) assert.equal(caesarDecode(caesarEncode('HOLA MUNDO', s), s), 'HOLA MUNDO')
})

test('Morse: ida y vuelta, letras con espacio y palabras con barra', () => {
  assert.equal(morseEncode('SOS AL'), '... --- ... / .- .-..')
  assert.equal(morseDecode('... --- ... / .- .-..'), 'SOS AL')
})

test('Teclado antiguo: la C es 222, ida y vuelta, y letras seguidas de la misma tecla se separan', () => {
  assert.equal(keypadEncode('CAB'), '222 2 22')
  assert.equal(keypadDecode(keypadEncode('ABRE LA TUMBA')), 'ABRE LA TUMBA')
  assert.deepEqual(keypadWords('2 22 / 7'), [['2', '22'], ['7']])
})

test('la huella acepta la respuesta con otras mayúsculas, acentos o espacios, y rechaza otra', () => {
  const p = { h: hashAnswer('La llave está en el reloj') }
  assert.ok(isCorrect(p, 'la  llave esta en el RELOJ!'))
  assert.ok(!isCorrect(p, 'la llave esta en el reloj ahora'))
})

test('los acertijos de la lista no repiten tipo dos días seguidos (ni al reiniciar), hay 8 tipos y semanas completas', () => {
  assert.equal(PUZZLES.length % 7, 0, 'semanas completas')
  assert.ok(new Set(PUZZLES.map((p) => p.type)).size >= 8, 'al menos 8 tipos distintos')
  PUZZLES.forEach((p, i) => assert.notEqual(p.type, PUZZLES[(i + 1) % PUZZLES.length].type, `acertijo ${i + 1}: mismo tipo que el siguiente`))
})

test('cada acertijo se resuelve con su solución (necesita el archivo fuente)', { skip: !SRC && 'sin los archivos .src.mjs' }, () => {
  assert.equal(PUZZLES.length, SRC.length)
  PUZZLES.forEach((p, i) => {
    const s = SRC[i]
    assert.ok(isCorrect(p, s.text), `acertijo ${i + 1}: la huella no coincide con la solución`)
    assert.ok(p.level >= 1 && p.level <= 5)
    // en el intruso y en la coartada la respuesta es una de las opciones que se ven (lo que no se ve es cuál es la buena)
    if (!['intruso', 'coartada'].includes(s.type)) assert.ok(!JSON.stringify(p).includes(s.text), `acertijo ${i + 1}: la solución está en claro`)
    if (s.type === 'cesar') {
      assert.ok(!/[ÑÁÉÍÓÚ]/.test(s.text), 'César solo admite A-Z')
      assert.ok(isCorrect(p, caesarDecode(p.data, s.shift)))
    }
    if (s.type === 'vigenere') {
      assert.ok(isCorrect(p, vigenereDecode(p.data.cipher, s.key)), 'con la clave sale la solución')
      assert.equal(p.data.kh, hashAnswer(s.key, 'sl-vigenere-clave'))
      assert.equal(p.data.len, s.key.length)
      if (s.keyGiven) assert.equal(p.data.key, s.key)
      else assert.equal(p.data.key, undefined, 'la clave secreta no viaja en claro')
      assert.equal(p.level, 5)
      assert.equal(i % 7, 6, 'solo los domingos')
    }
    if (s.type === 'numeros') {
      assert.ok(isCorrect(p, numerosDecode(p.data.code, p.data.mode)))
      assert.ok(i % 7 <= 3, 'números entre lunes y jueves (niveles 1-2)')
      if (p.data.mode === 'inverso') assert.ok(s.level >= 2, 'el modo al revés, desde el nivel 2')
    }
    if (s.type === 'binario') {
      assert.ok(isCorrect(p, binarioDecode(p.data)))
      assert.ok([4, 5, 6].includes(i % 7), 'binario de viernes a domingo (niveles 3-5)')
      assert.ok(/^[01 /]+$/.test(p.data))
    }
    if (s.type === 'sinvocales') {
      assert.ok(p.data.every((w) => !/[AEIOU]/.test(w.c) && w.c.length > 0 && w.len >= w.c.length), 'solo consonantes y el largo de la palabra')
      assert.equal(p.data.map((w) => w.len).reduce((a, b) => a + b, 0), normalize(s.text).length)
    }
    if (s.type === 'rebus') {
      assert.ok(p.data.parts.length >= 2 && p.data.parts.length <= 4)
      assert.equal(p.data.lens.reduce((a, b) => a + b, 0), normalize(s.text).length)
      assert.ok(i % 7 <= 3, 'rebus entre lunes y jueves (niveles 1-2)')
    }
    if (s.type === 'intruso') {
      assert.ok(isCorrect(p, s.text), 'la huella es la del intruso')
      assert.ok(p.data.some((x) => normalize(x.n) === normalize(s.text)), 'el intruso está entre las opciones')
      assert.ok(p.data.every((x) => Object.keys(x).every((k) => ['e', 'n'].includes(k))), 'no viaja cuál es el intruso ni por qué')
      assert.ok(s.level >= 1 && s.level <= 5)
      if (['Zanahoria', 'León', 'Cuchara', 'Casa'].some((x) => normalize(x) === normalize(s.text))) assert.equal(s.level, 1, 'los intrusos de categoría obvia son de nivel 1 (lunes y martes)')
    }
    if (s.type === 'coartada') {
      assert.deepEqual(validateCoartada(s), [])
      assert.ok(isCorrect(p, s.text), 'la huella es la del culpable')
      assert.ok([5, 6].includes(i % 7), 'coartada de sábado y domingo (niveles 4-5)')
      assert.equal(s.people.length, s.level === 4 ? 3 : 4, 'sábado 3 sospechosos, domingo 4')
      assert.ok(p.data.clues.length >= 3 && p.data.clues.length <= 7)
      assert.ok(!('solution' in p.data) && !JSON.stringify(p.data).includes('"at"'), 'la solución no viaja')
      const clues = coartadaClues(s.people.length, s.solution, !!s.ordered, i + 1)
      const sols = coartadaSolve(s.people.length, clues)
      assert.equal(sols.length, 1, 'una sola solución posible')
      assert.deepEqual(clues.map((c) => clueText(c, s.people, s.places)), p.data.clues, 'las pistas de la web son las generadas')
      assert.equal(s.people[sols[0].indexOf(s.ask)], s.text)
    }
    if (s.type === 'golpes') {
      assert.ok(isCorrect(p, golpesDecode(p.data)))
      assert.ok(!s.text.includes('K'))
      assert.ok(i % 7 === 1 || i % 7 === 2, 'golpes entre semana temprano (niveles 1-2)')
    }
    if (s.type === 'sopa') {
      assert.ok([1, 2, 3].includes(s.level) && [0, 1, 2, 3, 4].includes(i % 7), 'sopa en niveles 1-3 (lunes a viernes)')
      assert.ok(isCorrect(p, s.text))
      assert.ok(p.data.words.every((w) => w.h), 'cada palabra va con su huella')
      if (s.level === 3) assert.ok(p.data.words.every((w) => !w.w && w.c), 'nivel 3: palabras ocultas, con pista')
      else assert.ok(p.data.words.every((w) => w.w))
      assert.ok(!JSON.stringify(p.data).includes(normalize(s.text)), 'el mensaje no viaja en claro')
    }
    if (s.type === 'escitala') {
      assert.equal(s.level, 3)
      assert.ok(i % 7 === 4, 'escítala en viernes (nivel 3)')
      assert.equal(escitalaRead(p.data.cipher, s.rows), normalize(s.text), 'con el grosor correcto se lee el mensaje')
      assert.ok(isCorrect(p, s.text))
      assert.ok(!JSON.stringify(p.data).includes(normalize(s.text)), 'el mensaje no viaja en claro')
    }
    if (s.type === 'interrogatorio') {
      assert.ok(isCorrect(p, s.text), 'la huella es la del culpable')
      assert.ok(p.data.statements.every((st) => Object.keys(st).sort().join() === 'by,says'), 'la lógica no viaja en la web')
      assert.ok(i % 7 === 3 || i % 7 === 4, 'jueves o viernes (niveles 2-3)')
    }
    if (s.type === 'morse') assert.ok(isCorrect(p, morseDecode(p.data)))
    if (s.type === 'teclado') assert.ok(isCorrect(p, keypadDecode(p.data)))
    if (s.type === 'espejo') assert.ok(isCorrect(p, atbash(p.data)))
    if (s.type === 'simbolos') assert.ok(isCorrect(p, pigpenLetters(p.data)))
    if (s.type === 'acrostico') assert.ok(isCorrect(p, p.data.map((l) => normalize(l)[0]).join('')))
    if (s.type === 'anagrama') {
      assert.equal([...p.data.pool].sort().join(''), [...normalize(s.text)].sort().join(''), 'mismas letras')
      assert.equal(p.data.lens.reduce((a, b) => a + b, 0), p.data.pool.length)
      assert.notEqual(p.data.pool, normalize(s.text), 'no está ya ordenado')
    }
    if (s.type === 'cerradura') {
      const cands = lockCandidates(p.data)
      assert.equal(cands.length, 1, 'una sola solución posible')
      assert.ok(isCorrect(p, cands[0]))
    }
  })
})

test('Cerradura: ● bien colocadas y ○ correctas mal colocadas', () => {
  assert.deepEqual(lockFeedback('482', '482'), { bien: 3, mal: 0 })
  assert.deepEqual(lockFeedback('482', '248'), { bien: 0, mal: 3 })
  assert.deepEqual(lockFeedback('482', '417'), { bien: 1, mal: 0 })
  assert.deepEqual(lockFeedback('482', '135'), { bien: 0, mal: 0 })
  assert.deepEqual(lockFeedback('482', '843'), { bien: 0, mal: 2 })
})

test('Espejo: A es Z, y se deshace', () => {
  assert.equal(atbash('ABC XYZ'), 'ZYX CBA')
  assert.equal(atbash(atbash('HOLA')), 'HOLA')
})

test('Símbolos: las 26 letras tienen un dibujo distinto', () => {
  const dib = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((l) => { const g = pigpenGlyph(l); return `${g.d}|${g.dot}` })
  assert.equal(new Set(dib).size, 26)
  assert.equal(pigpenLetters(pigpenStore('HOLA MUNDO')), 'HOLA MUNDO')
})

test('el azar con semilla da siempre lo mismo', () => {
  assert.deepEqual(shuffled([1, 2, 3, 4, 5, 6], 7), shuffled([1, 2, 3, 4, 5, 6], 7))
  assert.notDeepEqual(shuffled([1, 2, 3, 4, 5, 6, 7, 8], 7), shuffled([1, 2, 3, 4, 5, 6, 7, 8], 8))
})

test('el nivel sube de lunes a domingo', () => {
  assert.equal(dayIndex('2026-10-12'), 0)
  PUZZLES.forEach((p, i) => assert.equal(p.level, [1, 1, 2, 2, 3, 4, 5][i % 7], `acertijo ${i + 1}`))
})

test('fechas: la lista se repite, cambia de día a medianoche y no se rompe con el horario de verano', () => {
  assert.equal(puzzleFor(PUZZLES, '2026-10-12').id, 1)
  const L = PUZZLES.length
  assert.equal(puzzleFor(PUZZLES, nextKey('2026-10-12', L - 1)).id, L)
  assert.equal(puzzleFor(PUZZLES, nextKey('2026-10-12', L)).id, 1) // al acabar la lista vuelve a empezar
  assert.equal(puzzleFor(PUZZLES, '2026-10-11').id, L) // antes del inicio también hay acertijo
  assert.equal(puzzleFor(PUZZLES, '2026-11-08').id, 28) // los 28 primeros no cambian al alargar la lista
  assert.equal(dayIndex('2027-03-29') - dayIndex('2027-03-27'), 2)
  assert.equal(nextKey('2026-12-31'), '2027-01-01')
  assert.equal(nextKey('2026-03-01', -1), '2026-02-28')
  assert.equal(dateKey(new Date(2026, 9, 5)), '2026-10-05')
})

test('racha: cuenta días seguidos, sigue viva si hoy aún no se resolvió y se rompe con un hueco', () => {
  const d = (...ks) => Object.fromEntries(ks.map((k) => [k, { done: true }]))
  assert.equal(streakOf(d('2026-10-14', '2026-10-15', '2026-10-16'), '2026-10-16'), 3)
  assert.equal(streakOf(d('2026-10-14', '2026-10-15'), '2026-10-16'), 2)
  assert.equal(streakOf(d('2026-10-13', '2026-10-15'), '2026-10-16'), 1)
  assert.equal(streakOf(d('2026-10-10'), '2026-10-16'), 0)
  assert.equal(streakOf({}, '2026-10-16'), 0)
})

test('texto para compartir: no revela la solución y resume intentos, pista y tiempo', () => {
  const t = shareText({ level: 3 }, { n: 5, tries: 2, hint: true, ms: 134000 }, 'https://x.test/diario')
  assert.match(t, /nº 5/)
  assert.match(t, /★★★☆☆/)
  assert.match(t, /🟥🟥🟩 💡/)
  assert.match(t, /2:14/)
  assert.match(t, /https:\/\/x\.test\/diario/)
  assert.equal(fmtTime(65000), '1:05')
})

// ---------- Estadísticas personales y mezcla con la nube ----------
const hecho = (extra = {}) => ({ done: true, tries: 0, hint: false, ms: 60000, ...extra })

test('mejor racha: cuenta el tramo más largo de días seguidos del historial', () => {
  const d = { '2026-10-01': hecho(), '2026-10-02': hecho(), '2026-10-03': hecho(), '2026-10-05': hecho(), '2026-10-06': hecho(), '2026-10-07': { done: false } }
  assert.equal(bestStreak(d), 3)
  assert.equal(bestStreak({}), 0)
})

test('calendario: 4 semanas de lunes a domingo que acaban en la semana de hoy', () => {
  const hoy = '2026-10-16' // viernes
  const cal = calendar({ '2026-10-15': hecho(), '2026-10-14': { done: false } }, hoy)
  assert.equal(cal.length, 28)
  assert.equal(cal[0].key, '2026-09-21') // lunes de hace 3 semanas
  assert.equal(cal[27].key, '2026-10-18') // domingo de esta semana
  assert.equal(cal.find((c) => c.key === '2026-10-15').state, 'done')
  assert.equal(cal.find((c) => c.key === '2026-10-14').state, 'miss')
  assert.equal(cal.find((c) => c.key === hoy).state, 'today')
  assert.equal(cal.find((c) => c.key === '2026-10-17').state, 'future')
})

test('estadísticas: totales, porcentajes y tiempo medio por tipo (aunque falte el tipo guardado)', () => {
  const dias = {
    '2026-10-14': hecho({ ms: 120000, tries: 2, type: 'cesar' }),
    '2026-10-15': hecho({ ms: 60000, hint: true }), // sin tipo guardado: se deduce de la fecha (día 4 de la lista = cesar)
    '2026-10-16': hecho({ ms: 90000, type: 'morse' }),
    '2026-10-13': { done: false, tries: 3, hint: false, ms: 5000 },
  }
  const s = diarioStats(dias, '2026-10-16', PUZZLES)
  assert.equal(s.solved, 3)
  assert.equal(s.streak, 3)
  assert.equal(s.avgMs, 90000)
  assert.equal(s.firstTryPct, 67)
  assert.equal(s.noHintPct, 67)
  assert.deepEqual(s.types.map((t) => [t.type, t.count]), [['cesar', 2], ['morse', 1]])
  assert.equal(s.types[0].avgMs, 90000)
  assert.equal(diarioStats({}, '2026-10-16', PUZZLES).avgMs, null)
})

test('mezcla móvil + nube: un día resuelto gana, lo que solo está en el móvil se sube y nada se pierde', () => {
  const local = { a: hecho({ ms: 50000 }), b: { done: false, tries: 1, hint: false, ms: 1 }, solo: hecho() }
  const remote = { a: hecho({ ms: 99000 }), b: hecho({ ms: 70000 }), nube: hecho() }
  const { merged, upload } = mergeDays(local, remote)
  assert.equal(merged.a.ms, 99000) // ambos resueltos: se queda el de la nube
  assert.equal(merged.b.done, true)
  assert.ok(merged.solo && merged.nube)
  assert.deepEqual(upload.sort(), ['solo'])
  // móvil resuelto y nube sin resolver: se sube el del móvil
  const m2 = mergeDays({ x: hecho() }, { x: { done: false, tries: 2, hint: true, ms: 1 } })
  assert.equal(m2.merged.x.done, true)
  assert.deepEqual(m2.upload, ['x'])
  // la pista y los fallos nunca se pierden
  const m3 = mergeDays({ y: { done: false, tries: 4, hint: true, ms: 1 } }, { y: { done: false, tries: 1, hint: false, ms: 1 } })
  assert.equal(m3.merged.y.tries, 4)
  assert.equal(m3.merged.y.hint, true)
})

test('aviso diario: el mensaje cambia cada día y trae número y dificultad', async () => {
  const { buildMessage, BODIES } = await import('../scripts/send-diario-push.mjs')
  const a = buildMessage('2026-10-12'), b = buildMessage('2026-10-13')
  assert.match(a.title, /nº 1 · ★+☆*/)
  assert.notEqual(a.body, b.body)
  assert.ok(BODIES.every((t) => t.length < 80))
  assert.equal(buildMessage('2026-10-12').body, buildMessage('2026-10-12').body)
})

test('Mis casos: resumen de una partida con tiempo por paso', async () => {
  const { caseSummary } = await import('../src/diario/casos.js')
  const t0 = new Date('2026-10-17T10:00:00Z'), at = (min) => new Date(t0.getTime() + min * 60000)
  const steps = { v0: { type: 'start', label: 'V0' }, p1: { type: 'clue', label: 'Pista 1' }, sol: { type: 'solution', label: 'Solución' } }
  const scans = [{ id: 'sol', at: at(95) }, { id: 'v0', at: at(0) }, { id: 'p1', at: at(30) }, { id: 'x', at: null }]
  const fin = caseSummary({ startedAt: t0, endedAt: at(95) }, { timeLimitMinutes: 240 }, scans, steps, at(500).getTime())
  assert.equal(fin.status.kind, 'finished')
  assert.equal(fin.status.ms, 95 * 60000)
  assert.deepEqual(fin.rows.map((r) => [r.label, r.ms / 60000]), [['Inicio', 0], ['Pista 1', 30], ['Solución', 65]])
  assert.equal(caseSummary({ startedAt: t0, endedAt: null }, { timeLimitMinutes: 60 }, [], {}, at(61).getTime()).status.kind, 'timeout')
  assert.equal(caseSummary({ startedAt: t0, endedAt: null }, null, [{ id: 'z', at: at(5) }], {}, at(10).getTime()).rows[0].label, 'Paso')
})

// ---------- Críptico ----------
test('críptico: la longitud de la pista y el texto de la explicación', async () => {
  const { parseLens, clueBody, hideText, showText } = await import('../src/diario/criptico.js')
  assert.deepEqual(parseLens('Algo: cosa (5)'), [5])
  assert.deepEqual(parseLens('Algo (3,4)'), [3, 4])
  assert.equal(parseLens('Sin longitud'), null)
  assert.equal(clueBody('Algo: cosa (3, 4)'), 'Algo: cosa')
  const t = 'Si mezclas S-E-P-I-A te sale ESPÍA. ¡Ñandú! «ok»'
  assert.equal(showText(hideText(t)), t)
  assert.ok(!hideText(t).includes('ESPÍA'))
})

test('críptico: la comprobación acepta pistas correctas de cada tipo y rechaza las rotas', async () => {
  const { validateCryptic } = await import('../src/diario/criptico.js')
  const ok = (text, cryptic) => assert.deepEqual(validateCryptic({ text, cryptic: { explain: 'x', ...cryptic } }), [])
  const bad = (text, cryptic, re) => assert.match(validateCryptic({ text, cryptic: { explain: 'x', ...cryptic } }).join('|'), re)
  ok('SOPA', { clue: 'Plato caliente: paso revuelto (4)', def: 'Plato caliente', kind: 'anagrama', material: 'paso', indicator: 'revuelto' })
  ok('CLAVE', { clue: 'Contraseña escondida en el ancla vetusta (5)', def: 'Contraseña', kind: 'escondida', material: 'ancla vetusta', indicator: 'escondida en' })
  ok('ROMA', { clue: 'Ciudad eterna: pasión devuelta (4)', def: 'Ciudad eterna', kind: 'reves', indicator: 'devuelta', parts: [{ word: 'AMOR', from: 'pasión' }] })
  ok('SOLDADO', { clue: 'Astro rey y cubo de juego forman un militar (7)', def: 'un militar', kind: 'suma', indicator: 'forman', parts: [{ word: 'SOL', from: 'Astro rey' }, { word: 'DADO', from: 'cubo de juego' }] })
  ok('SOMBRA', { clue: 'Lo que te sigue de cerca: sobra con eme dentro (6)', def: 'Lo que te sigue de cerca', kind: 'contenedor', indicator: 'dentro', parts: [{ word: 'SOBRA', from: 'sobra' }, { word: 'M', from: 'eme' }] })
  ok('LLAVE', { clue: 'Abre la puerta y cierra el agua (5)', def: 'Abre la puerta', def2: 'cierra el agua', kind: 'doble' })
  ok('EL SOL', { clue: 'Astro rey: los el revueltos (2,3)', def: 'Astro rey', kind: 'anagrama', material: 'los el', indicator: 'revueltos' })
  bad('SOPA', { clue: 'Plato caliente: paso revuelto (4)', def: 'Plato caliente', kind: 'anagrama', material: 'pase', indicator: 'revuelto' }, /no aparece|no forman/)
  bad('SOPA', { clue: 'Plato caliente: pasos revuelto (4)', def: 'Plato caliente', kind: 'anagrama', material: 'pasos', indicator: 'revuelto' }, /no forman/)
  bad('SOPA', { clue: 'Plato caliente: paso revuelto (5)', def: 'Plato caliente', kind: 'anagrama', material: 'paso', indicator: 'revuelto' }, /longitud/)
  bad('SOPA', { clue: 'Plato caliente: paso revuelto', def: 'Plato caliente', kind: 'anagrama', material: 'paso', indicator: 'revuelto' }, /paréntesis/)
  bad('SOPA', { clue: 'Un plato: paso revuelto hoy (4)', def: 'paso', kind: 'anagrama', material: 'paso', indicator: 'revuelto' }, /principio o al final/)
  bad('SOPA', { clue: 'Plato caliente: paso (4)', def: 'Plato caliente', kind: 'anagrama', material: 'paso', indicator: 'revuelto' }, /aviso/)
  bad('ROMA', { clue: 'Ciudad eterna: pasión devuelta (4)', def: 'Ciudad eterna', kind: 'reves', indicator: 'devuelta', parts: [{ word: 'AMAR', from: 'pasión' }] }, /al revés/)
  bad('SOLDADO', { clue: 'Astro rey y cubo de juego forman un militar (7)', def: 'un militar', kind: 'suma', indicator: 'forman', parts: [{ word: 'SOL', from: 'Astro rey' }, { word: 'DAD', from: 'cubo de juego' }] }, /pegadas/)
  bad('SOMBRA', { clue: 'Lo que te sigue: sobra con eme dentro (6)', def: 'Lo que te sigue', kind: 'contenedor', indicator: 'dentro', parts: [{ word: 'SOBRA', from: 'sobra' }, { word: 'N', from: 'eme' }] }, /Metiendo la pieza/)
  bad('CLAVE', { clue: 'Contraseña escondida en la clave nueva (5)', def: 'Contraseña', kind: 'escondida', material: 'clave', indicator: 'escondida en' }, /palabra entera/)
  bad('LLAVE', { clue: 'Abre la puerta y cierra el agua (5)', def: 'Abre la puerta', kind: 'doble' }, /def2/)
  bad('LLAVE', { clue: 'Abre la puerta (5)', def: 'Abre la puerta', kind: 'inventado' }, /desconocido/)
})

test('críptico: los crípticos de Alberto cuadran (solo en su PC, los archivos no están en GitHub)', async (t) => {
  const { readdirSync } = await import('node:fs')
  const dir = new URL('../src/diario/', import.meta.url)
  const files = readdirSync(dir).filter((f) => /^criptos(-\d+)?\.src\.mjs$/.test(f))
  if (!files.length) return t.skip('no hay criptos*.src.mjs')
  const { validateCryptic } = await import('../src/diario/criptico.js')
  const answers = new Set()
  let total = 0
  for (const f of files) {
    const CR = (await import(new URL(f, dir))).default
    assert.ok(CR.length >= 8, f)
    for (const p of CR) {
      assert.deepEqual(validateCryptic(p), [], p.title)
      assert.equal(p.level, 4, p.title) // sábado
      assert.ok(!answers.has(normalize(p.text)), 'respuesta repetida ' + p.text)
      answers.add(normalize(p.text))
      total++
    }
  }
  // en la lista final hay un críptico cada sábado
  assert.equal(PUZZLES.filter((p) => p.type === 'criptico').length, total, 'todos los crípticos están en la lista')
})

// ---------- Morse con sonido ----------
test('Morse sonoro: puntos, rayas y pausas con los tiempos estándar', async () => {
  const { morseSignals, vibratePattern, totalMs } = await import('../src/diario/morseSound.js')
  const u = 100
  // "S" = ... : sonido 1, pausa 1, sonido 1, pausa 1, sonido 1
  assert.deepEqual(morseSignals('...', u), [{ on: true, ms: 100 }, { on: false, ms: 100 }, { on: true, ms: 100 }, { on: false, ms: 100 }, { on: true, ms: 100 }])
  // letras separadas por 3 unidades, palabras por 7: "A B" = .- / -...
  const ab = morseSignals('.- / -...', u).map((s) => `${s.on ? 'X' : '_'}${s.ms / u}`).join(' ')
  assert.equal(ab, 'X1 _1 X3 _7 X3 _1 X1 _1 X1 _1 X1')
  assert.equal(morseSignals('.- -...', u).map((s) => s.ms / u).join(','), '1,1,3,3,3,1,1,1,1,1,1') // dos letras: pausa de 3
  // siempre alterna y empieza con sonido
  for (const s of ['... --- ...', '-.-. .- ... --- / .- -...']) {
    const sig = morseSignals(s, u)
    assert.ok(sig[0].on && sig.every((x, i) => x.on === (i % 2 === 0)))
    assert.equal(vibratePattern(sig).length, sig.length)
  }
  assert.equal(totalMs(morseSignals('.', 50)), 50)
  assert.deepEqual(morseSignals('', u), [])
})
test('Morse sonoro: el mensaje de cada acertijo tiene la duración esperada', async () => {
  const { morseSignals, totalMs, SPEEDS } = await import('../src/diario/morseSound.js')
  const M = PUZZLES.filter((p) => p.type === 'morse')
  assert.ok(M.length >= 10)
  for (const p of M) {
    const signals = morseSignals(p.data, SPEEDS.lento)
    assert.ok(signals.length > 4)
    assert.ok(totalMs(signals) < 5 * 60000, 'dura menos de 5 minutos') // incluso el más largo
  }
})

// ---------- Puntos, racha y archivo ----------
const D = (o = {}) => ({ done: true, tries: 0, hint: false, ms: 60000, level: 3, ...o })

test('puntos: 10 por nivel, +50 % a la primera, +25 % sin pista', async () => {
  const { dayPoints } = await import('../src/diario/points.js')
  assert.equal(dayPoints(D(), 0).total, 53) // 30 × 1,75 = 52,5 -> 53
  assert.equal(dayPoints(D({ level: 1 }), 0).total, 18) // 10 × 1,75 = 17,5 -> 18
  assert.equal(dayPoints(D({ tries: 2 }), 0).total, 38) // 30 × 1,25 = 37,5 -> 38
  assert.equal(dayPoints(D({ hint: true }), 0).total, 45) // 30 × 1,5
  assert.equal(dayPoints(D({ tries: 1, hint: true, level: 5 }), 0).total, 50) // solo el nivel
  const b = dayPoints(D(), 0)
  assert.deepEqual([b.base, b.firstTry, b.noHint, b.multiplier, b.late], [30, true, true, 1, false])
})

test('puntos: la racha multiplica (+0,1 por día, tope ×2)', async () => {
  const { dayPoints, multiplier, fmtMult } = await import('../src/diario/points.js')
  assert.equal(multiplier(0), 1)
  assert.equal(multiplier(3), 1.3)
  assert.equal(multiplier(10), 2)
  assert.equal(multiplier(50), 2)
  assert.equal(multiplier(-4), 1)
  assert.equal(dayPoints(D({ level: 2 }), 3).total, Math.round(Math.round(20 * 1.75) * 1.3)) // 35 × 1,3 = 45,5 -> 46
  assert.equal(dayPoints(D({ level: 5 }), 99).total, Math.round(88 * 2)) // 50 × 1,75 = 87,5 -> 88 × 2
  assert.equal(fmtMult(1.3), '×1,3')
  assert.equal(fmtMult(2), '×2')
})

test('puntos: lo jugado desde el archivo da la mitad, sin multiplicador', async () => {
  const { dayPoints } = await import('../src/diario/points.js')
  const normal = dayPoints(D(), 0)
  const arch = dayPoints(D({ late: true }), 9) // aunque la racha sea alta
  assert.equal(arch.late, true)
  assert.equal(arch.multiplier, 1)
  assert.equal(arch.total, Math.round(normal.subtotal / 2))
})

test('racha: los días jugados desde el archivo no la suman ni la mantienen', async () => {
  const { streakBefore, totalPoints, todayMultiplier } = await import('../src/diario/points.js')
  const days = { '2026-10-12': D(), '2026-10-13': D(), '2026-10-14': D({ late: true }), '2026-10-15': D(), '2026-10-16': D() }
  assert.equal(streakOf(days, '2026-10-16'), 2) // 15 y 16; el 14 es de archivo
  assert.equal(streakBefore(days, '2026-10-16'), 1)
  assert.equal(streakBefore(days, '2026-10-13'), 1)
  assert.equal(streakBefore(days, '2026-10-15'), 0) // el 14 no cuenta
  assert.equal(todayMultiplier(days, '2026-10-17'), 1.2)
  assert.equal(bestStreak(days), 2)
  // puntos: 12 -> ×1; 13 -> ×1,1; 14 (archivo) -> mitad; 15 -> ×1; 16 -> ×1,1
  const p = (m) => Math.round(53 * m)
  assert.equal(totalPoints(days), p(1) + p(1.1) + Math.round(53 / 2) + p(1) + p(1.1))
  // rellenar un hueco desde el archivo no reconecta la racha
  const hueco = { '2026-10-12': D(), '2026-10-14': D(), '2026-10-13': D({ late: true }) }
  assert.equal(streakOf(hueco, '2026-10-14'), 1)
})

test('puntos: rangos', async () => {
  const { rankOf, RANKS } = await import('../src/diario/points.js')
  assert.equal(rankOf(0).name, 'Aprendiz')
  assert.equal(rankOf(199).name, 'Aprendiz')
  assert.equal(rankOf(200).name, 'Ayudante')
  assert.equal(rankOf(199).toNext, 1)
  assert.equal(rankOf(100).fraction, 0.5)
  assert.equal(rankOf(7000).name, 'Maestro del código')
  assert.equal(rankOf(99999).next, null)
  assert.equal(rankOf(99999).fraction, 1)
  assert.ok(RANKS.every((r, i) => i === 0 || r.from > RANKS[i - 1].from))
})

test('calendario de 4 semanas distingue lo resuelto en su día y desde el archivo', () => {
  const cal = calendar({ '2026-10-15': D(), '2026-10-14': D({ late: true }) }, '2026-10-16')
  const st = (k) => cal.find((c) => c.key === k).state
  assert.equal(st('2026-10-15'), 'done')
  assert.equal(st('2026-10-14'), 'late')
  assert.equal(st('2026-10-16'), 'today')
  assert.equal(st('2026-10-13'), 'miss')
})

test('archivo: meses desde el primer día hasta hoy, alineados por semana', async () => {
  const { archiveMonths, archiveSummary, dayState } = await import('../src/diario/archive.js')
  const days = { '2026-10-13': D(), '2026-10-14': D({ late: true }), '2026-10-15': { done: false, tries: 1, hint: false, ms: 0 } }
  const m = archiveMonths(days, '2026-11-10')
  assert.deepEqual(m.map((x) => x.key), ['2026-11', '2026-10']) // el más reciente primero
  assert.equal(m[1].label, 'Octubre 2026')
  assert.equal(m[1].cells.length, 31)
  assert.equal(m[1].blanks, 3) // el 1 de octubre de 2026 fue jueves (lunes = 0)
  assert.equal(m[0].blanks, 6) // el 1 de noviembre fue domingo
  const oct = (d) => m[1].cells[d - 1].state
  assert.equal(oct(5), 'before') // antes del primer día (12/10)
  assert.equal(oct(12), 'miss')
  assert.equal(oct(13), 'done')
  assert.equal(oct(14), 'late')
  assert.equal(oct(15), 'started')
  assert.equal(m[0].cells[9].state, 'today') // 10 de noviembre
  assert.equal(m[0].cells[10].state, 'future')
  assert.equal(dayState({}, '2026-10-12', '2026-10-12'), 'today')
  assert.deepEqual(archiveSummary(days, '2026-10-16'), { done: 2, total: 4 })
  assert.deepEqual(archiveSummary({}, '2026-10-12'), { done: 0, total: 0 })
})

test('mezcla móvil/nube: lo resuelto en la nube manda también en la marca "late"', () => {
  const r = mergeDays({ a: D({ late: true }) }, { a: D() })
  assert.equal(r.merged.a.late, undefined)
  assert.deepEqual(mergeDays({}, { a: D({ late: true }) }).merged.a.late, true)
  assert.deepEqual(mergeDays({ a: D({ late: true }) }, {}).upload, ['a'])
})

// ---------- Vigenère ----------
test('Vigenère: cada letra se mueve según la clave y se deshace', () => {
  assert.equal(vigenereEncode('HOLA', 'SOL'), 'ZCWS') // H+S=Z, O+O=C, L+L=W, A+S=S
  assert.equal(vigenereDecode('ZCWS', 'SOL'), 'HOLA')
  assert.equal(vigenereEncode('LA TUMBA ES', 'NILO'), 'YI EIZJL SF') // los espacios no gastan letras de la clave
  assert.equal(vigenereEncode('abc', 'a'), 'ABC') // la A no mueve nada
  assert.equal(vigenereEncode('XYZ', 'B'), 'YZA') // da la vuelta al alfabeto
  assert.equal(vigenereEncode('HOLA, MUNDO!', 'sol'), 'ZCWS, AFFRZ!') // la clave sigue su cuenta y la puntuación se queda igual
  const msg = 'EL CULPABLE SIEMPRE DEJA UNA HUELLA'
  for (const key of ['LUPA', 'A', 'ESCRIBA', 'JUSTICIA']) assert.equal(vigenereDecode(vigenereEncode(msg, key), key), msg)
  assert.throws(() => vigenereEncode('HOLA', '123'))
})

test('Vigenère: la letra de clave de cada casilla y la tabla de ayuda', () => {
  assert.deepEqual(vigenereKeyFor('AB CD', 'XY'), ['X', 'Y', 'X', 'Y'])
  assert.deepEqual(vigenereKeyFor('HOLA', 'SOL'), ['S', 'O', 'L', 'S'])
  assert.equal(vigenereLetter('Z', 'S'), 'H') // con la clave S, la Z cifrada es la H
  assert.equal(vigenereLetter('C', 'O'), 'O')
  assert.equal(vigenereLetter('A', 'B'), 'Z')
})

test('Vigenère: solo queda el del día 7 (se retiró para el resto), en domingo, con nivel 5, y la clave secreta no viaja en claro', () => {
  const V = PUZZLES.filter((p) => p.type === 'vigenere')
  assert.equal(V.length, 1)
  assert.equal(PUZZLES.indexOf(V[0]), 6, 'es el domingo 18/10/2026, que ya se jugó')
  PUZZLES.forEach((p, i) => { if (p.type === 'vigenere') { assert.equal(i % 7, 6); assert.equal(p.level, 5) } })
  for (const p of V) {
    assert.ok(/^[A-Z ]+$/.test(p.data.cipher))
    assert.ok(p.data.len >= 3 && p.data.len <= 8)
    assert.equal(typeof p.data.kh, 'string')
    if (p.data.key) assert.equal(p.data.key.length, p.data.len) // clave visible: solo en los de aprender
  }
})

// ---------- Golpes en la pared ----------
test('Golpes: cada letra son fila y columna, la K se escribe con la C, y se deshace', async () => {
  const { golpesEncode, golpesDecode, golpesOf, SQUARE } = await import('../src/diario/golpes.js')
  assert.equal(golpesEncode('HOLA ME'), '23 34 31 11 / 32 15')
  assert.equal(golpesDecode('23 34 31 11 / 32 15'), 'HOLA ME')
  assert.equal(golpesEncode('KILO'), golpesEncode('CILO')) // sin K
  assert.deepEqual(golpesOf('h'), [2, 3])
  assert.deepEqual(golpesOf('Z'), [5, 5])
  assert.equal(SQUARE.join('').length, 25)
  assert.equal(new Set(SQUARE.join('')).size, 25)
  const texto = 'EL PLAN SE ACTIVA EN TRES DIAS'
  assert.equal(golpesDecode(golpesEncode(texto)), texto)
})

test('Golpes: los golpes y las pausas del sonido tienen los tiempos esperados', async () => {
  const { golpesSignals, golpesEncode } = await import('../src/diario/golpes.js')
  const u = 100
  // letra B = fila 1, columna 2: 1 golpe, pausa de 3, 2 golpes (pausa de 1 entre ellos)
  assert.deepEqual(golpesSignals('12', u).map((s) => [s.on, s.ms / u]), [[true, 1], [false, 3], [true, 1], [false, 1], [true, 1]])
  // dos letras: pausa de 6; dos palabras: pausa de 10
  assert.equal(golpesSignals('11 11', u).map((s) => s.ms / u).join(','), '1,3,1,6,1,3,1')
  assert.equal(golpesSignals('11 / 11', u).map((s) => s.ms / u).join(','), '1,3,1,10,1,3,1')
  const sig = golpesSignals(golpesEncode('HOLA'), u)
  assert.ok(sig[0].on && sig.every((x, i) => x.on === (i % 2 === 0)), 'alterna sonido y silencio')
  assert.equal(golpesSignals('', u).length, 0)
})

// ---------- El interrogatorio ----------
test('Interrogatorio: cuándo es verdad una declaración y quién encaja con la regla', async () => {
  const { holds, consistentCulprits, kindOf } = await import('../src/diario/interrogatorio.js')
  assert.equal(holds({ by: 'A', is: 'B' }, 'B'), true)
  assert.equal(holds({ by: 'A', is: 'B' }, 'C'), false)
  assert.equal(holds({ by: 'A', not: 'B' }, 'C'), true)
  assert.equal(holds({ by: 'A', not: 'B' }, 'B'), false)
  assert.equal(holds({ by: 'A', oneof: ['B', 'C'] }, 'C'), true)
  assert.equal(holds({ by: 'A', oneof: ['B', 'C'] }, 'A'), false)
  assert.equal(holds({ by: 'A', notoneof: ['B', 'C'] }, 'A'), true)
  assert.equal(holds({ by: 'A', notoneof: ['B', 'C'] }, 'B'), false)
  assert.equal(kindOf({ by: 'A', oneof: [] }), 'oneof')
  const S = ['Marta', 'Luis', 'Ana']
  // Marta: "Fue Luis"; Luis: "Fui yo o fue Marta"; Ana: "No fue Luis". Solo el culpable miente -> Marta.
  const st = [{ by: 'Marta', is: 'Luis' }, { by: 'Luis', oneof: ['Luis', 'Marta'] }, { by: 'Ana', not: 'Luis' }]
  assert.deepEqual(consistentCulprits(S, st, 'culpableMiente'), ['Marta'])
  // con "exactamente uno miente" encajan dos (Marta y Luis): ese caso sería ambiguo
  assert.deepEqual(consistentCulprits(S, st, 'unoMiente'), ['Marta', 'Luis'])
  assert.throws(() => consistentCulprits(S, st, 'inventada'))
})

test('Interrogatorio: la comprobación exige una sola solución y declaraciones bien escritas', async () => {
  const { validateCase, sayFor } = await import('../src/diario/interrogatorio.js')
  const base = () => ({
    text: 'MARTA', rule: 'culpableMiente', suspects: ['Marta', 'Luis', 'Ana'],
    statements: [{ by: 'Marta', is: 'Luis', says: 'Fue Luis.' }, { by: 'Luis', oneof: ['Luis', 'Marta'], says: 'Fui yo o fue Marta.' }, { by: 'Ana', not: 'Luis', says: 'No fue Luis.' }],
  })
  assert.deepEqual(validateCase(base()), [])
  const malCulpable = { ...base(), text: 'LUIS' }
  assert.match(validateCase(malCulpable).join('|'), /culpable según la lógica es Marta/)
  const ambiguo = { ...base(), rule: 'unoMiente' }
  assert.match(validateCase(ambiguo).join('|'), /una sola solución y hay 2/)
  const sinTexto = base(); sinTexto.statements[2].says = ''
  assert.match(validateCase(sinTexto).join('|'), /Falta el texto/)
  const sinNombre = base(); sinNombre.statements[0].says = 'Fue otro.'
  assert.match(validateCase(sinNombre).join('|'), /no nombra a Luis/)
  const ajeno = base(); ajeno.statements[2].not = 'Pepe'
  assert.match(validateCase(ajeno).join('|'), /no es sospechoso/)
  const pocos = { ...base(), suspects: ['Marta', 'Luis'] }
  assert.match(validateCase(pocos).join('|'), /3 a 5/)
  const repetida = base(); repetida.statements[2].by = 'Luis'
  assert.match(validateCase(repetida).join('|'), /declarar una sola vez/)
  assert.equal(sayFor({ by: 'Ana', not: 'Ana' }), 'Yo no fui.')
  assert.equal(sayFor({ by: 'Ana', oneof: ['Ana', 'Luis'] }), 'Fui yo o fue Luis.')
  assert.equal(sayFor({ by: 'Ana', notoneof: ['Marta', 'Ana'] }), 'Ni yo ni Marta fuimos.')
  assert.equal(sayFor({ by: 'Ana', is: 'Luis' }, 0), 'Fue Luis.')
})

test('Interrogatorio: todos los casos de la lista tienen una sola solución (necesita los archivos fuente)', async (t) => {
  const IN = await import('../src/diario/interrogatorios.src.mjs').then((m) => m.default).catch(() => null)
  if (!IN) return t.skip('no está interrogatorios.src.mjs')
  const { validateCase } = await import('../src/diario/interrogatorio.js')
  assert.ok(IN.length >= 8)
  for (const c of IN) assert.deepEqual(validateCase(c), [], c.title)
  assert.equal(PUZZLES.filter((p) => p.type === 'interrogatorio').length, IN.length, 'todos están en la lista')
})

// ---------- Escítala ----------
test('Escítala: se cifra por columnas, se lee por filas y solo el grosor justo da el mensaje', async () => {
  const { escitalaEncode, escitalaGrid, escitalaRead, escitalaFits } = await import('../src/diario/escitala.js')
  const texto = 'EL TESORO ESTA EN EL POZO'
  const cifrado = escitalaEncode(texto, 4)
  assert.equal(cifrado, 'EOTLLRAPTOEOEENZSSEO')
  assert.equal(escitalaRead(cifrado, 4), 'ELTESOROESTAENELPOZO')
  assert.notEqual(escitalaRead(cifrado, 5), 'ELTESOROESTAENELPOZO')
  assert.notEqual(escitalaRead(cifrado, 3), 'ELTESOROESTAENELPOZO')
  assert.deepEqual(escitalaFits(cifrado), [2, 4, 5, 10])
  assert.deepEqual(escitalaGrid(cifrado, 3).map((r) => r.length), [7, 7, 7]) // 20 letras en 3 filas: casillas vacías al final
  assert.equal(escitalaGrid(cifrado, 3)[2][6], '')
  assert.throws(() => escitalaEncode('HOLA', 3))
})

// ---------- Sopa de letras escondidas ----------
test('Sopa: líneas rectas, lectura, apariciones y letras sobrantes', async () => {
  const { sopaLine, sopaRead, sopaOccurrences, sopaLeftover } = await import('../src/diario/sopa.js')
  assert.deepEqual(sopaLine([0, 0], [0, 2]), [[0, 0], [0, 1], [0, 2]])
  assert.deepEqual(sopaLine([2, 2], [0, 0]), [[2, 2], [1, 1], [0, 0]])
  assert.equal(sopaLine([0, 0], [1, 2]), null) // no es recta
  assert.equal(sopaLine([1, 1], [1, 1]), null)
  const rows = ['SOLX', 'AYZA', 'LXOY', 'AAAR']
  assert.equal(sopaRead(rows, sopaLine([0, 0], [0, 2])), 'SOL')
  assert.equal(sopaOccurrences(rows, 'SOL').length, 1)
  assert.equal(sopaOccurrences(rows, 'LOS').length, 1) // al revés cuenta como otra aparición (no es la misma palabra)
  assert.equal(sopaOccurrences(rows, 'ALA').length, 2) // una palabra capicúa cuenta dos veces: por eso el generador no las admite
  assert.equal(sopaLeftover(['ABC', 'DEF', 'GHI'], [[0, 0], [1, 1], [2, 2]]), 'BCDFGH')
})

test('Sopa: todas las sopas de la lista se resuelven, cada palabra sale una vez y sobra la respuesta (necesita los archivos fuente)', async (t) => {
  const SO = await import('../src/diario/sopas.src.mjs').then((m) => m.default).catch(() => null)
  if (!SO) return t.skip('no está sopas.src.mjs')
  const { sopaOccurrences, sopaLeftover } = await import('../src/diario/sopa.js')
  const sopas = PUZZLES.filter((p) => p.type === 'sopa')
  assert.equal(sopas.length, SO.length)
  const reales = SO.map((s) => PUZZLES.find((p) => p.title === s.title))
  reales.forEach((p, i) => {
    const words = SO[i].words.map((w) => normalize(typeof w === 'string' ? w : w.w))
    const cells = []
    const dirs = new Set()
    for (const w of words) {
      const occ = sopaOccurrences(p.data.grid, w)
      assert.equal(occ.length, 1, SO[i].title + ': ' + w)
      cells.push(...occ[0].cells); dirs.add(occ[0].dir)
    }
    assert.equal(sopaLeftover(p.data.grid, cells), normalize(SO[i].text), SO[i].title)
    const adelante = [...dirs].filter((d) => d < 4).length, atras = [...dirs].filter((d) => d >= 4).length
    assert.ok(adelante >= 3, SO[i].title + ': mezcla de direcciones')
    if (SO[i].level === 1) assert.equal(atras, 0, 'nivel 1 sin palabras al revés')
    else assert.ok(atras >= 1, SO[i].title + ': nivel 2-3 con palabras al revés')
  })
})

// ---------- Tipos nuevos (18/10/2026): números, binario, sin vocales, coartada ----------
test('Números a letras: A=1 (o A=26 al revés), ida y vuelta y palabras separadas por barra', async () => {
  const { numerosEncode, numerosDecode, numberOf, letterOf } = await import('../src/diario/codigos.js')
  assert.equal(numerosEncode('HOLA MUNDO'), '8 15 12 1 / 13 21 14 4 15')
  assert.equal(numerosDecode('8 15 12 1 / 13 21 14 4 15'), 'HOLA MUNDO')
  assert.equal(numberOf('A'), 1); assert.equal(numberOf('Z'), 26)
  assert.equal(numberOf('A', 'inverso'), 26); assert.equal(numberOf('Z', 'inverso'), 1)
  assert.equal(letterOf(26, 'inverso'), 'A')
  const t = 'EL FARAON DUERME'
  for (const m of ['directo', 'inverso']) assert.equal(numerosDecode(numerosEncode(t, m), m), t)
  assert.throws(() => numerosEncode('HOLA', 'raro'))
})

test('Binario a letras: cada letra son 5 cifras (su número en binario) y se deshace', async () => {
  const { binarioEncode, binarioDecode, binaryOf, BINARY_TABLE } = await import('../src/diario/codigos.js')
  assert.equal(binaryOf('A'), '00001'); assert.equal(binaryOf('B'), '00010'); assert.equal(binaryOf('Z'), '11010')
  assert.equal(binarioEncode('SOL AL'), '10011 01111 01100 / 00001 01100')
  assert.equal(binarioDecode('10011 01111 01100 / 00001 01100'), 'SOL AL')
  assert.equal(BINARY_TABLE.length, 26)
  assert.equal(new Set(BINARY_TABLE.map(([, b]) => b)).size, 26, 'ninguna se repite')
})

test('Texto sin vocales: quita las vocales, anota el largo y rechaza palabras que solo tengan vocales', async () => {
  const { sinVocales } = await import('../src/diario/codigos.js')
  assert.deepEqual(sinVocales('el ladron huyo'), [{ c: 'L', len: 2 }, { c: 'LDRN', len: 6 }, { c: 'HY', len: 4 }])
  assert.deepEqual(sinVocales('La Pared'), [{ c: 'L', len: 2 }, { c: 'PRD', len: 5 }])
  assert.throws(() => sinVocales('voy a casa')) // "a" no deja ninguna consonante
})

test('Coartada: las pistas dejan una sola solución, siempre las mismas, y no hay pistas falsas', async () => {
  const { coartadaClues, coartadaSolve, holds, clueText, validateCoartada } = await import('../src/diario/coartada.js')
  const people = ['Marta', 'Luis', 'Ana', 'Pablo'], places = ['la cocina', 'el salón', 'la biblioteca', 'el despacho']
  const sol = [2, 0, 3, 1]
  for (const ordered of [false, true]) {
    for (let seed = 1; seed <= 30; seed++) {
      const clues = coartadaClues(4, sol, ordered, seed)
      assert.ok(clues.length >= 4 && clues.length <= 7)
      assert.ok(clues.every((c) => holds(c, sol)), 'todas las pistas son verdad para la solución')
      assert.deepEqual(coartadaSolve(4, clues), [sol], 'solo una forma de colocarlos')
      assert.ok(clues.filter((c) => c.t === 'es').length <= 1)
      if (!ordered) assert.ok(clues.every((c) => !['antes', 'junto'].includes(c.t)))
      assert.deepEqual(clues, coartadaClues(4, sol, ordered, seed), 'mismas pistas para el mismo acertijo')
    }
  }
  assert.equal(clueText({ t: 'no', p: 0, pl: 1 }, people, places), 'Marta no estaba en el salón.')
  assert.equal(clueText({ t: 'o', p: 2, a: 0, b: 3 }, people, places), 'Ana estaba en la cocina o en el despacho.')
  assert.equal(clueText({ t: 'antes', p: 1, q: 3 }, people, places), 'Luis estaba más cerca de la entrada que Pablo.')
  assert.equal(coartadaSolve(3, []).length, 6) // sin pistas: 3! formas
  assert.deepEqual(validateCoartada({ people, places, solution: sol, ask: 3, text: 'Ana' }), [])
  assert.match(validateCoartada({ people, places, solution: sol, ask: 3, text: 'Luis' }).join('|'), /el culpable según la solución es Ana/)
  assert.match(validateCoartada({ people, places, solution: [0, 0, 1, 2], ask: 0, text: 'Marta' }).join('|'), /sitio distinto/)
  assert.match(validateCoartada({ people: ['A', 'B'], places: ['x', 'y'], solution: [0, 1], ask: 0, text: 'A' }).join('|'), /3 a 5/)
})

// ---------- Reto de tu nivel ----------
import { levelForPoints, retoPoints, totalPoints } from '../src/diario/points.js'
import { retoFor, retoPuzzle } from '../src/diario/reto.js'
test('Reto: el nivel sale del rango (Aprendiz 1 ... Comisario y Maestro 5)', () => {
  assert.deepEqual([0, 199, 200, 600, 1500, 3500, 9999].map(levelForPoints), [1, 1, 2, 3, 4, 5, 5])
})
test('Reto: puntos completos por nivel, bonus a la primera y sin pista, extra del 50 % y sin racha', () => {
  assert.equal(retoPoints({ level: 4, tries: 0, hint: false }).total, Math.round(Math.round(40 * 1.75) * 1.5)) // 105
  assert.equal(retoPoints({ level: 4, tries: 2, hint: true }).total, 60) // 40 × 1,5
  assert.equal(totalPoints({}, { '2026-10-20': { done: true, level: 2, tries: 0, hint: false }, '2026-10-21': { done: false, level: 5 } }), 53)
})
test('Reto: es del nivel que toca, nunca de un día futuro ni el de hoy, sin repetir lo resuelto y estable', () => {
  const key = '2027-01-04' // día 85 de la lista
  const a = retoFor(PUZZLES, [], key, 1600), b = retoFor(PUZZLES, [], key, 1600)
  assert.deepEqual(a, b)
  assert.equal(a.level, 4)
  assert.equal(PUZZLES[a.i].level, 4)
  assert.ok(a.i < 85, 'solo de días ya pasados')
  const c = retoFor(PUZZLES, [], key, 1600, {}, { '2027-01-03': { done: true, i: a.i } })
  assert.notEqual(c.i, a.i)
  assert.equal(PUZZLES[c.i].level, 4)
})
test('Reto: cada rango recibe su nivel, si agota el suyo baja, y con el banco hay reto desde el primer día', () => {
  for (const [pts, lv] of [[0, 1], [300, 2], [800, 3], [2000, 4], [5000, 5]]) assert.equal(retoFor(PUZZLES, [], '2027-03-01', pts).level, lv)
  const todos = {}
  PUZZLES.forEach((p, i) => { if (p.level === 5) todos['2026-12-' + String(i).padStart(3, '0')] = { done: true, i } })
  assert.equal(retoFor(PUZZLES, [], '2027-03-01', 5000, {}, todos).level, 4)
  assert.equal(retoFor(PUZZLES, [], '2026-10-12', 0), null) // primer día y sin banco: nada que ofrecer
  const banco = [{ level: 1, title: 'x' }, { level: 3, title: 'y' }]
  assert.deepEqual(retoFor(PUZZLES, banco, '2026-10-12', 0), { i: 1000, level: 1 })
  assert.equal(retoPuzzle(PUZZLES, banco, 1001).title, 'y')
  assert.equal(retoPuzzle(PUZZLES, banco, 5), PUZZLES[5])
})

// ---------- Banco de retos (acertijos fuera del calendario) ----------
import BANCO from '../src/diario/banco.js'
const BSRC = await import('../scripts/load-sources.mjs').then((m) => m.loadBanco()).catch(() => null)
test('Banco: no se mezcla con el calendario, con niveles de 1 a 5 y títulos sin repetir', () => {
  assert.ok(BANCO.length >= 70, 'al menos 70 acertijos')
  assert.ok(BANCO.every((p) => p.id >= 1001 && p.level >= 1 && p.level <= 5), 'ids 1001+ y niveles 1-5')
  const titles = [...PUZZLES, ...BANCO].map((p) => p.title)
  assert.equal(new Set(titles).size, titles.length, 'títulos únicos entre calendario y banco')
  for (let lv = 1; lv <= 5; lv++) assert.ok(BANCO.filter((p) => p.level === lv).length >= 12, `nivel ${lv}: al menos 12`)
})
test('Banco: cada acertijo se resuelve con su solución y respeta las reglas de su tipo (necesita el archivo fuente)', { skip: !BSRC && 'sin los archivos .src.mjs' }, () => {
  assert.equal(BANCO.length, BSRC.length)
  BANCO.forEach((p, j) => {
    const s = BSRC[j], at = `banco ${j + 1} (${s.title})`
    assert.ok(isCorrect(p, s.text), `${at}: la huella no coincide con la solución`)
    assert.equal(p.level, s.level)
    if (!['intruso', 'coartada'].includes(s.type)) assert.ok(!JSON.stringify(p).includes(s.text), `${at}: la solución está en claro`)
    if (s.type === 'cesar') assert.ok(isCorrect(p, caesarDecode(p.data, s.shift)))
    if (s.type === 'morse') assert.ok(isCorrect(p, morseDecode(p.data)))
    if (s.type === 'teclado') assert.ok(isCorrect(p, keypadDecode(p.data)))
    if (s.type === 'espejo') assert.ok(isCorrect(p, atbash(p.data)))
    if (s.type === 'simbolos') assert.ok(isCorrect(p, pigpenLetters(p.data)))
    if (s.type === 'golpes') { assert.ok(isCorrect(p, golpesDecode(p.data))); assert.ok(s.level <= 2, `${at}: golpes solo en niveles 1-2`) }
    if (s.type === 'binario') { assert.ok(isCorrect(p, binarioDecode(p.data))); assert.ok(s.level >= 3, `${at}: binario desde el nivel 3`) }
    if (s.type === 'numeros') {
      assert.ok(isCorrect(p, numerosDecode(p.data.code, p.data.mode)))
      assert.ok(s.level <= 2, `${at}: números solo en niveles 1-2`)
      if (p.data.mode === 'inverso') assert.ok(s.level >= 2)
    }
    if (s.type === 'rebus') { assert.ok(s.level <= 2, `${at}: rebus solo en niveles 1-2`); assert.equal(p.data.lens.reduce((a, b) => a + b, 0), normalize(s.text).length) }
    if (s.type === 'escitala') { assert.equal(s.level, 3); assert.equal(escitalaRead(p.data.cipher, s.rows), normalize(s.text)) }
    if (s.type === 'acrostico') assert.ok(isCorrect(p, p.data.map((l) => normalize(l)[0]).join('')))
    if (s.type === 'cerradura') { const c = lockCandidates(p.data); assert.equal(c.length, 1); assert.ok(isCorrect(p, c[0])) }
    if (s.type === 'anagrama') assert.equal([...p.data.pool].sort().join(''), [...normalize(s.text)].sort().join(''))
    if (s.type === 'sinvocales') assert.ok(p.data.every((w) => !/[AEIOU]/.test(w.c) && w.c.length > 0))
    if (s.type === 'intruso') {
      assert.ok(p.data.some((x) => normalize(x.n) === normalize(s.text)), `${at}: el intruso está entre las opciones`)
      assert.ok(p.data.every((x) => Object.keys(x).every((k) => ['e', 'n'].includes(k))), 'no viaja cuál es el intruso ni por qué')
    }
    if (s.type === 'coartada') {
      assert.deepEqual(validateCoartada(s), [])
      assert.ok(s.level >= 4, `${at}: coartada desde el nivel 4`)
      assert.equal(s.people.length, s.level === 4 ? 3 : 4, `${at}: 3 sospechosos en el nivel 4 y 4 en el 5`)
      const clues = coartadaClues(s.people.length, s.solution, !!s.ordered, SRC.length + j + 1)
      assert.equal(coartadaSolve(s.people.length, clues).length, 1)
      assert.ok(!('solution' in p.data), 'la solución no viaja')
    }
    assert.ok(!['vigenere', 'criptico', 'sopa', 'interrogatorio'].includes(s.type), `${at}: tipo no usado en el banco`)
  })
})
