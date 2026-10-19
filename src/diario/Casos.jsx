// Pantalla "Mis casos" del Diario: las partidas de los casos impresos que esta persona jugó con sus QR.
import { useEffect, useState } from 'react'
import { fmtDuration } from '../lib/runs.js'
import { caseSummary, STATUS_TEXT } from './casos.js'
import Cuaderno from './Cuaderno.jsx'

// Formulario de la lista de espera (el mismo enlace del perfil de Instagram): al apuntarse se recibe por correo el Caso 2, gratis.
const FREE_CASE_URL = 'https://preview.mailerlite.io/forms/2670725/199972870005195853/share'

// El vídeo está en GitHub Pages (mismo sitio que los del Caso 3), no dentro de la app: así no gasta la descarga diaria del alojamiento.
const VIDEOS = 'https://sobrelacrado.github.io/videos/duarte-v0'

function CasoGratis() {
  return (
    <aside className="dr-regalo">
      <span className="dr-gratis" aria-hidden="true">GRATIS</span>
      <h2>🕵️ Caso 2: Agencia Duarte</h2>
      <p className="dr-regalo-sub">Resuelve el caso del detective Tomás Duarte</p>
      <video className="dr-video" controls playsInline preload="none" poster={`${VIDEOS}/duarte-v0-poster.jpg`} aria-label="Vídeo de presentación del Caso 2">
        <source src={`${VIDEOS}/duarte-v0.mp4`} type="video/mp4" />
      </video>
      <p>Un caso completo para imprimir y jugar en casa, con códigos QR, pistas y vídeos. Apúntate a la lista de espera y <b>te llega gratis por correo</b>.</p>
      <a className="boton dr-cta" href={FREE_CASE_URL} target="_blank" rel="noopener noreferrer">Quiero el caso gratis</a>
    </aside>
  )
}

const NOTE = 'Aquí aparecen las partidas que has jugado con los QR de los casos desde este móvil. Se vinculan a tu cuenta solo para que puedas verlas; no se comparten con nadie. Quitar una partida de tu cuenta no la borra del juego.'
const fmtDate = (d) => d.toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// Valoración privada de un caso terminado: de 1 a 5 estrellas y un comentario opcional que solo lee el creador.
function Valoracion({ uid, cloud, gameId, runId, saved, onSaved }) {
  const [stars, setStars] = useState(saved?.stars ?? 0)
  const [comment, setComment] = useState(saved?.comment ?? '')
  const [state, setState] = useState('') // '' | 'guardando' | 'ok' | 'error'
  const change = (fn) => (v) => { fn(v); setState('') }
  const save = async () => {
    setState('guardando')
    try { await cloud.saveRating(uid, gameId, runId, stars, comment); onSaved(gameId, { stars, comment: comment.trim() }); setState('ok') } catch { setState('error') }
  }
  const remove = async () => {
    setState('guardando')
    try { await cloud.deleteRating(uid, gameId); onSaved(gameId, null); setStars(0); setComment(''); setState('') } catch { setState('error') }
  }
  return (
    <div className="dr-valorar">
      <p className="dr-valorar-t">{saved ? 'Tu valoración' : '¿Qué tal el caso?'}</p>
      <div className="dr-estrellas" role="radiogroup" aria-label="Estrellas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className={n <= stars ? 'on' : ''} onClick={() => change(setStars)(n)}>★</button>
        ))}
      </div>
      <textarea value={comment} maxLength={300} rows={2} placeholder="Cuéntame qué te ha gustado o qué mejorarías (opcional)"
        onChange={(e) => change(setComment)(e.target.value)} aria-label="Comentario" />
      <div className="dr-valorar-pie">
        <button type="button" className="suave" disabled={!stars || state === 'guardando'} onClick={save}>{saved ? 'Actualizar' : 'Enviar valoración'}</button>
        {saved && <button type="button" className="suave" disabled={state === 'guardando'} onClick={remove}>Quitar</button>}
        <small>{comment.length}/300</small>
      </div>
      {state === 'ok' && <p className="dr-nota">¡Gracias! Guardado.</p>}
      {state === 'error' && <p className="dr-aviso">No se pudo guardar. Inténtalo de nuevo.</p>}
      <p className="dr-nota">Solo la lee el creador del juego, no se publica.</p>
    </div>
  )
}

