import QRCode from 'qrcode'

const QUIET = 4 // margen blanco obligatorio alrededor del QR (en módulos)

// Matriz del QR con corrección de errores M (la misma que usan tus plantillas).
export function qrMatrix(text) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  return { size: modules.size, data: modules.data }
}

// Camino SVG con los módulos negros (vectorial: se ve nítido a cualquier tamaño).
export function qrPath(text) {
  const { size, data } = qrMatrix(text)
  let d = ''
  for (let r = 0; r < size; r++) {
    let c = 0
    while (c < size) {
      if (data[r * size + c]) {
        const start = c
        while (c < size && data[r * size + c]) c++
        d += `M${start + QUIET} ${r + QUIET}h${c - start}v1h-${c - start}z`
      } else c++
    }
  }
  return { d, box: size + 2 * QUIET }
}

// SVG completo (fondo blanco incluido) para descargar o imprimir aparte.
export function qrSvgString(text) {
  const { d, box } = qrPath(text)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" shape-rendering="crispEdges">` +
    `<rect width="${box}" height="${box}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
}
