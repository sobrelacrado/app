// Circuito: un tablero de w×h piezas de cable. Cada pieza tiene sus salidas (arriba, derecha, abajo, izquierda) y se gira de 90 en 90 grados.
// Hay una batería (una pieza con una sola salida) y el reto se resuelve cuando la corriente llega a TODAS las piezas y no queda ninguna salida suelta.
// Lógica pura (sin pantalla) para poder probarla con `npm test` y generar los tableros al fabricar los acertijos.
// Cada pieza es un número de 4 bits: N=1, E=2, S=4, W=8 (qué lados tienen cable).
export const N = 1, E = 2, S = 4, W = 8

// Gira una pieza `r` cuartos de vuelta en el sentido del reloj.
export const rotar = (m, r = 1) => {
  let x = m
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) x = ((x << 1) & 15) | (x >> 3)
  return x
}

export const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1)
// Forma de la pieza según sus salidas: 'punta' (1), 'recta' (2 opuestas), 'esquina' (2 pegadas), 'te' (3), 'cruz' (4).
export const forma = (m) => {
  const n = bits(m)
  if (n === 1) return 'punta'
  if (n === 3) return 'te'
  if (n === 4) return 'cruz'
  if (n === 2) return m === (N | S) || m === (E | W) ? 'recta' : 'esquina'
  return 'vacia'
}

// Lo que se guarda: un dígito hexadecimal por pieza (las filas una detrás de otra).
export const aTexto = (masks) => masks.map((m) => m.toString(16).toUpperCase()).join('')
export const deTexto = (t) => [...t].map((c) => parseInt(c, 16))

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0] // N, E, S, W
const BIT = [N, E, S, W]
const OPUESTO = [S, W, N, E]

// ¿Hasta dónde llega la corriente? Parte de la batería y pasa de una pieza a la vecina solo si las dos tienen cable en ese lado.
// `abiertos` cuenta las salidas sueltas (cable que no encuentra otro cable, o que sale del tablero).
export function energia(masks, w, h, fuente) {
  const on = new Set([fuente])
  const pila = [fuente]
  while (pila.length) {
    const i = pila.pop()
    const x = i % w, y = (i / w) | 0
    for (let d = 0; d < 4; d++) {
      if (!(masks[i] & BIT[d])) continue
      const nx = x + DX[d], ny = y + DY[d]
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = ny * w + nx
      if ((masks[j] & OPUESTO[d]) && !on.has(j)) { on.add(j); pila.push(j) }
    }
  }
  let abiertos = 0
  for (let i = 0; i < masks.length; i++) {
    const x = i % w, y = (i / w) | 0
    for (let d = 0; d < 4; d++) {
      if (!(masks[i] & BIT[d])) continue
      const nx = x + DX[d], ny = y + DY[d]
      const j = ny * w + nx
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !(masks[j] & OPUESTO[d])) abiertos++
    }
  }
  return { on, abiertos }
}

// Resuelto: la corriente llega a todas las piezas y no queda ninguna salida suelta.
export const resuelto = (masks, w, h, fuente) => {
  const { on, abiertos } = energia(masks, w, h, fuente)
  return on.size === masks.length && abiertos === 0
}

// Cuenta (hasta `limite`) las formas de girar las piezas `base` para dejar el circuito resuelto. Piezas que giradas dan lo mismo cuentan una vez.
export function soluciones(base, w, h, fuente, limite = 2) {
  const n = w * h
  const cur = new Array(n).fill(0)
  const opts = base.map((m) => [...new Set([0, 1, 2, 3].map((r) => rotar(m, r)))])
  const out = []
  const go = (i) => {
    if (out.length >= limite) return
    if (i === n) {
      if (resuelto(cur, w, h, fuente)) out.push([...cur])
      return
    }
    const x = i % w, y = (i / w) | 0
    for (const m of opts[i]) {
      if (x === w - 1 && (m & E)) continue
      if (y === h - 1 && (m & S)) continue
      if (y === 0 && (m & N)) continue
      if (x === 0 && (m & W)) continue
      if (y > 0 && !!(cur[i - w] & S) !== !!(m & N)) continue
      if (x > 0 && !!(cur[i - 1] & E) !== !!(m & W)) continue
      cur[i] = m
      go(i + 1)
      if (out.length >= limite) return
    }
    cur[i] = 0
  }
  go(0)
  return out
}

// Generador de números al azar con semilla (la misma semilla da siempre el mismo tablero).
export function azar(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fabrica un circuito resuelto: un árbol que une TODAS las piezas (así siempre hay solución) y, para los niveles altos, `bucles` cables
// de más que cierran vueltas. La batería es una de las puntas del árbol.
export function construir(w, h, bucles, rand) {
  const n = w * h
  const masks = new Array(n).fill(0)
  const visto = new Array(n).fill(false)
  const pila = [Math.floor(rand() * n)]
  visto[pila[0]] = true
  while (pila.length) { // recorrido en profundidad al azar: da pasillos largos y pocas ramas
    const i = pila[pila.length - 1]
    const x = i % w, y = (i / w) | 0
    const vecinos = []
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d]
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !visto[ny * w + nx]) vecinos.push(d)
    }
    if (!vecinos.length) { pila.pop(); continue }
    const d = vecinos[Math.floor(rand() * vecinos.length)]
    const j = (y + DY[d]) * w + x + DX[d]
    masks[i] |= BIT[d]; masks[j] |= OPUESTO[d]
    visto[j] = true
    pila.push(j)
  }
  for (let k = 0; k < bucles; k++) { // cables de más (cierran vueltas)
    const libres = []
    for (let i = 0; i < n; i++) {
      const x = i % w, y = (i / w) | 0
      for (const d of [1, 2]) { // solo derecha y abajo: cada pareja se mira una vez
        const nx = x + DX[d], ny = y + DY[d]
        if (nx < w && ny < h && !(masks[i] & BIT[d])) libres.push([i, d])
      }
    }
    if (!libres.length) break
    const [i, d] = libres[Math.floor(rand() * libres.length)]
    const j = i + (d === 1 ? 1 : w)
    masks[i] |= BIT[d]; masks[j] |= OPUESTO[d]
  }
  const puntas = masks.map((m, i) => (bits(m) === 1 ? i : -1)).filter((i) => i >= 0)
  return { masks, fuente: puntas[Math.floor(rand() * puntas.length)] }
}

// Fabrica un tablero con UNA sola solución (reintenta con otra semilla hasta lograrlo). Devuelve la solución, el tablero revuelto y la batería.
export function generar(w, h, bucles, semilla) {
  for (let intento = 0; intento < 4000; intento++) {
    const rand = azar(semilla * 7919 + intento)
    const { masks, fuente } = construir(w, h, bucles, rand)
    // pocas cruces y pocas piezas que no cambian al girar: hacen el tablero demasiado fácil
    if (masks.filter((m) => bits(m) === 4).length > Math.max(1, (w * h) >> 4)) continue
    const sol = soluciones(masks, w, h, fuente, 2)
    if (sol.length !== 1) continue
    let revuelto
    do revuelto = masks.map((m) => rotar(m, Math.floor(rand() * 4))); while (revuelto.every((m, i) => m === masks[i]))
    return { solucion: sol[0], revuelto, fuente, intentos: intento + 1 }
  }
  throw new Error(`Circuito ${w}×${h}: no se encontró un tablero con una sola solución`)
}
