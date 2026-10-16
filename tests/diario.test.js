// Pruebas del Diario (lógica pura). Se lanzan con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  atbash, caesarDecode, caesarEncode, dateKey, dayIndex, fmtTime, hashAnswer, isCorrect, keypadDecode, keypadEncode, keypadWords,
  lockCandidates, lockFeedback, morseDecode, morseEncode, nextKey, normalize, pigpenGlyph, pigpenLetters, pigpenStore, puzzleFor,
  shareText, shuffled, streakOf,
} from '../src/diario/ciphers.js'
import PUZZLES from '../src/diario/puzzles.js'
// El archivo con las soluciones en claro NO está en GitHub (el repositorio es público): solo en el PC de Alberto.
const SRC = await import('../src/diario/puzzles.src.mjs').then((m) => m.default).catch(() => null)

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

test('cada acertijo se resuelve con su solución (necesita el archivo fuente)', { skip: !SRC && 'sin puzzles.src.mjs' }, () => {
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
  assert.equal(puzzleFor(PUZZLES, '2026-11-08').id, 28)
  assert.equal(puzzleFor(PUZZLES, '2026-11-09').id, 1)
  assert.equal(puzzleFor(PUZZLES, '2026-10-11').id, 28) // antes del inicio también hay acertijo
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
