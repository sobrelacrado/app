import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Estado compartido de la app instalable: versión nueva, botón de instalar y conexión.
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

let updateSW = null
let needRefresh = false
let installEvent = null

if (typeof window !== 'undefined') {
  // Hay que escucharlo desde el principio: el navegador lo lanza antes de que React arranque.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    emit()
  })
  window.addEventListener('online', emit)
  window.addEventListener('offline', emit)
}

export function initPwa() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true
      emit()
    },
    onRegisteredSW(_url, registration) {
      // Con la app abierta días seguidos, busca versión nueva cada hora.
      if (registration) setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
    },
  })
}

export const applyUpdate = () => updateSW?.(true)
export const useNeedRefresh = () => useSyncExternalStore(subscribe, () => needRefresh)
export const useCanInstall = () => useSyncExternalStore(subscribe, () => installEvent !== null)
export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine)

export async function promptInstall() {
  if (!installEvent) return
  installEvent.prompt()
  await installEvent.userChoice
  installEvent = null
  emit()
}
