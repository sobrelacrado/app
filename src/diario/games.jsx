// Los minijuegos del Diario: cada tipo de código tiene su propia forma de resolverse.
import { useRef, useState } from 'react'
import { KEYPAD, MORSE, atbash, caesarDecode, keypadWords, pigpenGlyph, pigpenLetters } from './ciphers.js'

export const TYPE_NAME = {
  cesar: 'Rueda de César', morse: 'Código Morse', teclado: 'Teclado antiguo', cerradura: 'Cerradura de 3 cifras',
  anagrama: 'Anagrama', acrostico: 'Mensaje escondido', simbolos: 'Alfabeto de símbolos', espejo: 'Alfabeto en espejo',
}
export const HOWTO = {
  cesar: 'Cada letra del mensaje se ha movido varios puestos en el alfabeto. Gira la rueda: la fila de dentro te dice qué letra es cada una. Cuando el texto se lea con sentido, pulsa "Es esta".',
  morse: 'Cada letra son puntos y rayas; las letras van separadas por un espacio y las palabras por una barra "/". Usa la tabla y escribe el mensaje.',
  teclado: 'Es un móvil de los de antes: para escribir una C se pulsaba 3 veces la tecla 2, para una F, 3 veces la 3... Cada grupo es una letra: rellena las casillas.',
  cerradura: 'El código tiene 3 cifras distintas. Cada intento anotado dice cuántas cifras son correctas y están en su sitio (●) y cuántas son correctas pero están en otro sitio (○). Deduce el código y ponlo en la cerradura.',
  anagrama: 'Las letras de la frase están mezcladas. Toca una letra para colocarla en el siguiente hueco; toca un hueco ocupado para quitarla. Los huecos separados son palabras distintas.',
  acrostico: 'Lo importante no es lo que dice el texto, sino cómo está escrito. Descubre el mensaje que esconde y escríbelo.',
  simbolos: 'Cada letra se ha cambiado por un dibujo. Usa la clave de abajo para saber qué letra es cada dibujo y rellena las casillas.',
  espejo: 'Aquí el alfabeto está del revés: la A es la Z, la B es la Y... Cada letra del mensaje es su "reflejo". Usa la tabla y escribe el mensaje.',
}

/* ---------- Piezas comunes ---------- */
function CajaRespuesta({ onCheck, label = 'Tu respuesta' }) {
  const [text, setText] = useState('')
  return (
    <>
      <label className="dr-campo">
        {label}
        <input value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck="false"
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) onCheck(text) }} />
      </label>
      <button type="button" disabled={!text.trim()} onClick={() => onCheck(text)}>Comprobar</button>
    </>
  )
}

// Una casilla por letra, agrupadas en palabras; cada casilla lleva encima una etiqueta (la tecla, el dibujo...).
function Casillas({ words, onCheck }) {
  const total = words.reduce((n, w) => n + w.length, 0)
  const [letters, setLetters] = useState(() => Array(total).fill(''))
  const refs = useRef([])
  const set = (i, v) => setLetters((l) => l.map((x, k) => (k === i ? v : x)))
  const submit = () => {
    let i = 0
    onCheck(words.map((w) => w.map(() => letters[i++]).join('')).join(' '))
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !letters[i] && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'Enter' && letters.every(Boolean)) submit()
  }
  const onChange = (i, e) => {
    const v = [...e.target.value.toUpperCase()].filter((c) => /[A-Z]/.test(c)).pop() ?? ''
    set(i, v)
    if (v && i < total - 1) refs.current[i + 1]?.focus()
  }
  let n = -1
  return (
    <>
      <div className="dr-letras">
        {words.map((w, wi) => (
          <div className="dr-palabra" key={wi}>
            {w.map((tag, gi) => {
              n++
              const i = n
              return (
                <label className="dr-celda" key={gi}>
                  <span>{tag}</span>
                  <input ref={(el) => { refs.current[i] = el }} value={letters[i]} onChange={(e) => onChange(i, e)} onKeyDown={(e) => onKey(i, e)}
                    maxLength={2} autoCapitalize="characters" autoComplete="off" spellCheck="false" aria-label={`Casilla ${i + 1}`} />
                </label>
              )
            })}
          </div>
        ))}
      </div>
      <button type="button" disabled={!letters.every(Boolean)} onClick={submit}>Comprobar</button>
    </>
  )
}

const dots = (s) => s.replaceAll('.', '·').replaceAll('-', '—')
const ALPHA = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

