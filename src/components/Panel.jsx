import { useT } from '../i18n.js'
import { runStatus } from '../lib/runs.js'
import { useGames, useNow, useRuns, useScans } from '../lib/hooks.js'
import RunCard from './RunCard.jsx'

export default function Panel() {
  const { t } = useT()
  const now = useNow()
  const { runs, loading, error } = useRuns()
  const { games, steps } = useGames(runs)
  const scans = useScans(runs)

  if (loading) return <p className="vacio">{t.loading}</p>
  if (error) return <p className="vacio error">{t.loadError}</p>

  const isOpen = (r) => runStatus(r, games[r.gameId], now).kind === 'open'
  const running = runs.filter(isOpen)
  const recent = runs.filter((r) => !isOpen(r))

  const render = (r, i) => (
    <RunCard key={r.id} index={i} run={r} game={games[r.gameId]} steps={steps[r.gameId]} scans={scans[r.id]} now={now} />
  )

  return (
    <>
      <h2 className={running.length ? 'en-directo' : ''}>{t.running} ({running.length})</h2>
      {running.length ? running.map(render) : <p className="vacio">{t.noRunning}</p>}
      <h2>{t.recent}</h2>
      {recent.length ? recent.map(render) : <p className="vacio">{t.noRecent}</p>}
    </>
  )
}
