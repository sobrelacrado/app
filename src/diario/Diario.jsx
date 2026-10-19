import { useEffect, useRef, useState } from 'react'
import { dateKey, dayIndex, fmtTime, isCorrect, levelStars, nextKey, puzzleFor, shareText, streakOf } from './ciphers.js'
import { showText } from './criptico.js'
import { GAMES, HOWTO, TYPE_NAME } from './games.jsx'
import './diario.css'
import PUZZLES from './puzzles.js'
import Archivo from './Archivo.jsx'
import TabBar from '../components/TabBar.jsx'
import Amigos from './Amigos.jsx'
import Avisos from './Avisos.jsx'
import Casos from './Casos.jsx'
import Progreso from './Progreso.jsx'
import Sellos from './Sellos.jsx'
import { dayPoints, fmtMult, rankOf, retoPoints, streakBefore, totalPoints, weekStart, weeklyPoints } from './points.js'
import { retoFor, retoPuzzle } from './reto.js'
import BANCO from './banco.js'
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
  const [laterLogin, setLaterLogin] = useState(() => { try { return localStorage.getItem('sl_login_ahora') === dateKey() } catch { return false } }) // "Ahora no" vale hasta mañana
  const [now, setNow] = useState(Date.now)
  // 'hoy' | 'archivo' | 'progreso' | 'casos' | 'amigos'. Los enlaces /diario#casos y /diario#grupo=CODIGO abren Mis casos y la invitación a un grupo.
  const [joinCode] = useState(() => /^#grupo=([A-Za-z0-9]{6})$/.exec(location.hash)?.[1]?.toUpperCase() ?? null)
  const [vista, setVista] = useState(() => {
    if (location.hash === '#casos') return 'casos'
    if (/^#grupo=/.test(location.hash)) return 'amigos'
    // Al recargar la página se vuelve a la pestaña donde estabas (solo mientras la pestaña del navegador siga abierta).
    try { const v = sessionStorage.getItem('sl_diario_vista'); if (['archivo', 'progreso', 'casos', 'amigos', 'sellos'].includes(v)) return v } catch { /* sin almacenamiento */ }
    return 'hoy'
  })
  useEffect(() => { try { sessionStorage.setItem('sl_diario_vista', vista) } catch { /* sin almacenamiento */ } }, [vista])
  const [sellosBack, setSellosBack] = useState('hoy') // desde dónde se abrió Sellos (Hoy o Archivo), para el botón de volver
  const openSellos = (from) => { setSellosBack(from); setVista('sellos'); window.scrollTo({ top: 0 }) }
  const [retoOn, setRetoOn] = useState(false) // jugando el reto de nivel de hoy (en vez del acertijo del día)
  const [retoLogin, setRetoLogin] = useState(false) // se pulsó el reto sin sesión: se enseña la invitación a entrar con Google
  const retoRef = useRef(null)
  const [user, setUser] = useState(null) // cuenta de Google (null = sin sesión)
  const [status, setStatus] = useState('') // '' | 'entrando' | 'sincronizando' | 'error'
  const cloud = useRef(null) // módulo de la nube, se carga solo cuando hace falta
  const storeRef = useRef(store)
  storeRef.current = store
  const groupsRef = useRef(null) // grupos de amigos de esta persona (se piden una vez y se recuerdan)

  const days = store.days ?? {}
  const retos = store.retos ?? {} // retos de nivel, uno por fecha
  const playReto = retoOn && vista === 'hoy' && !viewKey && !!user // el reto exige cuenta de Google: así su progreso queda guardado
  const retoToday = retos[key] ?? null // el que ya se empezó hoy (queda fijo aunque cambien los puntos)
  const retoPick = retoToday ?? retoFor(PUZZLES, BANCO, key, totalPoints(days, retos), days, retos)
  const k = playReto ? key : (viewKey ?? key) // día que se está jugando (hoy o uno del archivo)
  const late = !playReto && k !== key // jugado desde el archivo: no suma racha y da la mitad de puntos
  const n = dayIndex(k) + 1
  const puzzle = playReto ? retoPuzzle(PUZZLES, BANCO, retoPick.i) : puzzleFor(PUZZLES, k)
  const day = (playReto ? retos[key] : days[k]) ?? { tries: 0, hint: false, done: false, ms: 0 }
  const act = useRef(null) // día y acertijo activos para el reloj y las escrituras (que viven en funciones antiguas)
  act.current = { k, puzzle, reto: playReto ? retoPick.i : null }

  // Sube a cada grupo de amigos los puntos de esta semana (al resolver un acertijo, al entrar y al cambiar de grupos).
  const pushScores = async () => {
    const u = userRef.current
    if (!u || !cloud.current) return
    try {
      groupsRef.current ??= await cloud.current.myGroups(u.uid)
      if (!groupsRef.current.length) return
      const cur = storeRef.current, today = dateKey(), wk = weekStart(today)
      const { pts, solved } = weeklyPoints(cur.days ?? {}, cur.retos ?? {}, wk)
      const streak = streakOf(cur.days ?? {}, today)
      await Promise.all(groupsRef.current.map((g) => cloud.current.pushScore(u.uid, g.code, wk, { pts, solved, streak })))
    } catch { /* sin red o sin permiso: se reintenta la próxima vez */ }
  }
  const groupsChanged = () => { groupsRef.current = null; pushScores() }

  // sync = false para el reloj (cada segundo): lo demás (pista, fallo, resuelto) se guarda también en la cuenta.
  const update = (patch, sync = true) => {
    const { k: kk, puzzle: pz, reto: ri } = act.current
    const cur = storeRef.current
    const area = ri === null ? 'days' : 'retos'
    const d = { tries: 0, hint: false, done: false, ms: 0, type: pz.type, level: pz.level, ...(ri === null ? {} : { i: ri }), ...(cur[area] ?? {})[kk], ...patch }
    const next = { ...cur, [area]: { ...(cur[area] ?? {}), [kk]: d } }
    storeRef.current = next
    setStore(next)
    save(next)
    if (sync && userRef.current && cloud.current) (ri === null ? cloud.current.pushDay : cloud.current.pushReto)(userRef.current.uid, kk, d).catch(() => setStatus('error'))
    if (patch.done && sync) pushScores()
  }

  // Cuenta: se carga al abrir si ya había entrado antes (o si el Diario va dentro del panel); al detectar sesión se mezcla el progreso.
  const userRef = useRef(null)
  const loadCloud = async () => {
    if (cloud.current) return cloud.current
    cloud.current = await import('./cloud.js')
    cloud.current.finishRedirect().catch(() => setStatus('error'))
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
        const remoteRetos = await cloud.current.pullRetos(u.uid).catch(() => ({}))
        const mr = mergeDays(cur.retos ?? {}, remoteRetos)
        const next = { ...cur, days: merged, retos: mr.merged }
        storeRef.current = next
        setStore(next)
        save(next)
        await Promise.all(upload.map((k) => cloud.current.pushDay(u.uid, k, { type: puzzleFor(PUZZLES, k).type, level: puzzleFor(PUZZLES, k).level, ...merged[k] })))
        await Promise.all(mr.upload.map((k) => cloud.current.pushReto(u.uid, k, mr.merged[k])))
        pushScores()
        setStatus('')
      } catch { setStatus('error') }
    })
    return cloud.current
  }
  useEffect(() => { if (onExit || hasFlag()) loadCloud().catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const doLogin = async () => {
    setStatus('entrando')
    flag(true) // si se entra por redirección (iPhone), al volver hay que cargar la cuenta aunque aún no haya sesión
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
      if (hoy !== key) { setKey(hoy); setViewKey((v) => (v === hoy ? null : v)); setRetoOn(false); return }
      const d = (storeRef.current[act.current.reto === null ? 'days' : 'retos'] ?? {})[act.current.k]
      if (document.visibilityState === 'visible' && !d?.done) update({ ms: (d?.ms ?? 0) + 1000 }, false)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Pulsar el reto: con sesión se abre; sin sesión se enseña la invitación a entrar con Google (y al entrar se abre solo).
  const openReto = () => {
    if (!userRef.current) {
      setRetoLogin(true)
      setTimeout(() => retoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
      return
    }
    setRetoOn(true)
    window.scrollTo({ top: 0 })
  }
  useEffect(() => {
    if (user && retoLogin) { setRetoLogin(false); setRetoOn(true); window.scrollTo({ top: 0 }) }
  }, [user, retoLogin])

  const check = (answer) => {
    if (day.done) return
    if (isCorrect(puzzle, answer)) update({ done: true, ans: answer.toUpperCase().trim().replace(/\s+/g, ' '), ...(playReto ? {} : { n }), ...(late ? { late: true } : {}) })
    else { update({ tries: day.tries + 1 }); setWrong((w) => w + 1) }
  }

  // La explicación sale abierta la primera vez que aparece cada tipo; después queda plegada (se abre con un toque).
  const [howOpen, setHowOpen] = useState(() => !(store.seen ?? []).includes(puzzle.type))
  useEffect(() => setWrong(0), [k, playReto])
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
  const pts = totalPoints(days, retos)
  const gained = day.done ? (playReto ? retoPoints(day) : dayPoints(day, streakBefore(days, k))) : null
  const solvedTotal = Object.values(days).filter((d) => d.done).length
  const Game = GAMES[puzzle.type]
  const multi = puzzle.type === 'criptico' // el críptico da la ayuda por pasos (0-3)
  const step = day.hintStep ?? 0

  // Puntito en «Hoy»: falta el acertijo del día o, con sesión, el reto de tu nivel.
  const pendienteHoy = !days[key]?.done || (!!user && !!retoPick && !retos[key]?.done)

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

      <TabBar variant="diario" label="Secciones" active={vista === 'hoy' ? (viewKey ? 'archivo' : 'hoy') : vista === 'sellos' ? sellosBack : vista}
        onChange={(id) => { if (id === 'hoy') { setViewKey(null); setRetoOn(false) } setVista(id) }}
        tabs={[
          { id: 'hoy', label: 'Hoy', icon: 'hoy', badge: pendienteHoy ? 'Tienes un acertijo o un reto sin resolver' : null },
          { id: 'archivo', label: 'Archivo', icon: 'archivo' },
          { id: 'progreso', label: 'Progreso', icon: 'progreso' },
          { id: 'casos', label: 'Casos', icon: 'casos' },
          { id: 'amigos', label: 'Amigos', icon: 'amigos' },
        ]} />

      {vista === 'sellos' && <Sellos onExit={() => setVista(sellosBack)} />}

      {vista === 'archivo' && <Archivo onSellos={() => openSellos('archivo')} days={days} todayKey={key} onPick={(dayKey) => { setViewKey(dayKey); setRetoOn(false); setVista('hoy') }} />}

      {vista === 'progreso' && (
        <Progreso days={days} retos={retos} todayKey={key} user={user} status={status} onLogin={doLogin} onLogout={doLogout} onDelete={doDelete} />
      )}

      {vista === 'casos' && <Casos user={user} cloud={cloud.current} status={status} onLogin={doLogin} />}

      {vista === 'amigos' && <Amigos user={user} cloud={cloud.current} status={status} onLogin={doLogin} today={key} days={days} retos={retos} joinCode={joinCode} onChange={groupsChanged} />}

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
        {playReto && (
          <div className="dr-reto-aviso">
            <span>🎯 Reto de tu nivel · <b>{rankOf(pts).name}</b></span>
            <button type="button" className="suave" onClick={() => setRetoOn(false)}>← Hoy</button>
          </div>
        )}
        <div className="dr-meta">
          <span>{playReto ? 'Reto' : `Diario nº ${n}`}</span>
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
            {!playReto && <button type="button" onClick={share}>{copied ? '¡Copiado!' : 'Compartir resultado'}</button>}
            {multi && <div className="dr-explica"><b>Cómo se resolvía</b><p>{showText(puzzle.data.explain)}</p></div>}
            {gained && (
              <div className="dr-puntos" role="status">
                <b>+{gained.total} puntos</b>
                <small>
                  {playReto
                    ? `Reto nivel ${puzzle.level}: ${gained.base} ${gained.firstTry ? '· a la primera +50 % ' : ''}${gained.noHint ? '· sin pista +25 % ' : ''}· extra de reto ×${String(gained.extra).replace('.', ',')}`
                    : gained.late
                    ? `Archivo: nivel ${puzzle.level} (${gained.base}) ${gained.firstTry ? '· a la primera ' : ''}${gained.noHint ? '· sin pista ' : ''}→ mitad`
                    : [`nivel ${puzzle.level}: ${gained.base}`, gained.firstTry && 'a la primera +50 %', gained.noHint && 'sin pista +25 %', gained.multiplier > 1 && `racha ${fmtMult(gained.multiplier)}`].filter(Boolean).join(' · ')}
                </small>
              </div>
            )}
            {!playReto && !late && retoPick && !retoToday?.done && (
              <div className="dr-reto-resuelto">
                <p><b>¿Quieres más?</b> Tienes un reto extra de tu nivel ({levelStars(retoPick.level)}) con <b>puntos ×1,5</b>.</p>
                <button type="button" className="dr-reto-boton" onClick={openReto}>🎯 Jugar mi reto de hoy</button>
              </div>
            )}
            {!playReto && !late && (
              <div className="dr-sellos-invita">
                <p><b>¿Sigues con ganas?</b> Sellos: tableros de lógica sin límite, para entrenar cuanto quieras.</p>
                <button type="button" className="suave" onClick={() => openSellos('hoy')}>Jugar a Sellos</button>
              </div>
            )}
            {!user && !laterLogin && (
              <div className="dr-guardar">
                <b>🔥 Guarda tu racha y tus puntos</b>
                <p>Entra con Google y no los perderás si cambias de móvil o borras el navegador. Es opcional: puedes seguir jugando sin cuenta.</p>
                <button type="button" onClick={doLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
                {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
                <button type="button" className="suave dr-ahora-no" onClick={() => { try { localStorage.setItem('sl_login_ahora', dateKey()) } catch { /* sin almacenamiento */ } setLaterLogin(true) }}>Ahora no</button>
                <small>Se guarda tu nombre, correo y resultados; el creador del juego los ve para saber cuántas personas juegan.</small>
              </div>
            )}
            {playReto
              ? (
                <>
                  <p className="dr-proximo">Reto nuevo mañana · en <b>{countdown}</b></p>
                  <button type="button" className="suave" onClick={() => setRetoOn(false)}>← Volver a hoy</button>
                </>
              )
              : late
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
            <Game puzzle={puzzle} onCheck={check} key={(playReto ? 'reto-' : '') + k} hintStep={step} hinted={!!day.hint} />
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

      {vista === 'hoy' && !viewKey && !playReto && retoPick && (
        <aside ref={retoRef} className={'dr-reto' + (retoToday?.done ? ' hecho' : day.done ? ' listo' : '')}>
          {retoToday?.done
            ? <p>✅ Reto de hoy resuelto · <b>+{retoPoints(retoToday).total} puntos</b>. Mañana, uno nuevo.</p>
            : retoLogin && !user
            ? (
              <>
                <p className="dr-reto-t">🔐 Entra para jugar el reto</p>
                <p>El reto necesita una cuenta de Google: así se guardan tu <b>progreso, tus puntos y tu rango</b> y no los pierdes si cambias de móvil.</p>
                <button type="button" className="dr-reto-boton" onClick={doLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
                {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
                <button type="button" className="dr-reto-ahora-no" onClick={() => setRetoLogin(false)}>Ahora no</button>
                <small className="dr-reto-nota">Se guarda tu nombre, correo y resultados; el creador del juego los ve para saber cuántas personas juegan.</small>
              </>
            )
            : (
              <>
                <p className="dr-reto-t">🎯 Tu reto de hoy</p>
                <p><b>{rankOf(pts).name}</b> · dificultad <span aria-label={`nivel ${retoPick.level} de 5`}>{levelStars(retoPick.level)}</span><br />Un acertijo extra, solo para tu nivel.</p>
                <span className="dr-reto-extra">Puntos extra ×1,5</span>
                <button type="button" className="dr-reto-boton" onClick={openReto}>{retoToday ? 'Continuar el reto' : 'Jugar el reto'}</button>
              </>
            )}
        </aside>
      )}

      <footer className="dr-pie">
        <p>Un código nuevo cada día · Resueltos: {solvedTotal}</p>
      </footer>
    </main>
  )
}
