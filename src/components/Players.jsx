// Pestaña "Jugadores" del panel (solo la ve Alberto): quién ha entrado con Google al Diario y cómo le va.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import { dateKey, fmtTime } from '../diario/ciphers.js'
import { TYPE_NAME } from '../diario/games.jsx'
import { rankOf, totalPoints } from '../diario/points.js'
import { diarioStats } from '../diario/stats.js'
import PUZZLES from '../diario/puzzles.js'
import { download, isoLocal, toCsv } from '../lib/csv.js'

const TXT = {
  es: {
    title: 'Jugadores del Diario', note: 'Personas que han entrado con Google en el Diario (nombre y correo). Quien juega sin cuenta no aparece. Quien entró antes de esta versión aparecerá cuando vuelva a abrir el Diario.',
    total: 'jugadores', active: 'activos (7 días)', solved: 'días resueltos', avg: 'media por jugador', refresh: 'Actualizar', loading: 'Cargando…', error: 'No se pudo cargar.', empty: 'Todavía no hay jugadores con cuenta.',
    name: 'Nombre', email: 'Correo', since: 'Desde', last: 'Última vez', days: 'Días', streak: 'Racha', points: 'Puntos', rank: 'Rango', hint: 'Sin pista', time: 'Tiempo medio',
    csv: 'Descargar CSV', sortBy: 'Ordenar por', reverse: 'Invertir orden', detail: 'Detalle', hide: 'Cerrar', date: 'Día', type: 'Tipo', level: 'Nivel', tries: 'Fallos', usedHint: 'Pista', late: 'Desde archivo', yes: 'sí', no: 'no', noName: '(sin nombre)',
  },
  en: {
    title: 'Daily players', note: 'People who signed in with Google in the Daily (name and email). Anyone playing without an account is not listed. Earlier sign-ins appear when they open the Daily again.',
    total: 'players', active: 'active (7 days)', solved: 'days solved', avg: 'average per player', refresh: 'Refresh', loading: 'Loading…', error: 'Could not load.', empty: 'No signed-in players yet.',
    name: 'Name', email: 'Email', since: 'Since', last: 'Last seen', days: 'Days', streak: 'Streak', points: 'Points', rank: 'Rank', hint: 'No hint', time: 'Avg time',
    csv: 'Download CSV', sortBy: 'Sort by', reverse: 'Reverse order', detail: 'Detail', hide: 'Close', date: 'Day', type: 'Type', level: 'Level', tries: 'Misses', usedHint: 'Hint', late: 'From archive', yes: 'yes', no: 'no', noName: '(no name)',
  },
}
const WEEK = 7 * 86400000
const SORTS = [['last', 'last'], ['first', 'since'], ['solved', 'days'], ['streak', 'streak'], ['points', 'points'], ['name', 'name']]
const toDate = (v) => v?.toDate?.() ?? null

// Datos de un jugador a partir de su perfil y de sus días guardados.
export function buildPlayer(uid, profile, dayDocs, todayKey) {
  const days = {}
  let lastAt = toDate(profile?.last)
  for (const [key, x] of Object.entries(dayDocs)) {
    days[key] = { done: !!x.done, tries: x.tries ?? 0, hint: !!x.hint, ms: x.ms ?? 0, type: x.type, level: x.level, ...(x.late ? { late: true } : {}) }
    const at = toDate(x.at)
    if (at && (!lastAt || at > lastAt)) lastAt = at
  }
  const st = diarioStats(days, todayKey, PUZZLES)
  const points = totalPoints(days)
  return {
    uid, name: profile?.name ?? '', email: profile?.email ?? '', first: toDate(profile?.first), last: lastAt,
    days, solved: st.solved, streak: st.streak, best: st.best, points, rank: rankOf(points).name,
    noHintPct: st.noHintPct, avgMs: st.avgMs,
  }
}

