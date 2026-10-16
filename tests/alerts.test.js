import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_AGE_MS, pickNewRuns } from '../src/lib/newRuns.js'

const NOW = new Date(2026, 9, 20, 18, 0, 0).getTime()
const run = (id, minAgo, type = 'added') => ({ type, id, alias: id, gameId: 'g', startedAt: new Date(NOW - minAgo * 60000) })

test('una partida nueva avisa una sola vez', () => {
  const known = new Set(['a'])
  assert.deepEqual(pickNewRuns(known, [run('b', 0)], NOW).map((r) => r.id), ['b'])
  assert.deepEqual(pickNewRuns(known, [run('b', 0)], NOW), []) // la misma alta repetida no vuelve a avisar
})

test('las partidas ya conocidas no avisan', () => {
  const known = new Set(['a', 'b'])
  assert.deepEqual(pickNewRuns(known, [run('a', 1), run('b', 2)], NOW), [])
})

test('solo cuentan las altas: modificaciones y bajas no avisan', () => {
  const known = new Set()
  assert.deepEqual(pickNewRuns(known, [run('a', 0, 'modified'), run('b', 0, 'removed')], NOW), [])
})

test('una partida antigua que reaparece (caché) no avisa, pero queda registrada como vista', () => {
  const known = new Set()
  const old = run('vieja', MAX_AGE_MS / 60000 + 1)
  assert.deepEqual(pickNewRuns(known, [old], NOW), [])
  assert.ok(known.has('vieja'))
  assert.deepEqual(pickNewRuns(known, [run('vieja', 0)], NOW), [])
})

test('varias partidas nuevas a la vez avisan todas, y sin hora de inicio no avisan', () => {
  const known = new Set()
  const sinHora = { ...run('x', 0), startedAt: null }
  assert.deepEqual(pickNewRuns(known, [run('a', 0), run('b', 3), sinHora], NOW).map((r) => r.id), ['a', 'b'])
})