export default function Casos({ user, cloud, status, onLogin }) {
  const [items, setItems] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [open, setOpen] = useState('') // id de la partida con los pasos desplegados
  const [sure, setSure] = useState('') // id de la partida pendiente de confirmar
  const [book, setBook] = useState('') // id de la partida con el cuaderno abierto
  const [ratings, setRatings] = useState({}) // valoraciones propias por juego

  const load = async () => {
    setError(false)
    try {
      await cloud.claimLocalRuns(user.uid)
      setItems(await cloud.loadCases(user.uid))
      setRatings(await cloud.loadRatings(user.uid).catch(() => ({})))
    } catch { setError(true); setItems([]) }
  }
  useEffect(() => {
    if (user && cloud) load()
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const unlink = async (id) => {
    setSure('')
    try { await cloud.unlinkRun(id); setItems((list) => list.filter((c) => c.id !== id)) } catch { setError(true) }
  }

  if (!user) {
    return (
      <article className="dr-carta tema-detective">
        <h1>Mis casos</h1>
        <CasoGratis />
        <div className="dr-cuenta">
          <p>Entra con Google para ver aquí tus partidas de los casos: cuánto tardaste en total y en cada paso.</p>
          <button type="button" onClick={onLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
          {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
          <p className="dr-nota">{NOTE}</p>
        </div>
      </article>
    )
  }

  const now = Date.now()
  return (
    <article className="dr-carta tema-detective">
      <h1>Mis casos</h1>
      {(!items || items.length === 0) && <CasoGratis />}
      {items === null && <p className="dr-nota">Buscando tus partidas…</p>}
      {error && <p className="dr-aviso">No se pudieron cargar todas. <button type="button" className="suave" onClick={load}>Reintentar</button></p>}
      {items?.length === 0 && !error && (
        <p className="dr-nota">Todavía no hay partidas en tu cuenta. Cuando juegues un caso escaneando sus QR con este móvil, aparecerá aquí al abrir esta pestaña.</p>
      )}

      <ul className="dr-casos">
        {(items ?? []).map((c) => {
          const { status: st, rows } = caseSummary(c.run, c.game, c.scans, c.steps, now)
          return (
            <li key={c.id} className={`dr-caso ${st.kind}`}>
              <div className="dr-caso-cab">
                <h2>{c.game?.name ?? 'Caso'}</h2>
                <span className="dr-estado">{STATUS_TEXT[st.kind]}</span>
              </div>
              <p className="dr-caso-datos">
                {c.run.alias ? <b>{c.run.alias}</b> : 'Sin nombre'} · {fmtDate(c.run.startedAt)}
              </p>
              <p className="dr-caso-tiempo">{fmtDuration(st.ms)} <small>{st.kind === 'open' ? 'hasta ahora' : st.kind === 'timeout' ? 'de tiempo límite' : 'en total'}</small></p>

              <button type="button" className="suave" onClick={() => setOpen(open === c.id ? '' : c.id)}>
                {open === c.id ? 'Ocultar pasos' : `Ver pasos (${rows.length})`}
              </button>
              {open === c.id && (
                <ol className="dr-pasos">
                  {rows.map((r) => (
                    <li key={r.id}><span>{r.label}</span><b>{r.type === 'start' ? '—' : `+${fmtDuration(r.ms)}`}</b></li>
                  ))}
                  {rows.length === 0 && <li><span>Sin pasos registrados</span></li>}
                </ol>
              )}

              {c.run.gameId && (
                <>
                  <button type="button" className="suave dr-cuaderno-btn" onClick={() => setBook(book === c.id ? '' : c.id)} aria-expanded={book === c.id}>
                    {book === c.id ? 'Cerrar cuaderno' : '📓 Cuaderno de detective'}
                  </button>
                  {book === c.id && <Cuaderno uid={user.uid} cloud={cloud} gameId={c.run.gameId} />}
                </>
              )}

              {st.kind === 'finished' && c.run.gameId && (
                <Valoracion key={c.id} uid={user.uid} cloud={cloud} gameId={c.run.gameId} runId={c.id}
                  saved={ratings[c.run.gameId]} onSaved={(g, v) => setRatings((r) => { const n = { ...r }; if (v) n[g] = v; else delete n[g]; return n })} />
              )}

              {sure === c.id ? (
                <div className="dr-borrar">
                  <p>Dejará de aparecer en tu cuenta. ¿Seguro?</p>
                  <button type="button" className="suave" onClick={() => unlink(c.id)}>Sí, quitar</button>
                  <button type="button" className="suave" onClick={() => setSure('')}>Cancelar</button>
                </div>
              ) : (
                <button type="button" className="suave dr-quitar" onClick={() => setSure(c.id)}>Quitar de mi cuenta</button>
              )}
            </li>
          )
        })}
      </ul>
      {items?.length > 0 && <CasoGratis />}
      <p className="dr-nota">{NOTE}</p>
    </article>
  )
}
