// Pantalla "Mi progreso" del Diario: estadísticas personales y cuenta (Google) para no perderlas.
import { useState } from 'react'
import { fmtTime } from './ciphers.js'
import { TYPE_NAME } from './games.jsx'
import { diarioStats } from './stats.js'
import PUZZLES from './puzzles.js'

const PRIVACY = 'Guardamos tu identificador de cuenta y tus resultados del Diario solo para mostrarte tus estadísticas y que no se pierdan si cambias de móvil. No publicamos nada ni lo compartimos. Puedes borrarlo cuando quieras.'

export default function Progreso({ days, todayKey, user, status, onLogin, onLogout, onDelete }) {
  const s = diarioStats(days, todayKey, PUZZLES)
  const [sure, setSure] = useState(false)
  const maxAvg = Math.max(1, ...s.types.map((t) => t.avgMs))
  const big = (v, label) => <div className="dr-cifra"><b>{v}</b><small>{label}</small></div>

  return (
    <article className="dr-carta tema-detective">
      <h1>Mi progreso</h1>

      <div className="dr-cifras-grid">
        {big(`🔥 ${s.streak}`, 'racha actual')}
        {big(s.best, 'mejor racha')}
        {big(s.solved, 'resueltos')}
        {big(s.avgMs === null ? '—' : fmtTime(s.avgMs), 'tiempo medio')}
        {big(s.firstTryPct === null ? '—' : `${s.firstTryPct}%`, 'a la primera')}
        {big(s.noHintPct === null ? '—' : `${s.noHintPct}%`, 'sin pista')}
      </div>

      <h2 className="dr-sub">Últimas 4 semanas</h2>
      <div className="dr-cal" role="img" aria-label={`${s.calendar.filter((c) => c.state === 'done').length} días resueltos en las últimas 4 semanas`}>
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span className="dr-dia-sem" key={d}>{d}</span>)}
        {s.calendar.map((c) => <span key={c.key} className={`dr-dia ${c.state}`} title={c.key}>{c.state === 'done' ? '✓' : ''}</span>)}
      </div>

      {s.types.length > 0 && (
        <>
          <h2 className="dr-sub">Por tipo de código</h2>
          <ul className="dr-tipos">
            {s.types.map((t) => (
              <li key={t.type}>
                <span>{TYPE_NAME[t.type]} <small>× {t.count}</small></span>
                <span className="dr-barra"><i style={{ width: `${Math.max(8, (t.avgMs / maxAvg) * 100)}%` }} /></span>
                <b>{fmtTime(t.avgMs)}</b>
              </li>
            ))}
          </ul>
          <p className="dr-nota">Tiempo medio por tipo: cuanto más corta la barra, más rápido lo resuelves.</p>
        </>
      )}
      {s.solved === 0 && <p className="dr-nota">Aún no has resuelto ningún acertijo. ¡Empieza por el de hoy!</p>}

      <h2 className="dr-sub">Tu cuenta</h2>
      {user ? (
        <div className="dr-cuenta">
          <p>Sesión iniciada como <b>{user.email ?? user.displayName}</b>. Tu progreso se guarda en tu cuenta{status === 'sincronizando' ? ' (sincronizando…)' : ''}.</p>
          {status === 'error' && <p className="dr-aviso">No se pudo sincronizar. Se reintentará al volver a abrir.</p>}
          <button type="button" className="suave" onClick={onLogout}>Salir</button>
          {!sure
            ? <button type="button" className="suave" onClick={() => setSure(true)}>Borrar mi progreso guardado</button>
            : (
              <div className="dr-borrar">
                <p>Se borrará lo guardado en tu cuenta (en este móvil se conserva). ¿Seguro?</p>
                <button type="button" className="suave" onClick={() => { setSure(false); onDelete() }}>Sí, borrar</button>
                <button type="button" className="suave" onClick={() => setSure(false)}>Cancelar</button>
              </div>
            )}
        </div>
      ) : (
        <div className="dr-cuenta">
          <p>Ahora tu progreso solo está en este móvil. Entra con Google para guardarlo en tu cuenta y no perder tu racha si cambias de móvil o borras el navegador.</p>
          <button type="button" onClick={onLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
          {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
          <p className="dr-nota">{PRIVACY}</p>
        </div>
      )}
      {user && <p className="dr-nota">{PRIVACY}</p>}
    </article>
  )
}
