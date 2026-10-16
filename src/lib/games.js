import { collection, doc, getCountFromServer, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { THEMES, DEFAULT_THEME } from './themes.js'

export const PUBLIC_BASE = 'https://app-sobre-lacrado.web.app'
export const STEP_TYPES = ['start', 'normal', 'clue', 'solution']
export const scanUrl = (gameId, stepId) => `${PUBLIC_BASE}/s/${gameId}/${stepId}`

// Plantilla de los expedientes: V0 inicio, V1-V6 grabaciones, Pistas y Solución.
export const EXPEDIENTE_TEMPLATE = [
  { label: 'V0 · Instrucciones', type: 'start', url: '' },
  { label: 'V1', type: 'normal', url: '' },
  { label: 'V2', type: 'normal', url: '' },
  { label: 'V3', type: 'normal', url: '' },
  { label: 'V4', type: 'normal', url: '' },
  { label: 'V5', type: 'normal', url: '' },
  { label: 'V6', type: 'normal', url: '' },
  { label: 'Pistas', type: 'clue', url: '' },
  { label: 'Solución', type: 'solution', url: '' },
]

// Caso 2 (IP-26/031, Agencia Duarte) con los enlaces reales de su lista VIDEOS.
export const CASE2 = {
  name: 'Caso 2 · IP-26/031 Agencia Duarte',
  timeLimitMinutes: 240,
  steps: [
    { label: 'V0 · Instrucciones', type: 'start', url: 'https://youtube.com/shorts/mOsqUe9iIUg' },
    { label: 'V1 · Entrevista con la clienta', type: 'normal', url: 'https://youtube.com/shorts/eI3s_kcrWJA' },
    { label: 'V2 · Llamada de la clienta', type: 'normal', url: 'https://youtube.com/shorts/y-YclpPhcEM' },
    { label: 'V3 · Vecina de Sevilla', type: 'normal', url: 'https://youtube.com/shorts/cBpGLS1573k' },
    { label: 'V4 · Terraza de Cascais', type: 'normal', url: 'https://youtube.com/shorts/8iReehXPS3g' },
    { label: 'V5 · Llamada a la inmobiliaria', type: 'normal', url: 'https://youtube.com/shorts/tlYLhXwGx8M' },
    { label: 'V6 · Nota de voz', type: 'normal', url: 'https://youtube.com/shorts/SdN_zRfwOxY' },
    { label: 'Pistas', type: 'clue', url: 'https://drive.google.com/file/d/1Olq-nqKV4XPH6NWkutmPU3w1Gh8RTf-3/view' },
    { label: 'Solución', type: 'solution', url: 'https://drive.google.com/file/d/1VwZjmTRPt5OtbFY0mVTrhFxZ_-gF4Z2W/view' },
  ],
}

// Caso 3 (23-M-014, La caja 14). El contenido está alojado en sobrelacrado.github.io: el QR pasa por la app
// (para registrar la partida) y la app redirige allí.
const C3 = 'https://sobrelacrado.github.io'
export const CASE3 = {
  name: 'Caso 3 · La caja 14 (23-M-014)',
  timeLimitMinutes: 240,
  theme: 'egipcio',
  steps: [
    { label: 'V0 · Película de presentación', type: 'start', url: `${C3}/videos/caja14-v0/` },
    { label: 'V1 · Cilindro de la Srta. Coll', type: 'normal', url: `${C3}/caja14-v1/` },
    { label: 'V2 · Cilindro del Sr. Varela', type: 'normal', url: `${C3}/caja14-v2/` },
    { label: 'ESCENA · Placas del agente', type: 'normal', url: `${C3}/escenas/caja14/` },
    { label: 'Pistas', type: 'clue', url: `${C3}/docs/caja14/pistas.pdf` },
    { label: 'Solución', type: 'solution', url: `${C3}/docs/caja14/solucion.pdf` },
  ],
}

export function isHttps(url) {
  try {
    return new URL(String(url).trim()).protocol === 'https:'
  } catch {
    return false
  }
}

// Devuelve una lista de errores { code, step? } (vacía si todo está bien).
export function validateGame({ name, timeLimitMinutes, steps }) {
  const errors = []
  if (!String(name).trim()) errors.push({ code: 'nameRequired' })
  const limit = Number(timeLimitMinutes)
  if (!Number.isInteger(limit) || limit < 5 || limit > 1440) errors.push({ code: 'limitInvalid' })
  if (!steps.length) errors.push({ code: 'noSteps' })

  const seen = new Map()
  steps.forEach((s, i) => {
    const n = i + 1
    const label = s.label.trim()
    if (!label) errors.push({ code: 'labelRequired', step: n })
    else if (seen.has(label.toLowerCase())) errors.push({ code: 'labelDuplicate', step: n })
    else seen.set(label.toLowerCase(), n)
    if (!STEP_TYPES.includes(s.type)) errors.push({ code: 'typeInvalid', step: n })
    if (s.active && !isHttps(s.url)) errors.push({ code: 'urlInvalid', step: n })
  })

  const active = steps.filter((s) => s.active)
  if (active.filter((s) => s.type === 'start').length !== 1) errors.push({ code: 'needStart' })
  if (!active.some((s) => s.type === 'solution')) errors.push({ code: 'needSolution' })
  return errors
}

// Borra documentos en lotes (Firestore admite 500 operaciones por lote).
async function deleteRefs(db, refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    refs.slice(i, i + 400).forEach((r) => batch.delete(r))
    await batch.commit()
  }
}

// Borra una partida y todos sus escaneos.
export async function deleteRun(db, runId) {
  const scans = await getDocs(collection(db, 'runs', runId, 'scans'))
  await deleteRefs(db, [...scans.docs.map((d) => d.ref), doc(db, 'runs', runId)])
}

// Cuántas partidas tiene un juego (null si no se puede saber, por ejemplo sin conexión).
export async function countGameRuns(db, gameId) {
  try {
    const snap = await getCountFromServer(query(collection(db, 'runs'), where('gameId', '==', gameId)))
    return snap.data().count
  } catch {
    return null
  }
}

// Borra un juego con sus pasos y todas sus partidas. El juego se borra el último: si algo falla a medias, se puede repetir.
export async function deleteGame(db, gameId) {
  const runs = await getDocs(query(collection(db, 'runs'), where('gameId', '==', gameId)))
  for (const r of runs.docs) await deleteRun(db, r.id)
  const steps = await getDocs(collection(db, 'games', gameId, 'steps'))
  await deleteRefs(db, [...steps.docs.map((d) => d.ref), doc(db, 'games', gameId)])
  return runs.size
}

// Guarda juego y pasos en un solo lote. Nunca borra: los pasos guardados se desactivan, no se eliminan.
export async function saveGame(db, { id, isNew, name, timeLimitMinutes, active, theme, steps }) {
  const batch = writeBatch(db)
  const game = { name: name.trim(), active, timeLimitMinutes: Number(timeLimitMinutes), theme: THEMES.includes(theme) ? theme : DEFAULT_THEME }
  batch.set(doc(db, 'games', id), isNew ? { ...game, createdAt: serverTimestamp() } : game, { merge: true })
  steps.forEach((s, i) => {
    batch.set(
      doc(db, 'games', id, 'steps', s.id),
      { label: s.label.trim(), type: s.type, url: s.url.trim(), active: s.active, order: i + 1 },
      { merge: true },
    )
  })
  await batch.commit()
}
