import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRows, filterRows, median, perDay, stuckBySteps, summaryByGame, weeklyMedian } from '../src/lib/stats.js'
import { runsCsv, scansCsv } from '../src/lib/csv.js'

const MIN = 60000
const T0 = new Date(2026, 9, 5, 10, 0, 0) // lunes 5/10/2026 10:00
const at = (min, base = T0) => new Date(base.getTime() + min * MIN)
const NOW = at(300) // 15:00

const games = { g: { name: 'Caso', timeLimitMinutes: 240 } }
const stepsByGame = {
  g: [
    { id: 'v0', label: 'V0', type: 'start' },
    { id: 'p1', label: 'Pista 1', type: 'clue' },
    { id: 'sol', label: 'Solución', type: 'solution' },
  ],
}
const scan = (stepId, min, base = T0) => ({ stepId, at: at(min, base) })

// A: terminada en 50 min · B: terminada en 90 min · C: tiempo agotado · D: en curso
const runs = [
  { id: 'A', gameId: 'g', alias: 'Rojo', startedAt: T0, endedAt: at(50) },
  { id: 'B', gameId: 'g', alias: '=HYPERLINK("x")', startedAt: T0, endedAt: at(90) },
  { id: 'C', gameId: 'g', alias: 'A;B', startedAt: T0, endedAt: null },
  { id: 'D', gameId: 'g', alias: '', startedAt: at(270), endedAt: null },
]
const scansByRun = {
  A: [scan('v0', 0), scan('p1', 10), scan('sol', 50)],
  B: [scan('v0', 0), scan('p1', 30), scan('sol', 90)],
  C: [scan('v0', 0), scan('p1', 10)],
  D: [scan('v0', 270), scan('p1', 275)],
}
const rows = buildRows({ runs, scansByRun, stepsByGame, games, now: NOW })
const byId = Object.fromEntries(rows.map((r) => [r.id, r]))

test('estado y tiempo de cada partida', () => {
  assert.equal(byId.A.status, 'finished')
  assert.equal(byId.A.ms, 50 * MIN)
  assert.equal(byId.C.status, 'timeout')
  assert.equal(byId.C.ms, 240 * MIN) // el límite, no "hasta ahora"
  assert.equal(byId.D.status, 'open')
  assert.equal(byId.D.ms, null)
  assert.equal(byId.A.clueCount, 1)
})

test('mediana', () => {
  assert.equal(median([]), null)
  assert.equal(median([5]), 5)
  assert.equal(median([50, 90]), 70)
  assert.equal(median([1, 100, 3]), 3)
})

test('resumen por caso', () => {
  const [s] = summaryByGame(rows)
  assert.equal(s.started, 4)
  assert.equal(s.finished, 2)
  assert.equal(s.timeout, 1)
  assert.equal(s.open, 1)
  assert.equal(s.completionPct, 67) // 2 de 3 cerradas; la que sigue en curso no cuenta
  assert.equal(s.medianMs, 70 * MIN)
  assert.equal(s.meanMs, 70 * MIN)
  assert.equal(s.bestMs, 50 * MIN)
  assert.equal(s.avgClues, 1)
})

test('resumen sin partidas cerradas: sin porcentaje ni tiempos', () => {
  const [s] = summaryByGame(rows.filter((r) => r.status === 'open'))
  assert.equal(s.completionPct, null)
  assert.equal(s.medianMs, null)
  assert.equal(s.bestMs, null)
})