/* ---------- Rueda de César ---------- */
function Rueda({ shift }) {
  const ring = (r, rot) => (
    <g transform={`rotate(${rot})`}>
      {ALPHA.map((l, i) => (
        <text key={l} transform={`rotate(${(i * 360) / 26}) translate(0 ${-r})`} textAnchor="middle" dominantBaseline="middle">{l}</text>
      ))}
    </g>
  )
  return (
    <svg className="dr-rueda" viewBox="-130 -130 260 260" role="img" aria-label={`Rueda: la A de dentro queda bajo la ${ALPHA[shift]} de fuera`}>
      <circle r="124" className="r-fondo" />
      <circle r="92" className="r-medio" />
      <circle r="50" className="r-centro" />
      <g className="r-fuera">{ring(108, 0)}</g>
      <g className="r-dentro">{ring(72, (shift * 360) / 26)}</g>
      <path d="M0 -126 l6 -9 h-12z" className="r-marca" />
    </svg>
  )
}

function Cesar({ puzzle, onCheck }) {
  const [shift, setShift] = useState(0)
  const decoded = caesarDecode(puzzle.data, shift)
  const move = (d) => setShift((s) => (s + d + 26) % 26)
  return (
    <>
      <p className="dr-cifrado" aria-label="Mensaje cifrado">{puzzle.data}</p>
      <Rueda shift={shift} />
      <div className="dr-controles">
        <button type="button" className="suave" onClick={() => move(-1)} aria-label="Girar atrás">◀</button>
        <input type="range" min="0" max="25" value={shift} onChange={(e) => setShift(Number(e.target.value))} aria-label="Posición de la rueda" />
        <button type="button" className="suave" onClick={() => move(1)} aria-label="Girar adelante">▶</button>
      </div>
      <p className="dr-lectura"><small>Así se lee con la rueda en la posición {shift}:</small><b>{decoded}</b></p>
      <button type="button" onClick={() => onCheck(decoded)}>Es esta</button>
    </>
  )
}

/* ---------- Morse ---------- */
function Morse({ puzzle, onCheck }) {
  const [tabla, setTabla] = useState(false)
  const words = puzzle.data.split('/').map((w) => w.trim().split(/\s+/))
  return (
    <>
      <div className="dr-morse" aria-label="Mensaje en Morse">
        {words.map((w, i) => (
          <div className="dr-palabra" key={i}>
            {w.map((g, j) => <span className="dr-grupo" key={j}>{dots(g)}</span>)}
          </div>
        ))}
      </div>
      <button type="button" className="suave" onClick={() => setTabla((v) => !v)} aria-expanded={tabla}>{tabla ? 'Ocultar tabla' : 'Ver tabla Morse'}</button>
      {tabla && (
        <div className="dr-tabla">
          {Object.entries(MORSE).map(([l, c]) => <span key={l}><b>{l}</b> {dots(c)}</span>)}
        </div>
      )}
      <CajaRespuesta onCheck={onCheck} label="Tu traducción" />
    </>
  )
}

/* ---------- Teclado de móvil antiguo ---------- */
function Teclado({ puzzle, onCheck }) {
  const words = keypadWords(puzzle.data).map((w) => w.map((g) => g))
  return (
    <>
      <div className="dr-teclas" aria-hidden="true">
        {Object.entries(KEYPAD).map(([k, ls]) => <div className="tecla" key={k}><b>{k}</b><small>{ls}</small></div>)}
      </div>
      <Casillas words={words} onCheck={onCheck} />
    </>
  )
}

