// Avisos diarios del Diario (Web Push). Se carga solo cuando se enseña el botón de avisos.
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { VAPID_PUBLIC } from './vapid.js'

const SW_URL = '/diario-sw.js'
const SCOPE = '/diario'

export const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// Clave de la suscripción en la base de datos: huella del identificador, imposible de adivinar.
async function subId(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const key64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

// Registro propio de /diario (aparte del de la app del panel) y espera a que esté activo.
async function register() {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE })
  if (reg.active) return reg
  const sw = reg.installing || reg.waiting
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 15000)
    sw.addEventListener('statechange', () => { if (sw.state === 'activated') { clearTimeout(t); resolve() } })
  })
  return reg
}

// 'no' (no disponible) · 'bloqueado' (permiso denegado) · 'activo' · 'apagado'
export async function state() {
  if (!supported()) return 'no'
  if (Notification.permission === 'denied') return 'bloqueado'
  if (Notification.permission !== 'granted') return 'apagado'
  try {
    const reg = await navigator.serviceWorker.getRegistration(SCOPE)
    return (await reg?.pushManager.getSubscription()) ? 'activo' : 'apagado'
  } catch { return 'apagado' }
}

export async function enable() {
  if (await Notification.requestPermission() !== 'granted') return Notification.permission === 'denied' ? 'bloqueado' : 'apagado'
  const reg = await register()
  const sub = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key64(VAPID_PUBLIC) })
  const json = sub.toJSON()
  await setDoc(doc(db, 'pushSubs', await subId(sub.endpoint)), {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? b64(sub.getKey('p256dh')),
    auth: json.keys?.auth ?? b64(sub.getKey('auth')),
    at: serverTimestamp(),
  })
  return 'activo'
}

export async function disable() {
  const reg = await navigator.serviceWorker.getRegistration(SCOPE)
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await deleteDoc(doc(db, 'pushSubs', await subId(sub.endpoint))).catch(() => {})
    await sub.unsubscribe()
  }
  return 'apagado'
}
