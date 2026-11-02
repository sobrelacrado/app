import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alertsDue, bonusPoints, fmtClock, remainingSec, sky } from '../src/lib/countdown.js'
import { runStatus } from '../src/lib/runs.js'

const T0 = Date.UTC(2026, 10, 2, 20, 0, 0)
const at = (min) => T0 + min * 60000

test('cuenta atrás: queda el límite menos lo transcurrido y pasa a negativo al agotarse', () => {
  assert.equal(remainingSec(T0, 90, at(0)), 5400)
  assert.equal(remainingSec(T0, 90, at(30)), 3600)
  assert.equal(remainingSec(T0, 90, at(90)), 0)
  assert.equal(remainingSec(T0, 90, at(91)), -60)
})

test('cuenta atrás: formato mm:ss y h:mm:ss', () => {
  assert.equal(fmtClock(5400), '1:30:00')
  assert.equal(fmtClock(3599), '59:59')
  assert.equal(fmtClock(65), '01:05')
  assert.equal(fmtClock(-65), '01:05')
})

test('avisos: salen a 30, 10 y 1 minuto, una sola vez, y no los que ya pasaron al abrir la pantalla', () => {
  assert.deepEqual(alertsDue(1800, [], 3000), [30])
  assert.deepEqual(alertsDue(1800, [30], 3000), [])
  assert.deepEqual(alertsDue(600, [30], 1700), [10])
  assert.deepEqual(alertsDue(1500, [], 1500), [], 'abierta con 25 min: no avisa de los 30')
  assert.deepEqual(alertsDue(60, [30, 10], 1700), [1])
  assert.deepEqual(alertsDue(0, [], 100), [], 'a cero ya no hay aviso: sale «Amanece»')
})

test('cielo: noche azul marino al empezar, amarillo al agotarse, y la letra se oscurece con el cielo claro', () => {
  assert.equal(sky(0).bg, 'rgb(20,33,61)')
  assert.equal(sky(1).bg, 'rgb(247,197,72)')
  assert.equal(sky(0).ink, '#FFF1E2')
  assert.equal(sky(1).ink, '#14213D')
  assert.equal(sky(-3).bg, sky(0).bg)
  assert.equal(sky(5).bg, sky(1).bg)
})

test('estado de partida: terminada pasado el límite consta como tardía', () => {
  const game = { timeLimitMinutes: 90 }
  const run = (min) => ({ startedAt: new Date(T0), endedAt: new Date(at(min)) })
  assert.equal(runStatus(run(80), game, at(500)).late, false)
  assert.equal(runStatus(run(95), game, at(500)).late, true)
})

import { scene } from '../src/lib/countdown.js'

test('escena: al empezar la luna está alta y el sol escondido; al final la luna se ha escondido y el sol ha salido', () => {
  const ini = scene(0)
  const fin = scene(1)
  assert.ok(ini.moon.y < 40, 'luna alta')
  assert.ok(ini.sun.y > 100, 'sol bajo el horizonte (horizonte en y=100)')
  assert.equal(ini.stars, 1)
  assert.ok(fin.moon.y > 100, 'luna bajo el horizonte')
  assert.ok(fin.sun.y < 70, 'sol a la vista')
  assert.equal(fin.stars, 0)
  assert.ok(scene(0.5).moon.y > ini.moon.y, 'la luna va bajando')
})

test('bonus de tiempo: 1 punto por cada 3 minutos completos que sobran, máximo 10', () => {
  assert.equal(bonusPoints(0), 0)
  assert.equal(bonusPoints(-50), 0)
  assert.equal(bonusPoints(179), 0)
  assert.equal(bonusPoints(180), 1)
  assert.equal(bonusPoints(3600), 10)
  assert.equal(bonusPoints(1799), 9)
  assert.equal(bonusPoints(540), 3)
  assert.equal(bonusPoints(5400), 10)
})
