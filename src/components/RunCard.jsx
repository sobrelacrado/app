import { useState } from 'react'
import { useT } from '../i18n.js'
import { IDLE_MIN, fmtClock, fmtDateTime, fmtDuration, runStatus, sortSteps } from '../lib/runs.js'

const STAMP = {
  open: ['curso', 'statusOpen'],
  finished: ['fin', 'statusFinished'],
  timeout: ['tiempo-agotado', 'statusTimeout'],
}

export default function RunCard({ run, game, steps = [], scans = [], now }) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)

  const status = runStatus(run, game, now)
  const [stampClass, stampKey] = STAMP[status.kind]
  const stepById = Object.fromEntries(steps.map((s) => [s.id, s]))
  const playable = steps.filter((s) => s.active !== false)
  const last = scans[scans.length - 1]
  const lastLabel = last ? stepById[last.stepId]?.label ?? last.stepId : null
  const idleMin = last ? Math.floor((now - last.at.getTime()) / 60000) : Math.floor((now - run.startedAt.getTime()) / 60000)
  const clueCount = scans.filter((s) => stepById[s.stepId]?.type === 'clue').length
  const stuck = status.kind === 'open' && idleMin >= IDLE_MIN

  return (
    <button type="button" className="tarjeta" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
      <span className="etq">{game?.name ?? t.unknownGame}</span>
      <div className="fila">
        <span className="alias">{run.alias || t.noName}</span>
        <span className="tiempo">{fmtDuration(status.ms)}</span>
      </div>
      <div className="fila meta">
        <span>
          {t.started} {fmtDateTime(run.startedAt, lang)} · {scans.length}/{playable.length || '?'} {t.steps} · {clueCount} {t.clues}
        </span>
        <span className={`sello ${stampClass}`}>{t[stampKey]}</span>
      </div>
      {status.kind === 'open' && (
        <div className={`meta ${stuck ? 'aviso' : ''}`}>
          {lastLabel
            ? `${t.lastStep}: ${lastLabel} · ${t.ago(idleMin)}`
            : `${t.noScansYet} · ${t.ago(idleMin)}`}
          {stuck && ` · ${t.idle}`}
        </div>
      )}
      {open && (
        <div className="pasos">
          {sortSteps(playable).map((s) => {
            const hit = scans.find((x) => x.stepId === s.id)
            return (
              <div key={s.id} className={hit ? '' : 'pendiente'}>
                <span>{s.label}</span>
                <span>{hit ? fmtClock(hit.at, lang) : '—'}</span>
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
}
