import { useEffect, useRef, useState } from 'react'
import { dateKey, dayIndex, fmtTime, isCorrect, levelStars, nextKey, puzzleFor, shareText, streakOf } from './ciphers.js'
import { showText } from './criptico.js'
import { GAMES, HOWTO, TYPE_NAME } from './games.jsx'
import './diario.css'
import PUZZLES from './puzzles.js'
import Archivo from './Archivo.jsx'
import Avisos from './Avisos.jsx'
import Casos from './Casos.jsx'
import Progreso from './Progreso.jsx'
import { dayPoints, fmtMult, streakBefore, totalPoints } from './points.js'
import { mergeDays } from './stats.js'

const SITE_URL = 'https://app-sobre-lacrado.web.app/diario'
const BRAND_URL = 'https://www.instagram.com/sobrelacrado/' // enlace al terminar (de momento Instagram); si está vacío no se muestra
const STORE = 'sl_diario'
const LOGIN_FLAG = 'sl_diario_login' // recuerda que esta persona entró con Google (así la cuenta se carga sola al abrir)

const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) ?? {} } catch { return {} } }
const save = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }
const flag = (v) => { try { if (v) localStorage.setItem(LOGIN_FLAG, '1'); else localStorage.removeItem(LOGIN_FLAG) } catch { /* sin almacenamiento */ } }
const hasFlag = () => { try { return localStorage.getItem(LOGIN_FLAG) === '1' } catch { return false } }

