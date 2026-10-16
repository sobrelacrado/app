import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TEXTS as PANEL } from '../src/i18n.js'
import { TEXTS as PLAYER } from '../src/scan/texts.js'

// Lista las claves de un objeto de textos (incluidos los objetos anidados, como los errores).
const keys = (o, prefix = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )

for (const [name, texts] of [['panel', PANEL], ['página del jugador', PLAYER]]) {
  test(`${name}: español e inglés tienen exactamente los mismos textos`, () => {
    const es = new Set(keys(texts.es))
    const en = new Set(keys(texts.en))
    assert.deepEqual([...es].filter((k) => !en.has(k)), [], 'faltan en inglés')
    assert.deepEqual([...en].filter((k) => !es.has(k)), [], 'faltan en español')
  })

  test(`${name}: ningún texto está vacío y los de tipo función devuelven texto`, () => {
    for (const lang of ['es', 'en']) {
      const walk = (o, path) => {
        for (const [k, v] of Object.entries(o)) {
          if (typeof v === 'function') assert.ok(String(v(3)).length > 0, `${lang}.${path}${k}`)
          else if (typeof v === 'object') walk(v, `${path}${k}.`)
          else assert.ok(v.trim().length > 0, `${lang}.${path}${k} vacío`)
        }
      }
      walk(texts[lang], '')
    }
  })
}

test('los textos de hace X minutos funcionan en los dos idiomas', () => {
  assert.equal(PANEL.es.ago(5), 'hace 5 min')
  assert.equal(PANEL.en.ago(5), '5 min ago')
  assert.match(PANEL.es.ago(0), /menos de 1/)
  assert.match(PANEL.en.ago(0), /less than 1/)
})
