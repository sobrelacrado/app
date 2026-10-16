import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import { pickNewRuns } from '../lib/newRuns.js'

// Aviso del sistema (el que vibra y sale arriba del móvil). En Android hay que pasar por el service worker.
async function systemNotification(title, body, tag) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body, tag, icon: '/icons/icon-192.png', badge: '/icons/favicon-32.png' })
      return
    }
  } catch { /* se prueba el método clásico */ }
  try {
    new Notification(title, { body, tag, icon: '/icons/icon-192.png' })
  } catch { /* sin permiso o sin soporte */ }
}

// Vigila las partidas nuevas mientras la app está abierta (o en segundo plano reciente).
export default function AlertWatcher({ enabled, onOpen }) {
  const { t } = useT()
  const [toasts, setToasts] = useState([])
  const gameNames = useRef(new Map())

  const gameName = useCallback(async (gameId) => {
    if (!gameNames.current.has(gameId)) {
      const snap = await getDoc(doc(db, 'games', gameId)).catch(() => null)
      gameNames.current.set(gameId, snap?.data()?.name ?? '')
    }
    return gameNames.current.get(gameId)
  }, [])

  const notify = useCallback(async (run) => {
    const game = await gameName(run.gameId)
    const body = [run.alias || t.noName, game].filter(Boolean).join(' · ')
    // Con la app a la vista basta el aviso interior; si está oculta, aviso del sistema.
    if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
      systemNotification(t.newRunTitle, body, `run-${run.id}`)
    } else {
      setToasts((list) => [...list.slice(-2), { id: run.id, body }])
    }
  }, [gameName, t])

  const notifyRef = useRef(notify)
  useEffect(() => { notifyRef.current = notify }, [notify])

  useEffect(() => {
    if (!enabled) return undefined
    const known = new Set()
    let first = true
    const q = query(collection(db, 'runs'), orderBy('startedAt', 'desc'), limit(20))
    return onSnapshot(
      q,
      (snap) => {
        const changes = snap.docChanges().map((c) => ({
          type: c.type,
          id: c.doc.id,
          alias: c.doc.data().alias ?? '',
          gameId: c.doc.data().gameId,
          startedAt: c.doc.data().startedAt?.toDate?.() ?? null,
        }))
        if (first) { // las que ya existían al abrir no avisan
          first = false
          changes.forEach((c) => known.add(c.id))
          return
        }
        pickNewRuns(known, changes, Date.now()).forEach((r) => notifyRef.current(r))
      },
      () => {},
    )
  }, [enabled])

  useEffect(() => {
    if (!toasts.length) return undefined
    const timer = setTimeout(() => setToasts((l) => l.slice(1)), 12000)
    return () => clearTimeout(timer)
  }, [toasts])

  if (!toasts.length) return null
  return (
    <div className="avisos" role="status" aria-live="polite">
      {toasts.map((x) => (
        <div className="aviso-flotante" key={x.id}>
          <div><b>{t.newRunTitle}</b><br />{x.body}</div>
          <div className="acciones">
            <button type="button" className="suave" onClick={() => { setToasts((l) => l.filter((y) => y.id !== x.id)); onOpen() }}>{t.view}</button>
            <button type="button" className="suave" aria-label={t.close} onClick={() => setToasts((l) => l.filter((y) => y.id !== x.id))}>×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
