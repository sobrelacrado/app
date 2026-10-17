// Cuenta de jugador y progreso del Diario en la nube. Se carga solo cuando hace falta (no pesa en la primera pantalla).
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { collection, deleteField, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { auth } from '../auth.js'
import { db } from '../firebase.js'

export const watchUser = (cb) => onAuthStateChanged(auth, cb)

export async function login() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  await signInWithPopup(auth, provider)
}
export const logout = () => signOut(auth)

const days = (uid) => collection(db, 'users', uid, 'diario')

export async function pullDays(uid) {
  const snap = await getDocs(days(uid))
  const out = {}
  snap.forEach((d) => {
    const x = d.data()
    out[d.id] = { done: !!x.done, tries: x.tries ?? 0, hint: !!x.hint, ms: x.ms ?? 0, type: x.type, level: x.level, n: x.n }
  })
  return out
}

// Guarda un día (la hora la pone el servidor). Los campos sin valor no se envían.
export function pushDay(uid, key, d) {
  const data = { done: !!d.done, tries: d.tries ?? 0, hint: !!d.hint, ms: Math.min(Math.round(d.ms ?? 0), 86400000), type: d.type, level: d.level, at: serverTimestamp() }
  if (Number.isInteger(d.n)) data.n = d.n
  return setDoc(doc(days(uid), key), data)
}

export async function deleteAll(uid) {
  const snap = await getDocs(days(uid))
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db)
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

// ---------- Mis casos ----------
const IGNORED = 'sl_casos_ignorados' // partidas que esta persona quitó de su cuenta: no se vuelven a vincular solas
const ignored = () => { try { return JSON.parse(localStorage.getItem(IGNORED)) ?? [] } catch { return [] } }

// Partidas que este móvil ya guardaba (la página del QR guarda una por juego: sl_run_<juego>).
function localRunIds() {
  const ids = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('sl_run_')) ids.push(localStorage.getItem(k))
    }
  } catch { /* sin almacenamiento */ }
  return ids.filter(Boolean)
}

// Vincula a la cuenta las partidas de este móvil que aún no tienen dueño (solo se escribe el campo uid, una vez).
export async function claimLocalRuns(uid) {
  const skip = ignored()
  for (const id of localRunIds()) {
    if (skip.includes(id)) continue
    try {
      const snap = await getDoc(doc(db, 'runs', id))
      if (snap.exists() && !snap.data().uid) await updateDoc(snap.ref, { uid })
    } catch { /* partida ajena o sin permiso: se salta */ }
  }
}

// Partidas de la cuenta con sus pasos escaneados (más recientes primero).
export async function loadCases(uid) {
  const runs = await getDocs(query(collection(db, 'runs'), where('uid', '==', uid)))
  const games = {}, steps = {}
  const getGame = async (id) => (games[id] ??= getDoc(doc(db, 'games', id)).then((d) => (d.exists() ? d.data() : null)).catch(() => null))
  const getStep = async (g, id) => (steps[g + '/' + id] ??= getDoc(doc(db, 'games', g, 'steps', id)).then((d) => (d.exists() ? d.data() : {})).catch(() => ({})))
  const out = await Promise.all(runs.docs.map(async (d) => {
    const r = d.data()
    const scansSnap = await getDocs(collection(db, 'runs', d.id, 'scans'))
    const scans = scansSnap.docs.map((s) => ({ id: s.id, at: s.data().scannedAt?.toDate?.() ?? null }))
    const stepInfo = {}
    await Promise.all(scans.map(async (s) => { const st = await getStep(r.gameId, s.id); stepInfo[s.id] = { label: st.label, type: st.type } }))
    return {
      id: d.id,
      run: { alias: r.alias, gameId: r.gameId, startedAt: r.startedAt?.toDate?.() ?? new Date(), endedAt: r.endedAt?.toDate?.() ?? null },
      game: await getGame(r.gameId),
      scans,
      steps: stepInfo,
    }
  }))
  return out.sort((a, b) => b.run.startedAt - a.run.startedAt)
}

// Quita la partida de la cuenta (no se borra: el administrador la conserva sin nombre).
export async function unlinkRun(id) {
  await updateDoc(doc(db, 'runs', id), { uid: deleteField() })
  try { localStorage.setItem(IGNORED, JSON.stringify([...new Set([...ignored(), id])])) } catch { /* sin almacenamiento */ }
}
