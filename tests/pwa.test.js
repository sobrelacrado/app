// Comprobaciones sobre la web ya compilada (dist/). Se lanzan con: npm run test:build
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const dist = (f) => `dist/${f}`
const manifest = () => JSON.parse(readFileSync(dist('manifest.webmanifest'), 'utf8'))
const pngSize = (file) => {
  const b = readFileSync(file)
  assert.equal(b.subarray(1, 4).toString(), 'PNG', `${file} no es un PNG`)
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

test('el manifiesto cumple lo necesario para instalar la app', () => {
  const m = manifest()
  assert.equal(m.display, 'standalone')
  assert.equal(m.start_url, '/')
  assert.ok(m.name && m.short_name && m.short_name.length <= 14)
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/i)
  assert.match(m.background_color, /^#[0-9a-f]{6}$/i)
})

test('los iconos del manifiesto existen y tienen el tamaño declarado (con uno maskable)', () => {
  const m = manifest()
  assert.ok(m.icons.some((i) => i.sizes === '192x192'))
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'))
  for (const icon of m.icons) {
    const file = dist(icon.src.replace(/^\//, ''))
    assert.ok(existsSync(file), `falta ${icon.src}`)
    const [w, h] = pngSize(file)
    assert.equal(`${w}x${h}`, icon.sizes)
  }
})

test('el panel enlaza el manifiesto y la página del jugador NO (para no ofrecer instalarla)', () => {
  assert.match(readFileSync(dist('index.html'), 'utf8'), /rel="manifest"/)
  assert.doesNotMatch(readFileSync(dist('scan.html'), 'utf8'), /rel="manifest"/)
})

test('el service worker excluye la página del jugador y las rutas de acceso', () => {
  const sw = readFileSync(dist('sw.js'), 'utf8')
  const deny = (sw.match(/denylist:\[([^\]]*)\]/) ?? [])[1] ?? ''
  assert.ok(deny.includes('\\/s\\/'), 'no excluye /s/')
  assert.ok(deny.includes('\\/__\\/'), 'no excluye /__/')
  const precached = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1])
  assert.ok(precached.includes('index.html'))
  assert.ok(!precached.some((u) => /scan/.test(u)), 'no debe precargar nada de la página del jugador')
  assert.match(sw, /importScripts\(/)
  assert.ok(existsSync(dist('sw-extra.js')))
})

test('el aviso al tocar una notificación abre el panel', () => {
  const extra = readFileSync(dist('sw-extra.js'), 'utf8')
  assert.match(extra, /notificationclick/)
  assert.match(extra, /openWindow/)
})

test('firebase.json: el service worker y el manifiesto no se guardan en caché', () => {
  const rules = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting.headers
  const rule = rules.find((r) => r.source.includes('sw.js'))
  assert.ok(rule && rule.source.includes('manifest.webmanifest'))
  assert.equal(rule.headers[0].value, 'no-cache')
})
