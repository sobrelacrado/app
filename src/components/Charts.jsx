import { useState } from 'react'
import { useT } from '../i18n.js'

// Gráficos en SVG simple: barras finas, línea de 2 px, rejilla discreta, tooltip al pasar el ratón.
const W = 720
const H = 220
const M = { l: 38, r: 14, t: 16, b: 28 }
const IW = W - M.l - M.r
const IH = H - M.t - M.b
const VERDE = 'var(--verde)'
const ARENA = '#b8ae98'

function niceTicks(max, steps = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240]) {
  const step = steps.find((s) => max / s <= 4) ?? Math.ceil(max / 4)
  const ticks = [0]
  while (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

const roundTop = (x, y, w, h, r) => {
  const rr = Math.min(r, h / 2, w / 2)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

const label = (d, lang) => d.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })

function Frame({ ticks, yMax, fmt, children }) {
  return (
    <>
      {ticks.map((tk) => {
        const y = M.t + IH - (tk / yMax) * IH
        return (
          <g key={tk}>
            <line x1={M.l} x2={W - M.r} y1={y} y2={y} style={{ stroke: '#cfc7b3', strokeWidth: 1 }} />
            <text x={M.l - 6} y={y + 4} textAnchor="end" className="eje">{fmt(tk)}</text>
          </g>
        )
      })}
      {children}
    </>
  )
}

function Tip({ x, children }) {
  return <div className="tip" style={{ left: `${(x / W) * 100}%` }}>{children}</div>
}

export function BarsPerDay({ days }) {
  const { t, lang } = useT()
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...days.map((d) => d.finished + d.other))
  const ticks = niceTicks(max)
  const yMax = ticks[ticks.length - 1]
  const band = IW / days.length
  const bw = Math.min(24, band * 0.7)
  const every = Math.ceil(days.length / 8)
  const base = M.t + IH
  const hov = hover === null ? null : days[hover]

  return (
    <div className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.perDayTitle}>
        <defs>
          <pattern id="rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={ARENA} />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#8d8064" strokeWidth="2" />
          </pattern>
        </defs>
        <Frame ticks={ticks} yMax={yMax} fmt={String}>
          {days.map((d, i) => {
            const x = M.l + band * i + (band - bw) / 2
            const h1 = (d.finished / yMax) * IH
            const h2 = (d.other / yMax) * IH
            return (
              <g key={d.key}>
                {d.finished > 0 && <path d={roundTop(x, base - h1, bw, h1, d.other ? 0 : 4)} fill={VERDE} />}
                {d.other > 0 && (
                  <path d={roundTop(x, base - h1 - h2, bw, Math.max(h2 - (d.finished ? 2 : 0), 1), 4)} fill="url(#rayado)" />
                )}
                {i % every === 0 && (
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="eje">{label(d.date, lang)}</text>
                )}
                <rect
                  x={M.l + band * i} y={M.t} width={band} height={IH} fill="transparent" tabIndex={0}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                />
              </g>
            )
          })}
        </Frame>
      </svg>
      {hov && (
        <Tip x={M.l + band * hover + band / 2}>
          <b>{label(hov.date, lang)}</b><br />
          {t.legendFinished}: {hov.finished}<br />
          {t.legendOther}: {hov.other}
        </Tip>
      )}
      <div className="leyenda">
        <span><i className="muestra" style={{ background: VERDE }} /> {t.legendFinished}</span>
        <span><i className="muestra rayada" /> {t.legendOther}</span>
      </div>
    </div>
  )
}

export function WeeklyLine({ weeks }) {
  const { t, lang } = useT()
  const [hover, setHover] = useState(null)
  const mins = weeks.map((w) => w.medianMs / 60000)
  const ticks = niceTicks(Math.max(1, ...mins))
  const yMax = ticks[ticks.length - 1]
  const xAt = (i) => (weeks.length === 1 ? M.l + IW / 2 : M.l + (IW * i) / (weeks.length - 1))
  const yAt = (v) => M.t + IH - (v / yMax) * IH
  const every = Math.ceil(weeks.length / 8)
  const pts = mins.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')
  const last = weeks.length - 1
  const fmt1 = (v) => Math.round(v)

  return (
    <div className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.weeklyTitle}>
        <Frame ticks={ticks} yMax={yMax} fmt={String}>
          {weeks.length > 1 && (
            <polyline points={pts} fill="none" stroke={VERDE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          )}
          {mins.map((v, i) => (
            <g key={weeks[i].key}>
              <circle cx={xAt(i)} cy={yAt(v)} r="4" fill={VERDE} style={{ stroke: 'var(--papel)', strokeWidth: 2 }} />
              {i % every === 0 && (
                <text x={xAt(i)} y={H - 8} textAnchor="middle" className="eje">{label(weeks[i].date, lang)}</text>
              )}
              <circle
                cx={xAt(i)} cy={yAt(v)} r="14" fill="transparent" tabIndex={0}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              />
            </g>
          ))}
          <text x={xAt(last)} y={yAt(mins[last]) - 10} textAnchor="end" className="valor">
            {fmt1(mins[last])} {t.minutes}
          </text>
        </Frame>
      </svg>
      {hover !== null && (
        <Tip x={xAt(hover)}>
          <b>{t.week} {label(weeks[hover].date, lang)}</b><br />
          {t.median}: {fmt1(mins[hover])} {t.minutes}<br />
          n = {weeks[hover].n}
        </Tip>
      )}
    </div>
  )
}
