// Cuenta atrás que ven los jugadores (juegos con `countdown`). Lógica pura, sin pantalla, para poder probarla con `npm test`.
// El tiempo sale siempre de la hora de inicio que guarda el servidor, nunca de un contador propio: así sobrevive a cerrar o bloquear el móvil.
export const ALERT_MINUTES = [30, 10, 1] // avisos de "quedan N minutos"

// Segundos que quedan (negativo = ya pasó el límite). `startMs` = hora de inicio en milisegundos.
export const remainingSec = (startMs, limitMin, now) => Math.ceil((startMs + limitMin * 60000 - now) / 1000)

// mm:ss (h:mm:ss si pasa de una hora). Los negativos se escriben sin signo (el texto dice si es tiempo de más).
export function fmtClock(sec) {
  const s = Math.abs(sec)
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const r = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${r}` : `${m}:${r}`
}

// Avisos que tocan ahora: minutos de ALERT_MINUTES cuyo momento ya ha pasado y que no se han dado todavía.
// Si la pantalla se abre con menos tiempo del que marca un aviso, ese aviso ya no sale (no tiene sentido avisar de los 30 con 25 min).
export const alertsDue = (remaining, given, firstSeen) =>
  ALERT_MINUTES.filter((m) => remaining <= m * 60 && remaining > 0 && firstSeen > m * 60 && !given.includes(m))

// Cielo de la noche al amanecer según cuánto del tiempo ha pasado (0 = recién empezada, 1 = agotado).
const STOPS = [
  [0, [20, 33, 61]], //      azul marino: noche cerrada
  [0.5, [43, 47, 95]], //    azul noche
  [0.75, [122, 92, 153]], // morado: se acerca el amanecer
  [0.9, [242, 104, 91]], //  coral
  [1, [247, 197, 72]], //    amarillo: amanece
]
export function sky(progress) {
  const p = Math.min(1, Math.max(0, progress))
  let i = 1
  while (i < STOPS.length - 1 && p > STOPS[i][0]) i++
  const [p0, c0] = STOPS[i - 1]
  const [p1, c1] = STOPS[i]
  const k = (p - p0) / (p1 - p0)
  const rgb = c0.map((v, n) => Math.round(v + (c1[n] - v) * k))
  // con el cielo claro (coral y amarillo) la letra pasa de blanca a azul marino
  return { bg: `rgb(${rgb.join(',')})`, ink: p >= 0.88 ? '#14213D' : '#FFF1E2' }
}

// Escena del cielo (lienzo de 300×140, horizonte en y=100): la luna baja y se esconde tras el horizonte, las estrellas se apagan
// y al final sale el sol. Devuelve las posiciones según cuánto del tiempo ha pasado (0 a 1).
const clamp01 = (v) => Math.min(1, Math.max(0, v))
export function scene(progress) {
  const p = clamp01(progress)
  const m = clamp01(p / 0.85) // la luna tarda hasta el 85 % del tiempo en esconderse
  const s = clamp01((p - 0.6) / 0.4) // el sol empieza a asomar al 60 % y termina de salir al agotarse
  return {
    moon: { x: Math.round(90 + 110 * m), y: Math.round(28 + 100 * m * m) },
    sun: { x: 110, y: Math.round(135 - 85 * s) },
    stars: Math.round(clamp01(1 - p * 1.5) * 100) / 100,
  }
}
