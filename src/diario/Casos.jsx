// Pantalla "Mis casos" del Diario: las partidas de los casos impresos que esta persona jugó con sus QR.
import { useEffect, useState } from 'react'
import { fmtDuration } from '../lib/runs.js'
import { caseSummary, STATUS_TEXT } from './casos.js'

// Formulario de la lista de espera (el mismo enlace del perfil de Instagram): al apuntarse se recibe por correo el Caso 2, gratis.
const FREE_CASE_URL = 'https://preview.mailerlite.io/forms/2670725/199972870005195853/share'

function CasoGratis() {
  return (
    <aside className="dr-regalo">
      <h2>Caso 2 · Agencia Duarte</h2>
      <p>¿Aún no tienes el caso? El detective Tomás Duarte te espera. Es <b>gratis</b>: apúntate a la lista de espera y te llega por correo.</p>
      <a className="boton dr-cta" href={FREE_CASE_URL} target="_blank" rel="noopener noreferrer">Conseguir el caso gratis</a>
    </aside>
  )
}

const NOTE = 'Aquí aparecen las partidas que has jugado con los QR de los casos desde este móvil. Se vinculan a tu cuenta solo para que puedas verlas; no se comparten con nadie. Quitar una partida de tu cuenta no la borra del juego.'
const fmtDate = (d) => d.toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function Casos({ user, cloud, status, onLogin }) {
  const [items, setItems] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [open, setOpen] = useState('') // id de la partida con los pasos desplegados
  const [sure, setSure] = useState('') // id de la partida pendiente de confirmar

  const load = async () => {
    setError(false)
    try {
      await cloud.claimLocalRuns(user.uid)
      setItems(await cloud.loadCases(user.uid))
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
        <div className="dr-cuenta">
          <p>Entra con Google para ver aquí tus partidas de los casos: cuánto tardaste en total y en cada paso.</p>
          <button type="button" onClick={onLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
          {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
          <p className="dr-nota">{NOTE}</p>
        </div>
        <CasoGratis />
      </article>
    )
  }

  const now = Date.now()
  return (
    <article className="dr-carta tema-detective">
      <h1>Mis casos</h1>
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
      <CasoGratis />
      <p className="dr-nota">{NOTE}</p>
    </article>
  )
}
