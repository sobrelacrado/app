// Cálculos de estadísticas. Funciones puras (sin Firebase) para poder probarlas con casos conocidos.
import { IDLE_MIN, runStatus } from './runs.js'
import { bonusPoints } from './countdown.js'

export const IDLE_MS = IDLE_MIN * 60000
const DAY_MS = 86400000

export function median(values) {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)

// Una fila por partida, con su estado, tiempo y escaneos ya calculados.
export function buildRows({ runs, scansByRun, stepsByGame, games, now }) {
  return runs.map((run) => {
    const game = games[run.gameId]
    const stepById = Object.fromEntries((stepsByGame[run.gameId] ?? []).map((s) => [s.id, s]))
    const status = runStatus(run, game, now)
    const start = run.startedAt.getTime()
    const scans = (scansByRun[run.id] ?? [])
      .map((sc) => ({
        stepId: sc.stepId,
        label: stepById[sc.stepId]?.label ?? sc.stepId,
        type: stepById[sc.stepId]?.type ?? 'normal',
        at: sc.at,
        secondsFromStart: Math.round((sc.at.getTime() - start) / 1000),
      }))
      .sort((a, b) => a.at - b.at)
    const limitMs = (game?.timeLimitMinutes ?? 240) * 60000
    const countdown = game?.countdown === true
    // Terminada pasado el límite (solo en juegos que dejan seguir jugando) y bonus de tiempo posible (solo juegos con cuenta atrás, terminadas a tiempo)
    const late = status.kind === 'finished' && !!status.late
    const bonus = countdown && status.kind === 'finished' && !late ? bonusPoints(Math.floor((limitMs - status.ms) / 1000)) : null
    return {
      id: run.id,
      gameId: run.gameId,
      gameName: game?.name ?? run.gameId,
      alias: run.alias ?? '',
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      status: status.kind, // open | finished | timeout
      ms: status.kind === 'open' ? null : status.ms,
      limitMs,
      countdown,
      late,
      bonus,
      scans,
      clueCount: scans.filter((s) => s.type === 'clue').length,
    }
  })
}

export function filterRows(rows, { gameId, fromMs }) {
  return rows.filter(
    (r) => (!gameId || r.gameId === gameId) && (fromMs == null || r.startedAt.getTime() >= fromMs),
  )
}

// Resumen por juego. Las partidas aún en curso no cuentan para tiempos ni para el % de finalización.
export function summaryByGame(rows) {
  const groups = new Map()
  for (const r of rows) {
    if (!groups.has(r.gameId)) groups.set(r.gameId, { gameId: r.gameId, name: r.gameName, rows: [] })
    groups.get(r.gameId).rows.push(r)
  }
  return [...groups.values()]
    .map(({ gameId, name, rows: rs }) => {
      const finished = rs.filter((r) => r.status === 'finished')
      const timeout = rs.filter((r) => r.status === 'timeout')
      const times = finished.map((r) => r.ms)
      const closed = finished.length + timeout.length
      const onTimeRuns = finished.filter((r) => !r.late)
      return {
        gameId,
        name,
        started: rs.length,
        open: rs.length - closed,
        finished: finished.length,
        timeout: timeout.length,
        completionPct: closed ? Math.round((finished.length / closed) * 100) : null,
        medianMs: median(times),
        meanMs: mean(times),
        bestMs: times.length ? Math.min(...times) : null,
        avgClues: rs.length ? mean(rs.map((r) => r.clueCount)) : null,
        // Juegos con cuenta atrás: cuántos equipos terminan a tiempo y bonus medio posible
        countdown: rs.some((r) => r.countdown),
        onTime: onTimeRuns.length,
        notOnTime: finished.length - onTimeRuns.length + timeout.length,
        avgBonus: mean(onTimeRuns.filter((r) => r.bonus !== null).map((r) => r.bonus)),
      }
    })
    .sort((a, b) => b.started - a.started)
}

