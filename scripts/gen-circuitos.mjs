// Fabrica los acertijos de Circuito y los guarda en src/diario/banco-05.src.mjs (NO se sube a GitHub: lleva las soluciones).
// Uso: node scripts/gen-circuitos.mjs        (siempre da los mismos tableros: las semillas son fijas)
// Tamaño según el nivel: 1 = 3×3, 2 = 4×4, 3 = 5×5, 4 = 6×6, 5 = 7×7. Bucles (cables de más): ninguno en los niveles 1-2, luego 1, 2 y 3.
import { writeFileSync } from 'node:fs'
import { aTexto, generar, resuelto, soluciones } from '../src/diario/circuito.js'

const POR_NIVEL = 8
const TAM = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 }
const BUCLES = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 3 }
const TEMAS = ['detective', 'policial', 'alien', 'egipcio']
const TITULOS = {
  detective: ['Luces del despacho', 'El cuadro de fusibles', 'Cables bajo la alfombra', 'La lámpara del archivo', 'Corte en la pensión', 'El timbre de la oficina', 'La caja de la luz', 'Apagón en el piso', 'Hilos tras el espejo', 'La centralita vieja', 'El farol del callejón', 'Interruptor en la sombra', 'Fusible quemado', 'El letrero del bar', 'La bombilla del sótano', 'Línea del teléfono'],
  policial: ['El panel de la comisaría', 'Sirena sin corriente', 'La celda a oscuras', 'Alarma del banco', 'El foco del calabozo', 'Cuadro del juzgado', 'Radio de la patrulla', 'El semáforo averiado', 'Luz de la sala de interrogatorios', 'Sistema de la cámara acorazada', 'La verja eléctrica', 'Línea de la ambulancia', 'El cableado del retén', 'Foco de la azotea', 'Alumbrado del muelle', 'Caja de seguridad'],
  alien: ['Energía de la nave', 'El reactor dormido', 'Circuito del platillo', 'Luces de la bahía', 'El núcleo de la base', 'La antena sin carga', 'Paneles del hangar', 'Compuerta sin energía', 'El radar apagado', 'Sala de máquinas', 'Cable del transmisor', 'El generador lunar', 'Cápsula de emergencia', 'Red de la estación', 'Baliza sin pulso', 'El motor silencioso'],
  egipcio: ['El mecanismo del templo', 'Luces de la cámara sellada', 'Espejos del faraón', 'La puerta de la pirámide', 'El pasadizo oscuro', 'Antorchas de la tumba', 'Sala de los espejos', 'El cerrojo del sarcófago', 'Corriente en el obelisco', 'La trampa del corredor', 'Mecanismo del sol', 'El altar encendido', 'Cámara del tesoro', 'La losa que gira', 'Ojo de la esfinge', 'El canal de luz'],
}
const CLUES = {
  detective: 'Se ha ido la luz en el despacho del detective. Hay una batería y un montón de cables mal colocados: gíralos hasta que la corriente llegue a todas partes.',
  policial: 'El sistema eléctrico de la comisaría está desconectado. Gira las piezas para que la corriente salga de la batería y llegue a todas.',
  alien: 'La nave perdió toda su energía. Gira los tubos del circuito hasta que la corriente vuelva a recorrerlos todos.',
  egipcio: 'Un antiguo mecanismo guarda el secreto de la sala. Gira las piezas hasta que la corriente recorra el circuito entero.',
}
const HINT = 'Ningún cable puede quedar suelto. Empieza por las piezas de los bordes: no pueden apuntar hacia fuera.'

const out = []
let semilla = 100
const usados = { }
for (let level = 1; level <= 5; level++) {
  for (let k = 0; k < POR_NIVEL; k++) {
    const tema = TEMAS[k % 4]
    usados[tema] = (usados[tema] ?? -1) + 1
    const title = TITULOS[tema][usados[tema]]
    const n = TAM[level]
    const g = generar(n, n, BUCLES[level], semilla++)
    const text = aTexto(g.solucion)
    const cells = aTexto(g.revuelto)
    if (!resuelto(g.solucion, n, n, g.fuente)) throw new Error(`${title}: la solución no cierra el circuito`)
    const sol = soluciones(g.revuelto, n, n, g.fuente, 2)
    if (sol.length !== 1 || aTexto(sol[0]) !== text) throw new Error(`${title}: no hay una única solución`)
    if (cells === text) throw new Error(`${title}: el tablero ya viene resuelto`)
    out.push({ type: 'circuito', theme: tema, level, title, clue: CLUES[tema], hint: HINT, text, w: n, h: n, src: g.fuente, cells })
  }
}
const titulos = out.map((p) => p.title)
if (new Set(titulos).size !== titulos.length) throw new Error('Títulos repetidos: ' + titulos.filter((t, i) => titulos.indexOf(t) !== i).join(', '))
writeFileSync(new URL('../src/diario/banco-05.src.mjs', import.meta.url),
  '// BANCO DE RETOS · Circuito (lo escribe scripts/gen-circuitos.mjs). Soluciones en claro: este archivo NO se sube a GitHub.\n' +
  'export default ' + JSON.stringify(out, null, 1).replace(/\n\s+/g, ' ').replace(/\[ \{/, '[\n {').replace(/\}, \{/g, '},\n {').replace(/\} \]/, '}\n]') + '\n')
console.log(`${out.length} circuitos escritos`)