test('atascos por paso', () => {
  const steps = Object.fromEntries(stuckBySteps(rows).map((s) => [s.stepId, s]))
  // Pista 1: A espera 40, B espera 60, C (tiempo agotado) espera 230. D (en curso) no cuenta su hueco final.
  assert.equal(steps.p1.reached, 4)
  assert.equal(steps.p1.stuck, 3)
  assert.equal(steps.p1.abandoned, 1)
  assert.equal(steps.p1.avgWaitMs, 110 * MIN)
  // V0: solo B tarda más de 20 min (30) en escanear otra cosa
  assert.equal(steps.v0.stuck, 1)
  assert.equal(steps.v0.avgWaitMs, 30 * MIN)
  // La solución cierra la partida: no hay espera tras ella
  assert.equal(steps.sol.stuck, 0)
  // Ordenado de más a menos atascos
  assert.equal(stuckBySteps(rows)[0].stepId, 'p1')
})

test('exactamente 20 min no cuenta como atasco', () => {
  const r = buildRows({
    runs: [runs[0]], stepsByGame, games, now: NOW,
    scansByRun: { A: [scan('v0', 0), scan('p1', 20), scan('sol', 50)] },
  })
  const steps = Object.fromEntries(stuckBySteps(r).map((s) => [s.stepId, s]))
  assert.equal(steps.v0.stuck, 0)
  assert.equal(steps.p1.stuck, 1) // 30 min
})

test('partidas por día, con días vacíos rellenos', () => {
  const extra = buildRows({
    runs: [{ id: 'E', gameId: 'g', alias: '', startedAt: at(2 * 1440 + 60), endedAt: null }],
    scansByRun: {}, stepsByGame, games, now: at(3 * 1440),
  })
  const days = perDay([...rows, ...extra], at(3 * 1440))
  assert.deepEqual(days.map((d) => d.key), ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'])
  assert.deepEqual([days[0].finished, days[0].other], [2, 2]) // A,B terminadas; C,D no
  assert.deepEqual([days[1].finished, days[1].other], [0, 0])
  assert.deepEqual([days[2].finished, days[2].other], [0, 1])
  assert.deepEqual(perDay([], NOW), [])
})

test('mediana semanal (semana desde el lunes)', () => {
  const nextWeek = at(7 * 1440)
  const r = buildRows({
    runs: [{ id: 'F', gameId: 'g', alias: '', startedAt: nextWeek, endedAt: at(30, nextWeek) }],
    scansByRun: {}, stepsByGame, games, now: at(8 * 1440),
  })
  const w = weeklyMedian([...rows, ...r])
  assert.equal(w.length, 2)
  assert.equal(w[0].key, '2026-10-05')
  assert.equal(w[0].medianMs, 70 * MIN)
  assert.equal(w[1].key, '2026-10-12')
  assert.equal(w[1].medianMs, 30 * MIN)
})

test('filtros por juego y periodo', () => {
  assert.equal(filterRows(rows, { gameId: 'otro' }).length, 0)
  assert.equal(filterRows(rows, { gameId: 'g' }).length, 4)
  assert.equal(filterRows(rows, { fromMs: at(100).getTime() }).length, 1) // solo D
})

test('CSV: separador ;, BOM y alias a prueba de fórmulas', () => {
  const csv = runsCsv(rows)
  assert.ok(csv.startsWith('﻿partida;juego;alias;'))
  const lines = csv.trim().split('\r\n')
  assert.equal(lines.length, 5)
  assert.ok(lines[2].includes(`"'=HYPERLINK(""x"")"`)) // apóstrofe delante y comillas escapadas
  assert.ok(!/;=HYPERLINK/.test(lines[2])) // nunca empieza por =
  assert.ok(lines[3].includes('"A;B"')) // alias con ; entre comillas
  assert.ok(lines[1].includes(';finished;3000;50:00;')) // 50 min = 3000 s
  assert.ok(lines[4].includes(';open;;;')) // en curso: sin tiempo
})

test('CSV de escaneos: una fila por escaneo con segundos desde el inicio', () => {
  const lines = scansCsv(rows).trim().split('\r\n')
  assert.equal(lines.length, 1 + 3 + 3 + 2 + 2)
  const sol = lines.find((l) => l.includes('Rojo') && l.includes('Solución'))
  assert.ok(sol.endsWith(';3000;50:00'))
})
