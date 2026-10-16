import { test } from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { ALPHABET, newGameId, newStepId } from '../src/lib/ids.js'
import { CASE2, EXPEDIENTE_TEMPLATE, scanUrl, validateGame } from '../src/lib/games.js'
import { qrMatrix, qrSvgString } from '../src/lib/qr.js'

test('identificadores: longitud, alfabeto sin letras ambiguas y sin repetidos', () => {
  assert.ok(!/[ilo01]/.test(ALPHABET))
  const games = new Set()
  const steps = new Set()
  for (let i = 0; i < 5000; i++) {
    const g = newGameId()
    const s = newStepId()
    assert.match(g, /^[a-hj-km-np-z2-9]{6}$/)
    assert.match(s, /^[a-hj-km-np-z2-9]{8}$/)
    games.add(g)
    steps.add(s)
  }
  assert.equal(steps.size, 5000) // 8 caracteres: ni una colisión en 5000
  assert.ok(games.size > 4990)
})

test('el azar no favorece ningún carácter (sin sesgo evidente)', () => {
  const counts = Object.fromEntries([...ALPHABET].map((c) => [c, 0]))
  for (let i = 0; i < 20000; i++) for (const c of newStepId()) counts[c]++
  const expected = (20000 * 8) / ALPHABET.length
  for (const n of Object.values(counts)) assert.ok(Math.abs(n - expected) / expected < 0.08)
})

const step = (over = {}) => ({ label: 'V0', type: 'start', url: 'https://youtube.com/shorts/x', active: true, ...over })
const good = () => ({
  name: 'Caso', timeLimitMinutes: 240,
  steps: [step(), step({ label: 'P1', type: 'clue' }), step({ label: 'Sol', type: 'solution' })],
})
const codes = (g) => validateGame(g).map((e) => e.code)

test('un juego correcto no da errores; el caso 2 precargado tampoco', () => {
  assert.deepEqual(validateGame(good()), [])
  const steps = CASE2.steps.map((s) => ({ ...s, active: true }))
  assert.deepEqual(validateGame({ name: CASE2.name, timeLimitMinutes: CASE2.timeLimitMinutes, steps }), [])
  assert.equal(CASE2.steps.length, 9)
})

test('validación: nombre, límite, pasos', () => {
  assert.deepEqual(codes({ ...good(), name: '  ' }), ['nameRequired'])
  for (const bad of [0, 4, 1441, 2.5, 'abc', '']) assert.ok(codes({ ...good(), timeLimitMinutes: bad }).includes('limitInvalid'), String(bad))
  assert.ok(codes({ ...good(), timeLimitMinutes: '90' }).length === 0)
  assert.ok(codes({ ...good(), steps: [] }).includes('noSteps'))
})

test('validación: destinos https, nombres únicos, un inicio y una solución', () => {
  const g = good()
  g.steps[1].url = 'http://inseguro.com'
  assert.deepEqual(validateGame(g), [{ code: 'urlInvalid', step: 2 }])
  g.steps[1].url = 'javascript:alert(1)'
  assert.deepEqual(validateGame(g), [{ code: 'urlInvalid', step: 2 }])
  g.steps[1].url = ''
  g.steps[1].active = false // inactivo: puede estar vacío
  assert.deepEqual(validateGame(g), [])

  const dup = good()
  dup.steps[1].label = ' v0 '
  assert.deepEqual(validateGame(dup), [{ code: 'labelDuplicate', step: 2 }])
  const empty = good()
  empty.steps[1].label = ''
  assert.deepEqual(validateGame(empty), [{ code: 'labelRequired', step: 2 }])

  const twoStarts = good()
  twoStarts.steps[1].type = 'start'
  assert.ok(codes(twoStarts).includes('needStart'))
  const noStart = good()
  noStart.steps[0].type = 'normal'
  assert.ok(codes(noStart).includes('needStart'))
  const noSolution = good()
  noSolution.steps[2].type = 'normal'
  assert.ok(codes(noSolution).includes('needSolution'))
  const inactiveSolution = good()
  inactiveSolution.steps[2].active = false
  assert.ok(codes(inactiveSolution).includes('needSolution'))
})

test('la plantilla de expediente tiene un inicio, una solución y pide los destinos', () => {
  const steps = EXPEDIENTE_TEMPLATE.map((s) => ({ ...s, active: true }))
  const c = validateGame({ name: 'x', timeLimitMinutes: 240, steps }).map((e) => e.code)
  assert.ok(c.every((x) => x === 'urlInvalid')) // solo faltan los enlaces
  assert.equal(EXPEDIENTE_TEMPLATE.filter((s) => s.type === 'start').length, 1)
})

// Decodifica la matriz del QR con un lector independiente y comprueba que devuelve la URL exacta.
function decode(text, scale = 6) {
  const { size, data } = qrMatrix(text)
  const quiet = 4
  const px = (size + 2 * quiet) * scale
  const img = new Uint8ClampedArray(px * px * 4).fill(255)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!data[r * size + c]) continue
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = (((r + quiet) * scale + y) * px + (c + quiet) * scale + x) * 4
          img[i] = img[i + 1] = img[i + 2] = 0
        }
      }
    }
  }
  return jsQR(img, px, px)?.data
}

test('el QR decodifica exactamente la URL del paso', () => {
  for (let i = 0; i < 40; i++) {
    const url = scanUrl(newGameId(), newStepId())
    assert.equal(decode(url), url)
  }
  assert.equal(scanUrl('abc234', 'xy9k2m4p'), 'https://app-sobre-lacrado.web.app/s/abc234/xy9k2m4p')
})

test('el QR de una URL de paso es pequeño (versión baja = módulos grandes al imprimir)', () => {
  const { size } = qrMatrix(scanUrl(newGameId(), newStepId()))
  assert.ok(size <= 33, `tamaño ${size}`) // versión 4 como máximo
})

test('SVG del QR: bien formado, con fondo blanco y margen', () => {
  const svg = qrSvgString(scanUrl('abc234', 'xy9k2m4p'))
  assert.match(svg, /^<svg [^>]*viewBox="0 0 \d+ \d+"/)
  assert.ok(svg.includes('fill="#fff"') && svg.includes('fill="#000"'))
  assert.ok(!/NaN|undefined/.test(svg))
})
