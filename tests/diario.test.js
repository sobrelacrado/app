// Pruebas del Diario (lógica pura). Se lanzan con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  atbash, caesarDecode, caesarEncode, dateKey, dayIndex, fmtTime, hashAnswer, isCorrect, keypadDecode, keypadEncode, keypadWords,
  lockCandidates, lockFeedback, morseDecode, morseEncode, nextKey, normalize, pigpenGlyph, pigpenLetters, pigpenStore, puzzleFor,
  shareText, shuffled, streakOf,
} from '../src/diario/ciphers.js'
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
    assert.ok(!JSON.stringify(p).includes(s.text), `acertijo ${i + 1}: la solución está en claro`)
    if (s.type === 'cesar') {
      assert.ok(!/[ÑÁÉÍÓÚ]/.test(s.text), 'César solo admite A-Z')
      assert.ok(isCorrect(p, caesarDecode(p.data, s.shift)))
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

test('críptico: los crípticos de Alberto cuadran (solo en su PC, el archivo no está en GitHub)', async (t) => {
  const CR = await import('../src/diario/criptos.src.mjs').then((m) => m.default).catch(() => null)
  if (!CR) return t.skip('no está criptos.src.mjs')
  const { validateCryptic } = await import('../src/diario/criptico.js')
  const answers = new Set()
  for (const p of CR) {
    assert.deepEqual(validateCryptic(p), [], p.title)
    assert.equal(p.level, 4, p.title) // sábado
    assert.ok(!answers.has(normalize(p.text)), 'respuesta repetida ' + p.text)
    answers.add(normalize(p.text))
  }
  assert.ok(CR.length >= 8)
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