// onExit: cuando el Diario se abre desde dentro del panel de administración, botón para volver a él.
export default function Diario({ onExit }) {
  const [key, setKey] = useState(dateKey)
  const [viewKey, setViewKey] = useState(null) // null = el acertijo de hoy; si no, un día del archivo
  const [store, setStore] = useState(load)
  const [wrong, setWrong] = useState(0) // fallos de esta visita, para animar el aviso
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [vista, setVista] = useState('hoy') // 'hoy' | 'archivo' | 'progreso' | 'casos'
  const [user, setUser] = useState(null) // cuenta de Google (null = sin sesión)
  const [status, setStatus] = useState('') // '' | 'entrando' | 'sincronizando' | 'error'
  const cloud = useRef(null) // módulo de la nube, se carga solo cuando hace falta
  const storeRef = useRef(store)
  storeRef.current = store

  const k = viewKey ?? key // día que se está jugando (hoy o uno del archivo)
  const late = k !== key // jugado desde el archivo: no suma racha y da la mitad de puntos
  const n = dayIndex(k) + 1
  const puzzle = puzzleFor(PUZZLES, k)
  const days = store.days ?? {}
  const day = days[k] ?? { tries: 0, hint: false, done: false, ms: 0 }
  const act = useRef(null) // día y acertijo activos para el reloj y las escrituras (que viven en funciones antiguas)
  act.current = { k, puzzle }

  // sync = false para el reloj (cada segundo): lo demás (pista, fallo, resuelto) se guarda también en la cuenta.
  const update = (patch, sync = true) => {
    const { k: kk, puzzle: pz } = act.current
    const cur = storeRef.current
    const d = { tries: 0, hint: false, done: false, ms: 0, type: pz.type, level: pz.level, ...(cur.days ?? {})[kk], ...patch }
    const next = { ...cur, days: { ...(cur.days ?? {}), [kk]: d } }
    storeRef.current = next
    setStore(next)
    save(next)
    if (sync && userRef.current && cloud.current) cloud.current.pushDay(userRef.current.uid, kk, d).catch(() => setStatus('error'))
  }

  // Cuenta: se carga al abrir si ya había entrado antes (o si el Diario va dentro del panel); al detectar sesión se mezcla el progreso.
  const userRef = useRef(null)
  const loadCloud = async () => {
    if (cloud.current) return cloud.current
    cloud.current = await import('./cloud.js')
    cloud.current.watchUser(async (u) => {
      userRef.current = u
      setUser(u)
      if (!u) return
      flag(true)
      try { // perfil (nombre y correo) una vez por sesión del navegador; no es crítico
        if (!sessionStorage.getItem('sl_perfil_' + u.uid)) { await cloud.current.saveProfile(u); sessionStorage.setItem('sl_perfil_' + u.uid, '1') }
      } catch { /* sin permiso o sin red: se reintenta otro día */ }
      setStatus('sincronizando')
      try {
        const remote = await cloud.current.pullDays(u.uid)
        const cur = storeRef.current
        const { merged, upload } = mergeDays(cur.days ?? {}, remote)
        const next = { ...cur, days: merged }
        storeRef.current = next
        setStore(next)
        save(next)
        await Promise.all(upload.map((k) => cloud.current.pushDay(u.uid, k, { type: puzzleFor(PUZZLES, k).type, level: puzzleFor(PUZZLES, k).level, ...merged[k] })))
        setStatus('')
      } catch { setStatus('error') }
    })
    return cloud.current
  }
  useEffect(() => { if (onExit || hasFlag()) loadCloud().catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const doLogin = async () => {
    setStatus('entrando')
    try { await (await loadCloud()).login(); setStatus('') } catch { setStatus('error') }
  }
  const doLogout = async () => { await cloud.current?.logout(); flag(false); setUser(null); userRef.current = null; setStatus('') }
  const doDelete = async () => {
    setStatus('sincronizando')
    try {
      await cloud.current.deleteAll(userRef.current.uid)
      await doLogout() // sin sesión no se vuelve a crear el perfil
    } catch { setStatus('error') }
  }

  // Reloj: suma tiempo solo con la pantalla visible y mientras no esté resuelto; pasada la medianoche cambia de día.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      const hoy = dateKey()
      if (hoy !== key) { setKey(hoy); setViewKey((v) => (v === hoy ? null : v)); return }
      const d = (storeRef.current.days ?? {})[act.current.k]
      if (document.visibilityState === 'visible' && !d?.done) update({ ms: (d?.ms ?? 0) + 1000 }, false)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const check = (answer) => {
    if (day.done) return
    if (isCorrect(puzzle, answer)) update({ done: true, ans: answer.toUpperCase().trim().replace(/\s+/g, ' '), n, ...(late ? { late: true } : {}) })
    else { update({ tries: day.tries + 1 }); setWrong((w) => w + 1) }
  }

  // La explicación sale abierta la primera vez que aparece cada tipo; después queda plegada (se abre con un toque).
  const [howOpen, setHowOpen] = useState(() => !(store.seen ?? []).includes(puzzle.type))
  useEffect(() => setWrong(0), [k])
  useEffect(() => {
    const cur = storeRef.current
    const first = !(cur.seen ?? []).includes(puzzle.type)
    setHowOpen(first)
    if (!first) return
    const next = { ...cur, seen: [...(cur.seen ?? []), puzzle.type] }
    storeRef.current = next
    setStore(next)
    save(next)
  }, [puzzle.type])

  const streak = streakOf(days, key)
  const pts = totalPoints(days)
  const gained = day.done ? dayPoints(day, streakBefore(days, k)) : null
  const solvedTotal = Object.values(days).filter((d) => d.done).length
  const Game = GAMES[puzzle.type]
  const multi = puzzle.type === 'criptico' // el críptico da la ayuda por pasos (0-3)
  const step = day.hintStep ?? 0

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
      {onExit && <div className="dr-volver-fila"><button type="button" className="suave dr-volver" onClick={onExit}>← Panel</button></div>}
      <header className="dr-cab">
        <div className="logo">SOBRE LACRADO</div>
        <div className="dr-racha" title="Racha de días seguidos · puntos">🔥 {streak} · ⭐ {pts}</div>
      </header>

      <nav className="dr-tabs" aria-label="Secciones">
        <button type="button" className={vista === 'hoy' && !viewKey ? 'activa' : ''} onClick={() => { setViewKey(null); setVista('hoy') }}>Hoy</button>
        <button type="button" className={vista === 'archivo' || (vista === 'hoy' && viewKey) ? 'activa' : ''} onClick={() => setVista('archivo')}>Archivo</button>
        <button type="button" className={vista === 'progreso' ? 'activa' : ''} onClick={() => setVista('progreso')}>
          Progreso
        </button>
        <button type="button" className={vista === 'casos' ? 'activa' : ''} onClick={() => setVista('casos')}>Casos</button>
      </nav>

      {vista === 'archivo' && <Archivo days={days} todayKey={key} onPick={(dayKey) => { setViewKey(dayKey); setVista('hoy') }} />}

      {vista === 'progreso' && (
        <Progreso days={days} todayKey={key} user={user} status={status} onLogin={doLogin} onLogout={doLogout} onDelete={doDelete} />
      )}

      {vista === 'casos' && <Casos user={user} cloud={cloud.current} status={status} onLogin={doLogin} />}

      {vista === 'hoy' && late && (
        <div className="dr-archivo-aviso">
          <p>📁 Archivo · <b>{new Date(k + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</b>. Aquí no sube la racha y los puntos son la mitad.</p>
          <div>
            <button type="button" className="suave" onClick={() => setVista('archivo')}>← Archivo</button>
            <button type="button" className="suave" onClick={() => setViewKey(null)}>Ir a hoy</button>
          </div>
        </div>
      )}

      {vista === 'hoy' && (
      <article className={`dr-carta tema-${puzzle.theme}`}>
        <div className="dr-meta">
          <span>Diario nº {n}</span>
          <span aria-label={`Dificultad ${puzzle.level} de 5`}>{levelStars(puzzle.level)}</span>
        </div>
        <h1>{puzzle.title}</h1>
        <p className="dr-tipo">{TYPE_NAME[puzzle.type]}</p>
        <p className="dr-pista">{puzzle.clue}</p>

        <details className="dr-como" open={howOpen} onToggle={(e) => setHowOpen(e.currentTarget.open)}>
          <summary>¿Cómo se juega?</summary>
          <p>{HOWTO[puzzle.type]}</p>
        </details>

        <section className="dr-juego">
        {day.done ? (
          <div className="dr-resuelto" role="status">
            <div className="dr-sello">Resuelto</div>
            <p className="dr-solucion">{day.ans}</p>
            <p className="dr-datos">
              {day.tries === 0 ? 'A la primera' : `${day.tries} ${day.tries === 1 ? 'fallo' : 'fallos'}`} · {fmtTime(day.ms)}{day.hint ? ' · con pista' : ''}
            </p>
            <button type="button" onClick={share}>{copied ? '¡Copiado!' : 'Compartir resultado'}</button>
            {multi && <div className="dr-explica"><b>Cómo se resolvía</b><p>{showText(puzzle.data.explain)}</p></div>}
            {gained && (
              <div className="dr-puntos" role="status">
                <b>+{gained.total} puntos</b>
                <small>
                  {gained.late
                    ? `Archivo: nivel ${puzzle.level} (${gained.base}) ${gained.firstTry ? '· a la primera ' : ''}${gained.noHint ? '· sin pista ' : ''}→ mitad`
                    : [`nivel ${puzzle.level}: ${gained.base}`, gained.firstTry && 'a la primera +50 %', gained.noHint && 'sin pista +25 %', gained.multiplier > 1 && `racha ${fmtMult(gained.multiplier)}`].filter(Boolean).join(' · ')}
                </small>
              </div>
            )}
            {late
              ? <button type="button" className="suave" onClick={() => setVista('archivo')}>← Volver al archivo</button>
              : (
                <>
                  <p className="dr-proximo">Próximo acertijo en <b>{countdown}</b></p>
                  <Avisos compact />
                </>
              )}
            {BRAND_URL && (
              <a className="boton dr-cta" href={BRAND_URL} target="_blank" rel="noopener noreferrer">
                ¿Te gusta descifrar? Síguenos en Instagram @sobrelacrado
              </a>
            )}
          </div>
        ) : (
          <>
            <Game puzzle={puzzle} onCheck={check} key={k} hintStep={step} />
            <p className={`dr-aviso ${wrong ? 'dr-fallo' : ''}`} key={wrong} role="status">
              {wrong ? 'Esa no es. Vuelve a mirarlo.' : ''}
            </p>
            <div className="dr-pie-juego">
              {multi
                ? (step < 3
                  ? <button type="button" className="suave" onClick={() => update({ hint: true, hintStep: step + 1 })}>{step ? `Otra pista (${step}/3)` : 'Pedir pista'}</button>
                  : <p className="dr-pista-extra">Ya no quedan más pistas.</p>)
                : day.hint
                  ? <p className="dr-pista-extra"><b>Pista:</b> {puzzle.hint}</p>
                  : <button type="button" className="suave" onClick={() => update({ hint: true })}>Pedir pista</button>}
              <span className="dr-tiempo">{fmtTime(day.ms)}</span>
            </div>
          </>
        )}
        </section>
      </article>
      )}

      <footer className="dr-pie">
        <p>Un código nuevo cada día · Resueltos: {solvedTotal}</p>
      </footer>
    </main>
  )
}
