import { useState } from 'react'
import { useT } from '../i18n.js'
import { IDLE_MIN, fmtClock, fmtDateTime, fmtDuration, runStatus, sortSteps, timeLeft } from '../lib/runs.js'

const STAMP = {
  open: ['curso', 'statusOpen'],
  finished: ['fin', 'statusFinished'],
  timeout: ['tiempo-agotado', 'statusTimeout'],
}

const RING_R = 28
const RING_LEN = 2 * Math.PI * RING_R

// Anillo con el tiempo que queda; dentro, el tiempo transcurrido.
function Ring({ fraction, tone, label }) {
  return (
    <svg className={`anillo ${tone}`} viewBox="0 0 64 64" role="img" aria-label={label}>
      <circle className="pista" cx="32" cy="32" r={RING_R} />
      <circle
        className="progreso" cx="32" cy="32" r={RING_R}
        strokeDasharray={RING_LEN} strokeDashoffset={RING_LEN * (1 - fraction)}
      />
      <text x="32" y="36" textAnchor="middle">{label}</text>
    </svg>
  )
}

export default function RunCard({ run, game, steps = [], scans = [], now, index = 0 }) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)

  const status = runStatus(run, game, now)
  const ring = timeLeft(run, game, now)
  const [stampClass, stampKey] = STAMP[status.kind]
  const stepById = Object.fromEntries(steps.map((s) => [s.id, s]))
  const playable = sortSteps(steps.filter((s) => s.active !== false))
  const scanned = new Set(scans.map((s) => s.stepId))
  const last = scans[scans.length - 1]
  const lastLabel = last ? stepById[last.stepId]?.label ?? last.stepId : null
  const idleMin = last ? Math.floor((now - last.at.getTime()) / 60000) : Math.floor((now - run.startedAt.getTime()) / 60000)
  const clueCount = scans.filter((s) => stepById[s.stepId]?.type === 'clue').length
  const stuck = status.kind === 'open' && idleMin >= IDLE_MIN

  return (
    <button
      type="button" className={`tarjeta ${status.kind}`} style={{ '--i': Math.min(index, 8) }}
      onClick={() => setOpen((o) => !o)} aria-expanded={open}
    >
      <span className="etq">{game?.name ?? t.unknownGame}</span>
      <div className="cabecera">
        <div className="datos">
          <span className="alias">{run.alias || t.noName}</span>
          <span className="meta">
            {t.started} {fmtDateTime(run.startedAt, lang)} · {scans.length}/{playable.length || '?'} {t.steps} · {clueCount} {t.clues}
          </span>
        </div>
        <Ring fraction={ring.fraction} tone={ring.tone} label={fmtDuration(status.ms)} />
      </div>
      {playable.length > 0 && (
        <div className="rastro" aria-hidden="true">
          {playable.map((s, k) => (
            <span
              key={s.id} title={s.label} style={{ '--k': k }}
              className={`punto ${s.type} ${scanned.has(s.id) ? 'hecho' : ''}`}
            />
          ))}
        </div>
      )}
      <div className="fila meta">
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
      {status.kind === 'finished' && <span className="sello-grande" aria-hidden="true">{t.statusFinished}</span>}
      {open && (
        <div className="pasos">
          {playable.map((s) => {
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
