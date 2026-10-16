import { useCallback, useEffect, useState } from 'react'
import { Timestamp, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { DAY_MS } from './stats.js'

const toDate = (ts) => (ts && ts.toDate ? ts.toDate() : null)
const MAX_RUNS = 1000
const CHUNK = 25
const cache = new Map() // periodo -> { data, at }: se lee una vez y se reutiliza al cambiar de pestaña

// Lectura única (sin escuchar en directo) de las partidas del periodo y sus escaneos.
async function loadStats(days) {
  const constraints = [orderBy('startedAt', 'desc'), limit(MAX_RUNS)]
  if (days) constraints.unshift(where('startedAt', '>=', Timestamp.fromMillis(Date.now() - days * DAY_MS)))
  const [runsSnap, gamesSnap] = await Promise.all([
    getDocs(query(collection(db, 'runs'), ...constraints)),
    getDocs(collection(db, 'games')),
  ])
  const runs = runsSnap.docs
    .map((d) => ({ id: d.id, ...d.data(), startedAt: toDate(d.data().startedAt), endedAt: toDate(d.data().endedAt) }))
    .filter((r) => r.startedAt)
  const games = Object.fromEntries(gamesSnap.docs.map((d) => [d.id, d.data()]))

  const stepsByGame = {}
  await Promise.all(
    [...new Set(runs.map((r) => r.gameId))].map(async (gameId) => {
      const snap = await getDocs(collection(db, 'games', gameId, 'steps'))
      stepsByGame[gameId] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }),
  )

  const scansByRun = {}
  for (let i = 0; i < runs.length; i += CHUNK) {
    await Promise.all(
      runs.slice(i, i + CHUNK).map(async (r) => {
        const snap = await getDocs(collection(db, 'runs', r.id, 'scans'))
        scansByRun[r.id] = snap.docs
          .map((d) => ({ stepId: d.id, at: toDate(d.data().scannedAt) }))
          .filter((s) => s.at)
      }),
    )
  }
  return { runs, games, stepsByGame, scansByRun, truncated: runs.length >= MAX_RUNS }
}

export function useStatsData(days) {
  const key = String(days ?? 'all')
  const [state, setState] = useState(() => ({ ...(cache.get(key) ?? {}), loading: !cache.has(key), error: false }))

  const load = useCallback(
    (force) => {
      if (!force && cache.has(key)) {
        setState({ ...cache.get(key), loading: false, error: false })
        return
      }
      setState((s) => ({ ...s, loading: true, error: false }))
      loadStats(days)
        .then((data) => {
          cache.set(key, { data, at: Date.now() })
          setState({ data, at: Date.now(), loading: false, error: false })
        })
        .catch(() => setState({ loading: false, error: true }))
    },
    [key, days],
  )

  useEffect(() => { load(false) }, [load])
  return { ...state, reload: () => load(true) }
}
