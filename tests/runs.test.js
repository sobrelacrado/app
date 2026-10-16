import { test } from 'node:test'
import assert from 'node:assert/strict'
import { timeLeft } from '../src/lib/runs.js'

const T0 = new Date(2026, 9, 20, 18, 0, 0)
const game = { timeLimitMinutes: 100 }
const at = (min) => T0.getTime() + min * 60000
const open = { startedAt: T0, endedAt: null }

test('anillo de tiempo: al empezar está lleno y en verde', () => {
  assert.deepEqual(timeLeft(open, game, at(0)), { fraction: 1, tone: 'ok' })
})

test('anillo de tiempo: pasa a ámbar por debajo de la mitad y a rojo por debajo del 20 %', () => {
  assert.equal(timeLeft(open, game, at(40)).tone, 'ok')
  assert.equal(timeLeft(open, game, at(60)).tone, 'warn')
  assert.equal(timeLeft(open, game, at(85)).tone, 'crit')
  assert.equal(timeLeft(open, game, at(75)).fraction, 0.25)
})

test('anillo de tiempo: agotada se ve vacía y gris; terminada, completa y verde', () => {
  assert.deepEqual(timeLeft(open, game, at(100)), { fraction: 0, tone: 'off' })
  const done = { startedAt: T0, endedAt: new Date(at(30)) }
  assert.deepEqual(timeLeft(done, game, at(500)), { fraction: 1, tone: 'ok' })
})

test('anillo de tiempo: sin datos del juego usa el límite por defecto (240 min)', () => {
  assert.equal(timeLeft(open, undefined, at(120)).fraction, 0.5)
})
