// Genera los iconos de la app a partir del sello de la marca (assets-src/sello.png).
// Uso: node scripts/make-icons.mjs
import sharp from 'sharp'

const SRC = 'assets-src/sello.png'
const PAPEL = '#f3eee2'

// Icono normal: el sello con transparencia, recortado al contenido.
async function seal(size, padding = 0) {
  const inner = Math.round(size * (1 - 2 * padding))
  const img = await sharp(SRC).trim().resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  return { img, offset: Math.round((size - inner) / 2) }
}

// Sobre fondo papel (maskable: Android recorta los bordes, por eso el sello ocupa solo el 70 %).
async function onPaper(size, padding) {
  const { img, offset } = await seal(size, padding)
  return sharp({ create: { width: size, height: size, channels: 4, background: PAPEL } })
    .composite([{ input: img, left: offset, top: offset }]).png().toBuffer()
}

const out = async (file, buf) => { await sharp(buf).toFile(file); console.log('creado', file) }

await out('public/icons/icon-192.png', await onPaper(192, 0.1))
await out('public/icons/icon-512.png', await onPaper(512, 0.1))
await out('public/icons/maskable-512.png', await onPaper(512, 0.2))
await out('public/icons/apple-touch-icon.png', await onPaper(180, 0.1))
await out('public/icons/favicon-32.png', (await seal(32)).img)
await out('public/sello-128.png', (await seal(128)).img) // versión ligera para la cabecera y el acceso