/* ---------- Cerradura de 3 cifras ---------- */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
function lockText({ bien, mal }) {
  if (!bien && !mal) return 'Ninguna cifra es correcta.'
  const parts = []
  if (bien) parts.push(`${plural(bien, 'cifra correcta y bien colocada', 'cifras correctas y bien colocadas')}`)
  if (mal) parts.push(`${plural(mal, 'cifra correcta pero mal colocada', 'cifras correctas pero mal colocadas')}`)
  return parts.join(' y ') + '.'
}
function Cerradura({ puzzle, onCheck }) {
  const [d, setD] = useState([0, 0, 0])
  const step = (i, v) => setD((a) => a.map((x, k) => (k === i ? (x + v + 10) % 10 : x)))
  return (
    <>
      <ul className="dr-intentos" aria-label="Intentos anotados">
        {puzzle.data.map((q) => (
          <li key={q.g}>
            <b className="dr-cifras">{[...q.g].join(' ')}</b>
            <span className="dr-marcas" aria-hidden="true">{'●'.repeat(q.bien)}{'○'.repeat(q.mal)}</span>
            <span className="dr-lock-txt">{lockText(q)}</span>
          </li>
        ))}
      </ul>
      <div className="dr-cerradura" role="group" aria-label="Cerradura">
        {d.map((v, i) => (
          <div className="dr-rueda-num" key={i}>
            <button type="button" className="dr-ficha" onClick={() => step(i, 1)} aria-label={`Subir la cifra ${i + 1}`}>▲</button>
            <b aria-live="polite">{v}</b>
            <button type="button" className="dr-ficha" onClick={() => step(i, -1)} aria-label={`Bajar la cifra ${i + 1}`}>▼</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onCheck(d.join(''))}>Abrir</button>
    </>
  )
}

/* ---------- Anagrama ---------- */
function Anagrama({ puzzle, onCheck }) {
  const { pool, lens } = puzzle.data
  const tiles = [...pool]
  const [slots, setSlots] = useState(() => Array(tiles.length).fill(null)) // índice de la letra puesta en cada hueco
  const used = new Set(slots.filter((s) => s !== null))
  const put = (ti) => setSlots((s) => { const k = s.indexOf(null); return k < 0 ? s : s.map((x, i) => (i === k ? ti : x)) })
  const take = (si) => setSlots((s) => s.map((x, i) => (i === si ? null : x)))
  const full = slots.every((s) => s !== null)
  const submit = () => {
    let i = 0
    onCheck(lens.map((n) => Array.from({ length: n }, () => tiles[slots[i++]]).join('')).join(' '))
  }
  let n = -1
  return (
    <>
      <div className="dr-huecos">
        {lens.map((len, wi) => (
          <div className="dr-palabra" key={wi}>
            {Array.from({ length: len }, () => {
              n++
              const si = n
              return (
                <button type="button" key={si} className="dr-ficha dr-hueco" onClick={() => take(si)} disabled={slots[si] === null}
                  aria-label={slots[si] === null ? `Hueco ${si + 1} vacío` : `Hueco ${si + 1}: ${tiles[slots[si]]}. Toca para quitar`}>
                  {slots[si] === null ? '' : tiles[slots[si]]}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="dr-monton" aria-label="Letras disponibles">
        {tiles.map((l, ti) => (
          <button type="button" key={ti} className="dr-ficha" disabled={used.has(ti)} onClick={() => put(ti)}>{l}</button>
        ))}
      </div>
      <div className="dr-doble">
        <button type="button" className="suave" onClick={() => setSlots(Array(tiles.length).fill(null))}>Borrar todo</button>
      </div>
      <button type="button" disabled={!full} onClick={submit}>Comprobar</button>
    </>
  )
}

/* ---------- Mensaje escondido (acróstico) ---------- */
function Acrostico({ puzzle, onCheck }) {
  return (
    <>
      <div className="dr-texto" aria-label="Texto">
        {puzzle.data.map((l, i) => <p key={i}>{l}</p>)}
      </div>
      <CajaRespuesta onCheck={onCheck} label="El mensaje escondido" />
    </>
  )
}

/* ---------- Símbolos (alfabeto "pigpen") ---------- */
export function Glyph({ letter, size = 30 }) {
  const g = pigpenGlyph(letter)
  if (!g) return null
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d={g.d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {g.dot && <circle cx="16" cy="16" r="2.7" fill="currentColor" />}
    </svg>
  )
}
function Simbolos({ puzzle, onCheck }) {
  const words = puzzle.data.split(' ').filter(Boolean).map((w) => [...pigpenLetters(w)].map((l, i) => <Glyph key={i} letter={l} size={28} />))
  return (
    <>
      <div className="dr-clave" aria-label="Clave de símbolos">
        {ALPHA.map((l) => <div key={l}><Glyph letter={l} size={26} /><b>{l}</b></div>)}
      </div>
      <Casillas words={words} onCheck={onCheck} />
    </>
  )
}

/* ---------- Alfabeto en espejo (Atbash) ---------- */
function Espejo({ puzzle, onCheck }) {
  const [sel, setSel] = useState(null)
  const hi = sel ? new Set([sel, atbash(sel)]) : new Set()
  const row = (letters) => letters.map((l) => (
    <button type="button" key={l} className={`dr-ficha dr-mini ${hi.has(l) ? 'dr-sel' : ''}`} onClick={() => setSel(l === sel ? null : l)}>{l}</button>
  ))
  const A = ALPHA.slice(0, 13), B = ALPHA.slice(13)
  return (
    <>
      <p className="dr-cifrado" aria-label="Mensaje cifrado">{puzzle.data}</p>
      <div className="dr-espejo" aria-label="Tabla del espejo">
        <div className="dr-fila">{row(A)}</div>
        <div className="dr-fila dr-reflejo">{row(A.map((l) => atbash(l)))}</div>
        <div className="dr-fila">{row(B)}</div>
        <div className="dr-fila dr-reflejo">{row(B.map((l) => atbash(l)))}</div>
      </div>
      <p className="dr-nota">Toca una letra y verás su reflejo.</p>
      <CajaRespuesta onCheck={onCheck} label="Tu traducción" />
    </>
  )
}

export const GAMES = {
  cesar: Cesar, morse: Morse, teclado: Teclado, cerradura: Cerradura, anagrama: Anagrama, acrostico: Acrostico, simbolos: Simbolos, espejo: Espejo,
}
