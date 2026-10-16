import { useMemo, useState } from 'react'
import { useT } from '../i18n.js'
import { useStatsData } from '../lib/loadStats.js'
import { download, runsCsv, scansCsv } from '../lib/csv.js'
import { fmtClock, fmtDateTime, fmtDuration } from '../lib/runs.js'
import { buildRows, filterRows, perDay, stuckBySteps, summaryByGame, weeklyMedian } from '../lib/stats.js'
import { themeOf } from '../lib/themes.js'
import { BarsPerDay, WeeklyLine } from './Charts.jsx'

const PERIODS = [[7, 'days7'], [30, 'days30'], [90, 'days90'], [null, 'allTime']]
const TYPE_KEY = { start: 'typeStart', clue: 'typeClue', normal: 'typeNormal', solution: 'typeSolution' }
const STATUS_KEY = { open: 'statusOpen', finished: 'statusFinished', timeout: 'statusTimeout' }

const minutes = (ms) => (ms === null ? '—' : fmtDuration(ms))

export default function Stats() {
  const { t, lang } = useT()
  const [gameId, setGameId] = useState('')
  const [days, setDays] = useState(30)
  const [table, setTable] = useState({ bars: false, weekly: false })
  const [moreFigures, setMoreFigures] = useState(false)
  const [sort, setSort] = useState({ key: 'startedAt', dir: -1 })
  const { data, at, loading, error, reload } = useStatsData(days)

  const rows = useMemo(
    () => (data ? buildRows({ ...data, now: Date.now() }) : []),
    [data],
  )
  const filtered = useMemo(() => filterRows(rows, { gameId }), [rows, gameId])
  const summary = useMemo(() => summaryByGame(filtered), [filtered])
  const dayData = useMemo(() => perDay(filtered, Date.now()), [filtered])
  const weeks = useMemo(() => weeklyMedian(filtered), [filtered])
  const stuck = useMemo(() => stuckBySteps(filtered).filter((s) => s.reached > 0), [filtered])
  const multiGame = summary.length > 1

  const sorted = useMemo(() => {
    const val = (r) => ({
      startedAt: r.startedAt.getTime(), alias: r.alias.toLowerCase(), game: r.gameName.toLowerCase(),
      status: r.status, ms: r.ms ?? -1, steps: r.scans.length, clues: r.clueCount,
    })[sort.key]
    return [...filtered].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir)
  }, [filtered, sort])

  const sortBy = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: -1 }))
  const th = (k, label) => (
    <th key={k}><button type="button" className="suave" onClick={() => sortBy(k)}>
      {label}{sort.key === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
    </button></th>
  )

  const today = new Date().toISOString().slice(0, 10)
  const toggle = (k) => setTable((s) => ({ ...s, [k]: !s[k] }))

  return (
    <>
      <div className="filtros">
        <label>
          {t.game}{' '}
          <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
            <option value="">{t.allGames}</option>
            {Object.entries(data?.games ?? {}).map(([id, g]) => <option key={id} value={id}>{g.name}</option>)}
          </select>
        </label>
        <span className="grupo">
          {t.period}{' '}
          {PERIODS.map(([d, key]) => (
            <button key={key} type="button" className={`suave ${d === days ? 'activo' : ''}`} onClick={() => setDays(d)}>
              {t[key]}
            </button>
          ))}
        </span>
        <span className="grupo">
          {at && <small>{t.updatedAt} {fmtClock(new Date(at), lang)}</small>}
          <button type="button" className="suave" onClick={reload} disabled={loading}>{t.refresh}</button>
        </span>
      </div>

      {loading && !data && <p className="vacio">{t.loading}</p>}
      {error && <p className="vacio error">{t.loadError}</p>}
      {data?.truncated && <p className="error">{t.truncated}</p>}
      {data && !loading && !filtered.length && <p className="vacio">{t.noData}</p>}

      {filtered.length > 0 && (
        <>
          <h2>{t.summary}</h2>
          {summary.map((s) => (
            <div className={`ficha tema-${themeOf(data.games[s.gameId])}`} key={s.gameId}>
              <span className="etq">{s.name}</span>
              <div className="cifras">
                <div><b>{s.started}</b><small>{t.started2}</small></div>
                <div><b>{s.finished}</b><small>{t.finished2}</small></div>
                <div><b>{s.completionPct === null ? '—' : `${s.completionPct}%`}</b><small>{t.completion}</small></div>
                <div><b>{minutes(s.medianMs)}</b><small>{t.median}</small></div>
              </div>
              {moreFigures && (
                <div className="cifras">
                  <div><b>{s.timeout}</b><small>{t.timedOut2}</small></div>
                  <div><b>{s.open}</b><small>{t.inProgress2}</small></div>
                  <div><b>{minutes(s.meanMs)}</b><small>{t.average}</small></div>
                  <div><b>{minutes(s.bestMs)}</b><small>{t.best}</small></div>
                  <div><b>{s.avgClues === null ? '—' : s.avgClues.toFixed(1)}</b><small>{t.cluesAvg}</small></div>
                </div>
              )}
              <button type="button" className="suave" onClick={() => setMoreFigures((v) => !v)}>
                {moreFigures ? t.showLess : t.showMore}
              </button>
            </div>
          ))}

          <details className="capa"><summary>{t.evolution}</summary><div className="capa-cuerpo">
          <div className="encabezado-grafico">
            <h3>{t.perDayTitle}</h3>
            <button type="button" className="suave" onClick={() => toggle('bars')}>{table.bars ? t.viewChart : t.viewTable}</button>
          </div>
          {table.bars ? (
            <table className="tabla"><thead><tr><th>{t.date}</th><th>{t.legendFinished}</th><th>{t.legendOther}</th></tr></thead>
              <tbody>{dayData.map((d) => (
                <tr key={d.key}><td>{d.date.toLocaleDateString(lang)}</td><td>{d.finished}</td><td>{d.other}</td></tr>
              ))}</tbody></table>
          ) : <BarsPerDay days={dayData} />}

          {weeks.length > 0 && (
            <>
              <div className="encabezado-grafico">
                <h3>{t.weeklyTitle}</h3>
                <button type="button" className="suave" onClick={() => toggle('weekly')}>{table.weekly ? t.viewChart : t.viewTable}</button>
              </div>
              {table.weekly ? (
                <table className="tabla"><thead><tr><th>{t.week}</th><th>{t.median}</th><th>n</th></tr></thead>
                  <tbody>{weeks.map((w) => (
                    <tr key={w.key}><td>{w.date.toLocaleDateString(lang)}</td><td>{minutes(w.medianMs)}</td><td>{w.n}</td></tr>
                  ))}</tbody></table>
              ) : <WeeklyLine weeks={weeks} />}
            </>
          )}

          </div></details>
          <details className="capa"><summary>{t.stuckTitle}</summary><div className="capa-cuerpo">
          <p className="nota">{t.stuckHelp}</p>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr>
                {multiGame && <th>{t.game}</th>}
                <th>{t.step}</th><th>{t.type}</th><th>{t.reached}</th><th>{t.stuck}</th><th>{t.avgWait}</th><th>{t.abandoned}</th>
              </tr></thead>
              <tbody>{stuck.map((s) => (
                <tr key={s.key}>
                  {multiGame && <td>{s.gameName}</td>}
                  <td>{s.label}</td><td>{t[TYPE_KEY[s.type]] ?? s.type}</td><td>{s.reached}</td>
                  <td className={s.stuck ? 'aviso' : ''}>{s.stuck}</td>
                  <td>{s.avgWaitMs === null ? '—' : fmtDuration(s.avgWaitMs)}</td>
                  <td>{s.abandoned}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          </div></details>
          <details className="capa"><summary>{t.runsTitle}</summary><div className="capa-cuerpo">
          <div className="tabla-scroll">
            <table className="tabla">
              <thead><tr>
                {th('startedAt', t.date)}{th('alias', t.alias)}{th('game', t.game)}
                {th('status', t.status)}{th('ms', t.time)}{th('steps', t.steps)}{th('clues', t.clues)}
              </tr></thead>
              <tbody>{sorted.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.startedAt, lang)}</td><td>{r.alias || t.noName}</td><td>{r.gameName}</td>
                  <td>{t[STATUS_KEY[r.status]]}</td><td>{minutes(r.ms)}</td><td>{r.scans.length}</td><td>{r.clueCount}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div className="exportar">
            <button type="button" onClick={() => download(`partidas_${today}.csv`, runsCsv(sorted))}>{t.exportRuns}</button>
            <button type="button" onClick={() => download(`escaneos_${today}.csv`, scansCsv(sorted))}>{t.exportScans}</button>
          </div>
          </div></details>
        </>
      )}
    </>
  )
}
