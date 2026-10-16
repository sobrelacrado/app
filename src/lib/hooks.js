import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase.js'

const toDate = (ts) => (ts && ts.toDate ? ts.toDate() : null)

// Reloj que se actualiza cada segundo (para el tiempo transcurrido en directo).
export function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// Últimas 50 partidas, en directo.
export function useRuns() {
  const [state, setState] = useState({ runs: [], loading: true, error: false })
  useEffect(() => {
    const q = query(collection(db, 'runs'), orderBy('startedAt', 'desc'), limit(50))
    return onSnapshot(
      q,
      (snap) => {
        const runs = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            startedAt: toDate(d.data().startedAt),
            endedAt: toDate(d.data().endedAt),
          }))
          .filter((r) => r.startedAt)
        setState({ runs, loading: false, error: false })
      },
      () => setState({ runs: [], loading: false, error: true }),
    )
  }, [])
  return state
}

// Juegos (nombre y límite) y pasos de cada juego que aparece en las partidas. Se leen una vez.
export function useGames(runs) {
  const [games, setGames] = useState({})
  const [steps, setSteps] = useState({})
  const loaded = useRef(new Set())

  useEffect(() => {
    getDocs(collection(db, 'games'))
      .then((snap) => setGames(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    for (const gameId of new Set(runs.map((r) => r.gameId))) {
      if (loaded.current.has(gameId)) continue
      loaded.current.add(gameId)
      getDocs(collection(db, 'games', gameId, 'steps'))
        .then((snap) =>
          setSteps((s) => ({ ...s, [gameId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })),
        )
        .catch(() => loaded.current.delete(gameId))
    }
  }, [runs])

  return { games, steps }
}

// Escaneos de cada partida: en directo las que siguen abiertas, una sola lectura las cerradas.
export function useScans(runs) {
  const [scans, setScans] = useState({})
  const subs = useRef(new Map())

  useEffect(() => {
    const ids = new Set(runs.map((r) => r.id))
    for (const r of runs) {
      const live = !r.endedAt
      const cur = subs.current.get(r.id)
      if (cur && cur.live === live) continue
      cur?.unsub()
      const col = collection(db, 'runs', r.id, 'scans')
      const apply = (snap) =>
        setScans((s) => ({
          ...s,
          [r.id]: snap.docs
            .map((d) => ({ stepId: d.id, at: toDate(d.data().scannedAt) }))
            .filter((x) => x.at)
            .sort((a, b) => a.at - b.at),
        }))
      if (live) {
        subs.current.set(r.id, { live, unsub: onSnapshot(col, apply, () => {}) })
      } else {
        let cancelled = false
        getDocs(col).then((snap) => !cancelled && apply(snap)).catch(() => {})
        subs.current.set(r.id, { live, unsub: () => { cancelled = true } })
      }
    }
    for (const [id, s] of subs.current) {
      if (!ids.has(id)) { s.unsub(); subs.current.delete(id) }
    }
  }, [runs])

  useEffect(() => () => {
    for (const s of subs.current.values()) s.unsub()
    subs.current.clear()
  }, [])

  return scans
}
