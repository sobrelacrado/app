// Pruebas de Sellos (puzzle de práctica). Se lanzan con: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SIZES, conflicts, countSolutions, generate, hintCell, isSolved, recordWin } from '../src/diario/sellos.js'

test('Sellos: cada tamaño fabrica tableros con una única solución válida', () => {
  for (const n of SIZES) {
    for (let seed = 1; seed <= 25; seed++) {
      const b = generate(n, seed * 101 + n)
      assert.equal(b.regions.length, n * n)
      assert.equal(countSolutions(n, b.regions, 5), 1, `n=${n} semilla=${seed}`)
      const seals = b.solution.map((c, r) => r * n + c)
      assert.ok(isSolved(n, b.regions, seals), 'la solución cumple las reglas')
      assert.equal(new Set(b.regions).size, n, 'hay n regiones')
    }
  }
})

test('Sellos: la misma semilla da el mismo tablero (así se retoma una partida)', () => {
  assert.deepEqual(generate(7, 12345), generate(7, 12345))
  assert.notDeepEqual(generate(7, 12345).regions, generate(7, 54321).regions)
})

test('Sellos: cada región es de una sola pieza', () => {
  for (const n of SIZES) {
    const { regions } = generate(n, 777)
    for (let id = 0; id < n; id++) {
      const cells = regions.map((g, i) => (g === id ? i : -1)).filter((i) => i >= 0)
      const seen = new Set([cells[0]])
      const todo = [cells[0]]
      while (todo.length) {
        const i = todo.pop()
        const r = Math.floor(i / n), c = i % n
        for (const j of [r > 0 && i - n, r < n - 1 && i + n, c > 0 && i - 1, c < n - 1 && i + 1]) if (j !== false && regions[j] === id && !seen.has(j)) { seen.add(j); todo.push(j) }
      }
      assert.equal(seen.size, cells.length, `región ${id} partida en n=${n}`)
    }
  }
})

test('Sellos: los conflictos detectan fila, columna, región y casillas que se tocan', () => {
  const n = 5
  const regions = Array.from({ length: 25 }, (_, i) => Math.floor(i / 5)) // una región por fila
  assert.equal(conflicts(n, regions, [0, 6]).size, 2, 'en diagonal se tocan')
  assert.equal(conflicts(n, regions, [0, 5]).size, 2, 'uno encima de otro se tocan')
  assert.equal(conflicts(n, regions, [0, 2]).size, 2, 'misma fila')
  assert.equal(conflicts(n, regions, [0, 10]).size, 2, 'misma columna')
  assert.equal(conflicts(n, regions, [0, 12]).size, 0, 'lejos y en filas, columnas y regiones distintas')
  const reg2 = regions.map((g) => (g === 3 ? 1 : g))
  assert.equal(conflicts(n, reg2, [6, 23]).size, 0, 'tablero con regiones repetidas: sin choque si no comparten nada')
  assert.equal(conflicts(n, reg2, [5, 16]).size, 2, 'misma región')
})

test('Sellos: no se da por resuelto con sellos de menos o con choques', () => {
  const b = generate(6, 99)
  const seals = b.solution.map((c, r) => r * 6 + c)
  assert.ok(isSolved(6, b.regions, seals))
  assert.ok(!isSolved(6, b.regions, seals.slice(1)), 'falta uno')
  assert.ok(!isSolved(6, b.regions, [...seals.slice(1), seals[1] + 1]), 'uno desplazado choca o no es la solución')
})

test('Sellos: la pista devuelve una casilla de la solución que aún no tiene sello', () => {
  const b = generate(6, 5)
  const sol = b.solution.map((c, r) => r * 6 + c)
  assert.ok(sol.includes(hintCell(b, [])))
  assert.ok(!sol.slice(0, 3).includes(hintCell(b, sol.slice(0, 3))))
  assert.equal(hintCell(b, sol), null)
})

test('Sellos: las estadísticas guardan partidas, mejor tiempo sin pista y racha de días', () => {
  let st = recordWin({}, { n: 6, ms: 90000, hinted: false, day: '2026-10-19' })
  assert.deepEqual(st, { played: 1, best: { 6: 90000 }, last: '2026-10-19', streak: 1 })
  st = recordWin(st, { n: 6, ms: 70000, hinted: true, day: '2026-10-19' })
  assert.equal(st.best[6], 90000, 'con pista no es récord')
  assert.equal(st.streak, 1, 'el mismo día no suma racha')
  st = recordWin(st, { n: 6, ms: 60000, hinted: false, day: '2026-10-20' })
  assert.equal(st.best[6], 60000)
  assert.equal(st.streak, 2)
  st = recordWin(st, { n: 5, ms: 30000, hinted: false, day: '2026-10-25' })
  assert.equal(st.streak, 1, 'saltarse un día reinicia la racha')
  assert.equal(st.played, 4)
})
