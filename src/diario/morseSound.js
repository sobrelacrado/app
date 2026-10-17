// Sonido y vibración del Morse y de los golpes. Tiempos estándar del Morse: punto = 1 unidad, raya = 3, pausa entre símbolos = 1, entre letras = 3, entre palabras = 7.
// morseSignals es lógica pura (se prueba con `npm test`); playSignals usa el audio y la vibración del navegador.

export const SPEEDS = { lento: 200, normal: 120 } // milisegundos por unidad

// Código Morse del Diario ("... --- ..." / palabras separadas por " / ") -> [{ on, ms }] alternando sonido y silencio (empieza siempre con sonido).
export function morseSignals(code, unit) {
  const out = []
  const push = (on, ms) => { const last = out.at(-1); if (last && last.on === on) last.ms += ms; else out.push({ on, ms }) }
  const words = String(code).split('/').map((w) => w.trim().split(/\s+/).filter(Boolean)).filter((w) => w.length)
  words.forEach((letters, wi) => {
    if (wi) push(false, 7 * unit)
    letters.forEach((letter, li) => {
      if (li) push(false, 3 * unit)
      ;[...letter].forEach((symbol, si) => {
        if (si) push(false, unit)
        push(true, (symbol === '-' ? 3 : 1) * unit)
      })
    })
  })
  return out
}

// Patrón para navigator.vibrate: vibra / pausa / vibra... (justo lo que devuelve morseSignals).
export const vibratePattern = (signals) => signals.map((s) => s.ms)

export const totalMs = (signals) => signals.reduce((n, s) => n + s.ms, 0)

export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

// Reproduce una lista de señales [{ on, ms }]. Devuelve una función para pararlo. onEnd se llama al terminar o al parar.
// El Morse usa un pitido agudo (650 Hz, sinusoidal); los golpes, un "toc" grave (triangular).
export function playSignals(signals, { freq = 650, wave = 'sine', vibrate = false, onEnd = () => {} } = {}) {
  const Ctx = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null
  let ctx = null
  let done = false
  const finish = () => {
    if (done) return
    done = true
    clearTimeout(timer)
    try { ctx?.close() } catch { /* ya cerrado */ }
    if (vibrate && canVibrate()) navigator.vibrate(0)
    onEnd()
  }
  const timer = setTimeout(finish, totalMs(signals) + 400)

  if (Ctx) {
    try {
      ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = wave
      osc.frequency.value = freq
      gain.gain.value = 0
      osc.connect(gain)
      gain.connect(ctx.destination)
      let t = ctx.currentTime + 0.15
      for (const s of signals) {
        const d = s.ms / 1000
        if (s.on) { // subida y bajada suaves para que no suenen "clics"
          gain.gain.setValueAtTime(0, t)
          gain.gain.linearRampToValueAtTime(0.35, t + 0.006)
          gain.gain.setValueAtTime(0.35, t + d - 0.006)
          gain.gain.linearRampToValueAtTime(0, t + d)
        }
        t += d
      }
      osc.start()
      osc.stop(t + 0.1)
    } catch { /* sin audio: queda la vibración y lo visual */ }
  }
  if (vibrate && canVibrate()) navigator.vibrate(vibratePattern(signals))
  return finish
}

// Reproduce un mensaje en Morse.
export function playMorse(code, { unit = SPEEDS.lento, vibrate = false, onEnd = () => {} } = {}) {
  return playSignals(morseSignals(code, unit), { vibrate, onEnd })
}