export default function Players() {
  const { lang } = useT()
  const x = TXT[lang] ?? TXT.es
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)
  const [sort, setSort] = useState({ key: 'last', dir: -1 })
  const [open, setOpen] = useState(null)

  const load = useCallback(async () => {
    setError(false)
    try {
      const todayKey = dateKey()
      const users = await getDocs(collection(db, 'users'))
      const out = await Promise.all(users.docs.map(async (u) => {
        const snap = await getDocs(collection(db, 'users', u.id, 'diario'))
        const dayDocs = {}
        snap.forEach((d) => { dayDocs[d.id] = d.data() })
        return buildPlayer(u.id, u.data(), dayDocs, todayKey)
      }))
      setRows(out)
    } catch { setError(true) }
  }, [])
  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => {
    const val = (r) => ({
      name: (r.name || r.email).toLowerCase(), email: r.email.toLowerCase(), first: r.first?.getTime() ?? 0, last: r.last?.getTime() ?? 0,
      solved: r.solved, streak: r.streak, points: r.points,
    })[sort.key]
    return [...(rows ?? [])].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [rows, sort])

  const date = (d) => (d ? d.toLocaleDateString(lang) : '—')
  const now = Date.now()
  const active = (rows ?? []).filter((r) => r.last && now - r.last.getTime() < WEEK).length
  const solvedAll = (rows ?? []).reduce((n, r) => n + r.solved, 0)

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10)
    download(`jugadores_diario_${today}.csv`, toCsv(
      ['nombre', 'correo', 'desde', 'ultima_vez', 'dias_resueltos', 'racha_actual', 'mejor_racha', 'puntos', 'rango', 'porcentaje_sin_pista', 'tiempo_medio_segundos'],
      sorted.map((r) => [r.name, r.email, isoLocal(r.first), isoLocal(r.last), r.solved, r.streak, r.best, r.points, r.rank, r.noHintPct ?? '', r.avgMs === null ? '' : Math.round(r.avgMs / 1000)]),
    ))
  }

  return (
    <>
      <h2>{x.title}</h2>
      <p className="nota">{x.note}</p>
      <div className="filtros">
        <span className="grupo"><button type="button" className="suave" onClick={load}>{x.refresh}</button></span>
        {rows?.length > 0 && <span className="grupo"><button type="button" onClick={exportCsv}>{x.csv}</button></span>}
      </div>
      {!rows && !error && <p className="vacio">{x.loading}</p>}
      {error && <p className="vacio error">{x.error}</p>}
      {rows && !rows.length && <p className="vacio">{x.empty}</p>}
      {rows?.length > 0 && (
        <>
          <div className="ficha">
            <div className="cifras">
              <div><b>{rows.length}</b><small>{x.total}</small></div>
              <div><b>{active}</b><small>{x.active}</small></div>
              <div><b>{solvedAll}</b><small>{x.solved}</small></div>
              <div><b>{(solvedAll / rows.length).toFixed(1)}</b><small>{x.avg}</small></div>
            </div>
          </div>
          <div className="filtros">
            <label>{x.sortBy}{' '}
              <select value={sort.key} onChange={(e) => setSort({ key: e.target.value, dir: -1 })}>
                {SORTS.map(([k, key]) => <option key={k} value={k}>{x[key]}</option>)}
              </select>
            </label>
            <button type="button" className="suave" onClick={() => setSort((v) => ({ ...v, dir: -v.dir }))} aria-label={x.reverse}>{sort.dir === 1 ? '▲' : '▼'}</button>
          </div>
          {sorted.map((r) => (
            <PlayerCard key={r.uid} r={r} x={x} lang={lang} date={date} open={open === r.uid} onToggle={() => setOpen(open === r.uid ? null : r.uid)} />
          ))}
        </>
      )}
    </>
  )
}

function PlayerCard({ r, x, lang, date, open, onToggle }) {
  const keys = Object.keys(r.days).sort().reverse()
  return (
    <div className="ficha jugador">
      <b className="jugador-nombre">{r.name || x.noName}</b>
      <span className="jugador-correo">{r.email} · {r.rank}</span>
      <div className="cifras">
        <div><b>{r.solved}</b><small>{x.days}</small></div>
        <div><b>{r.streak}</b><small>{x.streak}</small></div>
        <div><b>{r.points}</b><small>{x.points}</small></div>
      </div>
      <p className="nota">{x.since} {date(r.first)} · {x.last} {date(r.last)} · {x.hint} {r.noHintPct === null ? '—' : r.noHintPct + '%'} · {x.time} {r.avgMs === null ? '—' : fmtTime(r.avgMs)}</p>
      <button type="button" className="suave" onClick={onToggle} aria-expanded={open}>{open ? x.hide : x.detail}</button>
      {open && (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>{x.date}</th><th>{x.type}</th><th>{x.level}</th><th>OK</th><th>{x.tries}</th><th>{x.usedHint}</th><th>{x.time}</th><th>{x.late}</th></tr></thead>
            <tbody>
              {keys.map((k) => {
                const d = r.days[k]
                return (
                  <tr key={k}>
                    <td>{new Date(k + 'T12:00:00').toLocaleDateString(lang)}</td><td>{TYPE_NAME[d.type] ?? d.type}</td><td>{d.level}</td>
                    <td>{d.done ? x.yes : x.no}</td><td>{d.tries}</td><td>{d.hint ? x.yes : x.no}</td><td>{fmtTime(d.ms)}</td><td>{d.late ? x.yes : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
