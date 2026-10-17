// Lógica pura del Diario: cifrados, comparación de respuestas, fechas, racha y texto para compartir.
// No toca la pantalla ni el navegador (así se puede probar con `npm test`).

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Deja solo letras y números sin acentos ni mayúsculas: "¡Está en el reloj!" -> "ESTAENELRELOJ"
export const normalize = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// Huella de una respuesta (no es seguridad: solo evita que la solución se lea a simple vista en el código).
export function hashAnswer(s, salt = 'sl-diario') {
  const str = salt + normalize(s)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
export const isCorrect = (puzzle, answer) => hashAnswer(answer) === puzzle.h

// ---------- César ----------
// shift = puestos que se movió cada letra al cifrar (A->D es 3). Solo A-Z; lo demás se deja igual.
const rot = (text, n) =>
  String(text).toUpperCase().replace(/[A-Z]/g, (c) => ALPHA[(((c.charCodeAt(0) - 65 + n) % 26) + 26) % 26])
export const caesarEncode = (text, shift) => rot(text, shift)
export const caesarDecode = (text, shift) => rot(text, -shift)

// ---------- Morse ----------
export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}
const MORSE_BACK = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
// Letras separadas por un espacio y palabras por " / "
export const morseEncode = (text) =>
  String(text).toUpperCase().split(/\s+/).filter(Boolean)
    .map((w) => [...w].map((c) => MORSE[c]).filter(Boolean).join(' ')).join(' / ')
export const morseDecode = (code) =>
  String(code).split('/').map((w) => w.trim().split(/\s+/).map((g) => MORSE_BACK[g] ?? '?').join('')).join(' ')

// ---------- Teclado de móvil antiguo ----------
export const KEYPAD = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ' }
const KEY_OF = Object.fromEntries(Object.entries(KEYPAD).flatMap(([k, ls]) => [...ls].map((l, i) => [l, String(k).repeat(i + 1)])))
// Cada letra es su tecla pulsada tantas veces como su puesto ("C" = 222). Letras con espacio, palabras con " / ".
export const keypadEncode = (text) =>
  String(text).toUpperCase().split(/\s+/).filter(Boolean)
    .map((w) => [...w].map((c) => KEY_OF[c]).filter(Boolean).join(' ')).join(' / ')
// Grupos del mensaje cifrado, para pintar una casilla por letra: [['222','44'], ['7']]
export const keypadWords = (code) => String(code).split('/').map((w) => w.trim().split(/\s+/).filter(Boolean))
export const keypadDecode = (code) =>
  keypadWords(code).map((w) => w.map((g) => (KEYPAD[g[0]] ?? '?')[g.length - 1] ?? '?').join('')).join(' ')

// ---------- Espejo (Atbash): A<->Z, B<->Y... ----------
export const atbash = (text) =>
  String(text).toUpperCase().replace(/[A-Z]/g, (c) => ALPHA[25 - (c.charCodeAt(0) - 65)])

// ---------- Símbolos (alfabeto "pigpen") ----------
// Cada letra es un dibujo: A-I en una rejilla de tres por tres, J-R lo mismo con un punto, S-V en una X, W-Z en una X con punto.
// En el acertijo, los símbolos se guardan como letras movidas (para que la solución no se lea a simple vista).
export const PIGPEN_SHIFT = 13
export const pigpenStore = (text) => rot(text, PIGPEN_SHIFT)
export const pigpenLetters = (stored) => rot(stored, -PIGPEN_SHIFT)
export function pigpenGlyph(letter) {
  const i = ALPHA.indexOf(String(letter).toUpperCase())
  if (i < 0) return null
  if (i < 18) {
    const k = i % 9, r = Math.floor(k / 3), c = k % 3
    const seg = []
    if (c > 0) seg.push('M6 6V26')
    if (c < 2) seg.push('M26 6V26')
    if (r > 0) seg.push('M6 6H26')
    if (r < 2) seg.push('M6 26H26')
    return { d: seg.join(''), dot: i >= 9 }
  }
  const k = (i - 18) % 4
  const d = ['M6 6L16 16L26 6', 'M6 6L16 16L6 26', 'M26 6L16 16L26 26', 'M6 26L16 16L26 26'][k]
  return { d, dot: i >= 22 }
}

// ---------- Cerradura de 3 cifras (tipo Mastermind) ----------
// bien = cifras correctas en su sitio; mal = cifras correctas pero en otro sitio. Los códigos tienen 3 cifras distintas.
export function lockFeedback(code, guess) {
  let bien = 0
  for (let i = 0; i < 3; i++) if (code[i] === guess[i]) bien++
  let common = 0
  for (const d of new Set(guess)) if (code.includes(d)) common++
  return { bien, mal: common - bien }
}
export const LOCK_CODES = (() => {
  const out = []
  for (let n = 0; n < 1000; n++) {
    const s = String(n).padStart(3, '0')
    if (new Set(s).size === 3) out.push(s)
  }
  return out
})()
export const lockCandidates = (clues) =>
  LOCK_CODES.filter((c) => clues.every((q) => { const f = lockFeedback(c, q.g); return f.bien === q.bien && f.mal === q.mal }))

// ---------- Azar con semilla (para que un acertijo siempre salga igual) ----------
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function shuffled(arr, seed) {
  const r = rng(seed), a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- Fechas, racha y compartir ----------
export const DAY_ONE = '2026-10-12' // lunes: el acertijo 1 de la lista sale en esta fecha y la lista se repite
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayNumber = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000) // días enteros, sin líos de horario de verano
}
export const dayIndex = (key, first = DAY_ONE) => dayNumber(key) - dayNumber(first)
export const puzzleFor = (list, key) => list[((dayIndex(key) % list.length) + list.length) % list.length]
export const nextKey = (key, n = 1) => {
  const t = new Date((dayNumber(key) + n) * 86400000)
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

// Días seguidos resueltos hasta hoy, cada uno en su día (los jugados desde el archivo, "late", no cuentan).
// Si hoy aún no se ha resuelto, la racha de ayer sigue viva.
const onTimeDone = (d) => !!d?.done && !d.late
export function streakOf(days, todayKey) {
  let k = onTimeDone(days[todayKey]) ? todayKey : nextKey(todayKey, -1)
  let n = 0
  while (onTimeDone(days[k])) { n++; k = nextKey(k, -1) }
  return n
}

export const levelStars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)
export const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function shareText(puzzle, day, url) {
  const fails = Math.min(day.tries ?? 0, 8)
  const squares = '🟥'.repeat(fails) + '🟩'
  return [
    `SOBRE LACRADO · Diario nº ${day.n} 🔓`,
    `${levelStars(puzzle.level)} · ${squares}${day.hint ? ' 💡' : ''} · ${fmtTime(day.ms)}`,
    url,
  ].join('\n')
}
