import { useEffect, useRef, useState } from 'react'
import { dateKey, dayIndex, fmtTime, isCorrect, levelStars, nextKey, puzzleFor, shareText, streakOf } from './ciphers.js'
import { GAMES, HOWTO, TYPE_NAME } from './games.jsx'
import PUZZLES from './puzzles.js'

const SITE_URL = 'https://app-sobre-lacrado.web.app/diario'
const BRAND_URL = 'https://www.instagram.com/sobrelacrado/' // enlace al terminar (de momento Instagram); si está vacío no se muestra
const STORE = 'sl_diario'

const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) ?? {} } catch { return {} } }
const save = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }

// onExit: cuando el Diario se abre desde dentro del panel de administración, botón para volver a él.
export default function Diario({ onExit }) {
  const [key, setKey] = useState(dateKey)
  const [store, setStore] = useState(load)
  const [wrong, setWrong] = useState(0) // fallos de esta visita, para animar el aviso
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(Date.now)
  const storeRef = useRef(store)
  storeRef.current = store

  const n = dayIndex(key) + 1
  const puzzle = puzzleFor(PUZZLES, key)
  const days = store.days ?? {}
  const day = days[key] ?? { tries: 0, hint: false, done: false, ms: 0 }

  const update = (patch) => {
    const cur = storeRef.current
    const d = { tries: 0, hint: false, done: false, ms: 0, ...(cur.days ?? {})[key], ...patch }
    const next = { ...cur, days: { ...(cur.days ?? {}), [key]: d } }
    storeRef.current = next
    setStore(next)
    save(next)
  }

  // Reloj: suma tiempo solo con la pantalla visible y mientras no esté resuelto; pasada la medianoche cambia de día.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      const k = dateKey()
      if (k !== key) { setKey(k); return }
      const d = (storeRef.current.days ?? {})[key]
      if (document.visibilityState === 'visible' && !d?.done) update({ ms: (d?.ms ?? 0) + 1000 })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const check = (answer) => {
    if (day.done) return
    if (isCorrect(puzzle, answer)) update({ done: true, ans: answer.toUpperCase().trim().replace(/\s+/g, ' '), n })
    else { update({ tries: day.tries + 1 }); setWrong((w) => w + 1) }
  }

  // La explicación sale abierta la primera vez que aparece cada tipo; después queda plegada (se abre con un toque).
  const [howOpen, setHowOpen] = useState(() => !(store.seen ?? []).includes(puzzle.type))
  useEffect(() => {
    const cur = storeRef.current
    if ((cur.seen ?? []).includes(puzzle.type)) return
    const next = { ...cur, seen: [...(cur.seen ?? []), puzzle.type] }
    storeRef.current = next
    setStore(next)
    save(next)
  }, [puzzle.type])

  const streak = streakOf(days, key)
  const solvedTotal = Object.values(days).filter((d) => d.done).length
  const Game = GAMES[puzzle.type]

  const share = async () => {
    const text = shareText(puzzle, { ...day, n }, SITE_URL)
    try {
      if (navigator.share) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* cancelado */ }
  }

  const [y, m, d] = nextKey(key).split('-').map(Number)
  const left = Math.max(0, new Date(y, m - 1, d).getTime() - now)
  const two = (v) => String(v).padStart(2, '0')
  const countdown = `${two(Math.floor(left / 3600000))}:${two(Math.floor((left % 3600000) / 60000))}:${two(Math.floor((left % 60000) / 1000))}`

  return (
    <main className="dr-pagina">
      <header className="dr-cab">
        {onExit && <button type="button" className="suave dr-volver" onClick={onExit}>← Panel</button>}
        <div className="logo">SOBRE LACRADO</div>
        <div className="dr-racha" title="Días seguidos resueltos">🔥 {streak}</div>
      </header>

      <article className={`dr-carta tema-${puzzle.theme}`}>
        <div className="dr-meta">
          <span>Diario nº {n}</span>
          <span aria-label={`Dificultad ${puzzle.level} de 5`}>{levelStars(puzzle.level)}</span>
        </div>
        <h1>{puzzle.title}</h1>
        <p className="dr-tipo">{TYPE_NAME[puzzle.type]}</p>
        <p className="dr-pista">{puzzle.clue}</p>

        <details className="dr-como" open={howOpen} onToggle={(e) => setHowOpen(e.currentTarget.open)}>
          <summary>Cómo se juega</summary>
          <p>{HOWTO[puzzle.type]}</p>
        </details>

        {day.done ? (
          <div className="dr-resuelto" role="status">
            <div className="dr-sello">Resuelto</div>
            <p className="dr-solucion">{day.ans}</p>
            <p className="dr-datos">
              {day.tries === 0 ? 'A la primera' : `${day.tries} ${day.tries === 1 ? 'fallo' : 'fallos'}`} · {fmtTime(day.ms)}{day.hint ? ' · con pista' : ''}
            </p>
            <button type="button" onClick={share}>{copied ? '¡Copiado!' : 'Compartir resultado'}</button>
            <p className="dr-proximo">Próximo acertijo en <b>{countdown}</b></p>
            {BRAND_URL && (
              <a className="boton dr-cta" href={BRAND_URL} target="_blank" rel="noopener noreferrer">
                ¿Te gusta descifrar? Síguenos en Instagram @sobrelacrado
              </a>
            )}
          </div>
        ) : (
          <>
            <Game puzzle={puzzle} onCheck={check} key={key} />
            <p className={`dr-aviso ${wrong ? 'dr-fallo' : ''}`} key={wrong} role="status">
              {wrong ? 'Esa no es. Vuelve a mirarlo.' : ''}
            </p>
            <div className="dr-pie-juego">
              {day.hint
                ? <p className="dr-pista-extra"><b>Pista:</b> {puzzle.hint}</p>
                : <button type="button" className="suave" onClick={() => update({ hint: true })}>Pedir pista</button>}
              <span className="dr-tiempo">{fmtTime(day.ms)}</span>
            </div>
          </>
        )}
      </article>

      <footer className="dr-pie">
        <p>Un código nuevo cada día · Resueltos: {solvedTotal}</p>
      </footer>
    </main>
  )
}
