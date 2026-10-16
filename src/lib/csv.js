import { fmtDuration } from './runs.js'

const p = (n) => String(n).padStart(2, '0')
export const isoLocal = (d) =>
  d ? `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` : ''

// Excel ejecuta como fórmula un texto que empieza por = + - @ (el alias lo escribe el jugador).
function cell(value) {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Separador ";" y BOM UTF-8: así Excel en español lo abre bien y con tildes.
export function toCsv(header, lines) {
  return '﻿' + [header, ...lines].map((l) => l.map(cell).join(';')).join('\r\n') + '\r\n'
}

export function runsCsv(rows) {
  return toCsv(
    ['partida', 'juego', 'alias', 'inicio', 'fin', 'estado', 'tiempo_segundos', 'tiempo_mm_ss', 'pasos', 'pistas'],
    rows.map((r) => [
      r.id, r.gameName, r.alias, isoLocal(r.startedAt), isoLocal(r.endedAt), r.status,
      r.ms === null ? '' : Math.round(r.ms / 1000), r.ms === null ? '' : fmtDuration(r.ms),
      r.scans.length, r.clueCount,
    ]),
  )
}

export function scansCsv(rows) {
  return toCsv(
    ['partida', 'juego', 'alias', 'paso', 'tipo', 'hora', 'segundos_desde_inicio', 'mm_ss_desde_inicio'],
    rows.flatMap((r) =>
      r.scans.map((s) => [
        r.id, r.gameName, r.alias, s.label, s.type, isoLocal(s.at),
        s.secondsFromStart, fmtDuration(s.secondsFromStart * 1000),
      ]),
    ),
  )
}

export function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