export function dayKey(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

// Partidas iniciadas por día (con las terminadas aparte), rellenando los días vacíos.
export function perDay(rows, now) {
  if (!rows.length) return []
  const first = new Date(Math.min(...rows.map((r) => r.startedAt.getTime())))
  const days = []
  const cursor = new Date(first.getFullYear(), first.getMonth(), first.getDate())
  const last = new Date(now)
  while (cursor <= last) {
    days.push({ key: dayKey(cursor), date: new Date(cursor), finished: 0, other: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  const byKey = Object.fromEntries(days.map((d) => [d.key, d]))
  for (const r of rows) {
    const d = byKey[dayKey(r.startedAt)]
    if (!d) continue
    if (r.status === 'finished') d.finished++
    else d.other++
  }
  return days
}

// Tiempo mediano de las terminadas, por semana (la semana empieza en lunes).
export function weeklyMedian(rows) {
  const weeks = new Map()
  for (const r of rows) {
    if (r.status !== 'finished') continue
    const d = new Date(r.startedAt.getFullYear(), r.startedAt.getMonth(), r.startedAt.getDate())
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const key = dayKey(d)
    if (!weeks.has(key)) weeks.set(key, { key, date: d, times: [] })
    weeks.get(key).times.push(r.ms)
  }
  return [...weeks.values()]
    .sort((a, b) => a.date - b.date)
    .map((w) => ({ key: w.key, date: w.date, medianMs: median(w.times), n: w.times.length }))
}

// Atascos: tras escanear un paso, el grupo tardó más de IDLE_MIN en escanear otro.
// En las partidas con tiempo agotado, se cuenta también la espera final y se marca el paso como "abandono".
// Las partidas aún en curso solo aportan los huecos ya cerrados.
export function stuckBySteps(rows) {
  const map = new Map()
  for (const r of rows) {
    const scans = r.scans.filter((s) => s.type !== 'optional') // las páginas opcionales no son un punto donde atascarse
    scans.forEach((cur, i) => {
      const key = `${r.gameId}|${cur.stepId}`
      if (!map.has(key)) {
        map.set(key, {
          key, gameId: r.gameId, gameName: r.gameName, stepId: cur.stepId,
          label: cur.label, type: cur.type, reached: 0, stuck: 0, abandoned: 0, waits: [],
        })
      }
      const e = map.get(key)
      e.reached++
      const next = scans[i + 1]
      let gap = null
      if (next) gap = next.at - cur.at
      else if (r.status === 'timeout') {
        gap = r.startedAt.getTime() + r.limitMs - cur.at.getTime()
        e.abandoned++
      }
      if (gap !== null && gap > IDLE_MS) {
        e.stuck++
        e.waits.push(gap)
      }
    })
  }
  return [...map.values()]
    .map(({ waits, ...e }) => ({ ...e, avgWaitMs: mean(waits) }))
    .sort((a, b) => b.stuck - a.stuck || b.abandoned - a.abandoned || b.reached - a.reached)
}

// Uso de los pasos "opcional": cuántas partidas los escanearon y cuántos escaneos sueltos hubo (una vez por móvil).
export function optionalUsage({ rows, stepsByGame, games, looseScans = [] }) {
  const out = []
  for (const [gameId, steps] of Object.entries(stepsByGame)) {
    for (const s of steps.filter((x) => x.type === 'optional' && x.active !== false)) {
      const inRuns = rows.filter((r) => r.gameId === gameId && r.scans.some((sc) => sc.stepId === s.id)).length
      const loose = looseScans.filter((l) => l.gameId === gameId && l.stepId === s.id).length
      out.push({ key: `${gameId}|${s.id}`, gameId, gameName: games[gameId]?.name ?? gameId, label: s.label, order: s.order ?? 999, inRuns, loose, total: inRuns + loose })
    }
  }
  return out.sort((a, b) => a.gameName.localeCompare(b.gameName) || a.order - b.order)
}

export { DAY_MS }
