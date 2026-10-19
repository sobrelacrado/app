// Cuenta de jugador y progreso del Diario en la nube. Se carga solo cuando hace falta (no pesa en la primera pantalla).
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { auth } from '../auth.js'
import { db } from '../firebase.js'

export const watchUser = (cb) => onAuthStateChanged(auth, cb)

// En iPhone/iPad la ventana emergente se queda colgada ("Entrando…" sin fin): ahí se entra por redirección, que ahora funciona
// porque el acceso usa la misma dirección que la web. En el resto se mantiene la ventana emergente.
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export async function login() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  if (isIOS()) await signInWithRedirect(auth, provider)
  else await signInWithPopup(auth, provider)
}
// Al volver de Google (redirección) se completa el acceso; si falla, se lanza el error.
export const finishRedirect = () => getRedirectResult(auth)
export const logout = () => signOut(auth)

const days = (uid) => collection(db, 'users', uid, 'diario')

export async function pullDays(uid) {
  const snap = await getDocs(days(uid))
  const out = {}
  snap.forEach((d) => {
    const x = d.data()
    out[d.id] = { done: !!x.done, tries: x.tries ?? 0, hint: !!x.hint, ms: x.ms ?? 0, type: x.type, level: x.level, n: x.n, ...(x.late ? { late: true } : {}) }
  })
  return out
}

// Guarda un día (la hora la pone el servidor). Los campos sin valor no se envían.
export function pushDay(uid, key, d) {
  const data = { done: !!d.done, tries: d.tries ?? 0, hint: !!d.hint, ms: Math.min(Math.round(d.ms ?? 0), 86400000), type: d.type, level: d.level, at: serverTimestamp() }
  if (Number.isInteger(d.n)) data.n = d.n
  if (d.late) data.late = true // resuelto desde el archivo: no suma racha y da la mitad de puntos
  return setDoc(doc(days(uid), key), data)
}

// ---------- Retos de nivel (uno por fecha, aparte de los días del Diario) ----------
const retosCol = (uid) => collection(db, 'users', uid, 'retos')
export async function pullRetos(uid) {
  const snap = await getDocs(retosCol(uid))
  const out = {}
  snap.forEach((d) => {
    const x = d.data()
    out[d.id] = { i: x.i, done: !!x.done, tries: x.tries ?? 0, hint: !!x.hint, ms: x.ms ?? 0, type: x.type, level: x.level }
  })
  return out
}
export function pushReto(uid, key, d) {
  return setDoc(doc(retosCol(uid), key), { i: d.i, done: !!d.done, tries: d.tries ?? 0, hint: !!d.hint, ms: Math.min(Math.round(d.ms ?? 0), 86400000), type: d.type, level: d.level, at: serverTimestamp() })
}

// ---------- Cuaderno de detective (privado: solo lo lee su dueño) ----------
const cuadernosCol = (uid) => collection(db, 'users', uid, 'cuadernos')
export async function loadNotebook(uid, gameId) {
  const snap = await getDoc(doc(cuadernosCol(uid), gameId))
  if (!snap.exists()) return { text: '', suspects: [] }
  const x = snap.data()
  return { text: x.text ?? '', suspects: Array.isArray(x.suspects) ? x.suspects : [] }
}
export const saveNotebook = (uid, gameId, nb) =>
  setDoc(doc(cuadernosCol(uid), gameId), { text: String(nb.text).slice(0, 5000), suspects: nb.suspects.slice(0, 12).map((s) => ({ n: String(s.n).slice(0, 40), st: s.st })), at: serverTimestamp() })
export const deleteNotebook = (uid, gameId) => deleteDoc(doc(cuadernosCol(uid), gameId))

// ---------- Grupos de amigos (ranking semanal) ----------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0, O, 1 ni I: no se confunden al dictarlos
const MAX_GROUPS = 5, MAX_MEMBERS = 20
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
const groupRef = (code) => doc(db, 'groups', code)
const myGroupRef = (uid, code) => doc(db, 'users', uid, 'grupos', code)

// Los grupos de esta persona (lista personal; el nombre se copia al unirse).
export async function myGroups(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'grupos'))
  return snap.docs.map((d) => ({ code: d.id, name: d.data().name })).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
async function ensureRoom(uid) { if ((await myGroups(uid)).length >= MAX_GROUPS) throw new Error('limit') }

export async function createGroup(uid, name, alias) {
  await ensureRoom(uid)
  for (let i = 0; i < 6; i++) {
    const code = newCode()
    if ((await getDoc(groupRef(code))).exists()) continue
    const batch = writeBatch(db)
    batch.set(groupRef(code), { name: name.slice(0, 40), owner: uid, at: serverTimestamp() })
    batch.set(doc(groupRef(code), 'members', uid), { name: alias.slice(0, 30), at: serverTimestamp() })
    batch.set(myGroupRef(uid, code), { name: name.slice(0, 40), at: serverTimestamp() })
    await batch.commit()
    return code
  }
  throw new Error('code')
}

export async function joinGroup(uid, rawCode, alias) {
  const code = String(rawCode).toUpperCase().trim()
  if ((await myGroups(uid)).some((g) => g.code === code)) throw new Error('already')
  await ensureRoom(uid)
  const g = await getDoc(groupRef(code))
  if (!g.exists()) throw new Error('nogroup')
  const batch = writeBatch(db)
  batch.set(doc(groupRef(code), 'members', uid), { name: alias.slice(0, 30), at: serverTimestamp() })
  batch.set(myGroupRef(uid, code), { name: g.data().name, at: serverTimestamp() })
  await batch.commit()
  // el tope de 20 solo se puede mirar una vez dentro (antes no se pueden contar los miembros): si se pasó, se sale
  if ((await getDocs(collection(groupRef(code), 'members'))).size > MAX_MEMBERS) { await leaveGroup(uid, code); throw new Error('full') }
  return code
}

// Grupo con sus miembros y los puntos de las semanas pedidas. Si el grupo ya no existe o te echaron, lanza 'gone'.
export async function loadGroup(code, weeks) {
  const g = await getDoc(groupRef(code)).catch(() => null)
  if (!g?.exists()) throw new Error('gone')
  let members, mods, scores
  try {
    members = await getDocs(collection(groupRef(code), 'members'))
    mods = await getDocs(collection(groupRef(code), 'mods'))
    scores = await getDocs(query(collection(groupRef(code), 'scores'), where('week', 'in', weeks)))
  } catch (e) { throw new Error(e?.code === 'permission-denied' ? 'gone' : 'error') }
  const by = {}
  scores.forEach((d) => { const x = d.data(); (by[x.week] ??= {})[x.uid] = { pts: x.pts, solved: x.solved, streak: x.streak } })
  return {
    group: { name: g.data().name, owner: g.data().owner },
    members: members.docs.map((d) => ({ uid: d.id, name: d.data().name })),
    mods: mods.docs.map((d) => d.id),
    scores: by,
  }
}

// Puntos de la semana de esta persona en un grupo (los calcula su móvil; las reglas ponen un tope).
export const pushScore = (uid, code, week, s) =>
  setDoc(doc(groupRef(code), 'scores', `${week}_${uid}`), { uid, week, pts: Math.min(s.pts, 4000), solved: Math.min(s.solved, 14), streak: Math.min(s.streak, 9999), at: serverTimestamp() })

const removeScores = async (code, uid) => {
  const mine = await getDocs(query(collection(groupRef(code), 'scores'), where('uid', '==', uid))).catch(() => null)
  await Promise.all((mine?.docs ?? []).map((d) => deleteDoc(d.ref).catch(() => {})))
}
// Mensajes del chat de una persona en un grupo (cada quien puede borrar los suyos; el creador, los de cualquiera).
const removeMessages = async (code, uid) => {
  const mine = await getDocs(query(collection(groupRef(code), 'messages'), where('uid', '==', uid))).catch(() => null)
  await Promise.all((mine?.docs ?? []).map((d) => deleteDoc(d.ref).catch(() => {})))
}
export async function leaveGroup(uid, code) {
  await removeMessages(code, uid)
  await deleteDoc(doc(groupRef(code), 'mods', uid)).catch(() => {})
  await removeScores(code, uid)
  await deleteDoc(doc(groupRef(code), 'members', uid))
  await deleteDoc(myGroupRef(uid, code))
}
export const forgetGroup = (uid, code) => deleteDoc(myGroupRef(uid, code)) // el grupo ya no existe o te echaron: se quita de tu lista
export async function removeMember(code, uid) { // solo el creador
  await removeMessages(code, uid)
  await deleteDoc(doc(groupRef(code), 'mods', uid)).catch(() => {})
  await removeScores(code, uid)
  await deleteDoc(doc(groupRef(code), 'members', uid))
}
export async function deleteGroup(uid, code) { // solo el creador: se lleva a todos los miembros, sus puntos y el chat
  const chat = await getDocs(collection(groupRef(code), 'messages'))
  await Promise.all(chat.docs.map((d) => deleteDoc(d.ref)))
  const mods = await getDocs(collection(groupRef(code), 'mods'))
  await Promise.all(mods.docs.map((d) => deleteDoc(d.ref)))
  const scores = await getDocs(collection(groupRef(code), 'scores'))
  await Promise.all(scores.docs.map((d) => deleteDoc(d.ref)))
  const members = await getDocs(collection(groupRef(code), 'members'))
  await Promise.all(members.docs.filter((d) => d.id !== uid).map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(groupRef(code), 'members', uid))
  await deleteDoc(groupRef(code))
  await deleteDoc(myGroupRef(uid, code))
}

// ---------- Chat del grupo ----------
const MAX_TEXT = 300, LAST_MESSAGES = 100
const SEEN = 'sl_chat_visto' // cuándo abrió cada chat esta persona (solo en su móvil), para el puntito de mensajes nuevos
const seenMap = () => { try { return JSON.parse(localStorage.getItem(SEEN)) ?? {} } catch { return {} } }
export const markChatSeen = (code) => { try { localStorage.setItem(SEEN, JSON.stringify({ ...seenMap(), [code]: Date.now() })) } catch { /* sin almacenamiento */ } }

// Mensajes en directo (los últimos 100, del más antiguo al más nuevo). Devuelve la función para dejar de escuchar.
export function watchMessages(code, onData, onError) {
  const q = query(collection(groupRef(code), 'messages'), orderBy('at', 'desc'), limit(LAST_MESSAGES))
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => {
      const x = d.data({ serverTimestamps: 'estimate' })
      return { id: d.id, uid: x.uid, name: x.name, text: x.text, ms: x.at?.toMillis?.() ?? Date.now() }
    }).reverse())
  }, onError)
}
export const sendMessage = (uid, code, name, text) =>
  setDoc(doc(collection(groupRef(code), 'messages')), { uid, name, text: String(text).trim().slice(0, MAX_TEXT), at: serverTimestamp() })
export const deleteMessage = (code, id) => deleteDoc(doc(groupRef(code), 'messages', id))
// El creador nombra (on = true) o quita moderadores del chat.
export const setMod = (code, uid, on) => (on ? setDoc(doc(groupRef(code), 'mods', uid), { at: serverTimestamp() }) : deleteDoc(doc(groupRef(code), 'mods', uid)))
// Grupos con mensajes de otras personas que esta persona aún no ha visto.
export async function unreadGroups(uid, groups) {
  const seen = seenMap()
  const out = []
  await Promise.all(groups.map(async (g) => {
    try {
      const snap = await getDocs(query(collection(groupRef(g.code), 'messages'), orderBy('at', 'desc'), limit(10)))
      if (snap.docs.some((d) => d.data().uid !== uid && (d.data().at?.toMillis?.() ?? 0) > (seen[g.code] ?? 0))) out.push(g.code)
    } catch { /* sin permiso o sin red: no se avisa */ }
  }))
  return out
}

// Perfil del jugador (nombre y correo de su cuenta de Google) para que el creador sepa quién juega. Se actualiza "last" en cada visita.
export async function saveProfile(u) {
  const ref = doc(db, 'users', u.uid)
  const data = { name: String(u.displayName ?? '').slice(0, 120), email: u.email ?? '', last: serverTimestamp() }
  // Primero se mira si existe: actualizar un perfil que no existe lo rechazan las reglas (permission-denied), no da not-found.
  if ((await getDoc(ref)).exists()) await updateDoc(ref, data)
  else await setDoc(ref, { ...data, first: serverTimestamp() })
}

// ---------- Valoración de los casos (privada: solo la leen su autor y el creador) ----------
export async function loadRatings(uid) {
  const snap = await getDocs(query(collection(db, 'valoraciones'), where('uid', '==', uid)))
  const out = {}
  snap.forEach((d) => { const x = d.data(); out[x.gameId] = { stars: x.stars, comment: x.comment ?? '' } })
  return out
}
// Una por persona y caso; runId es la partida terminada que lo permite (lo comprueban las reglas).
export const saveRating = (uid, gameId, runId, stars, comment) =>
  setDoc(doc(db, 'valoraciones', `${uid}_${gameId}`), { uid, gameId, runId, stars, comment: String(comment).trim().slice(0, 300), at: serverTimestamp() })
export const deleteRating = (uid, gameId) => deleteDoc(doc(db, 'valoraciones', `${uid}_${gameId}`))

export async function deleteAll(uid) {
  await deleteDoc(doc(db, 'users', uid)).catch(() => {}) // el perfil (nombre y correo) también se borra
  const rated = await getDocs(query(collection(db, 'valoraciones'), where('uid', '==', uid))).catch(() => null)
  await Promise.all((rated?.docs ?? []).map((d) => deleteDoc(d.ref).catch(() => {})))
  // grupos de amigos: si eres el creador se borra el grupo; si no, sales de él
  for (const g of await myGroups(uid).catch(() => [])) {
    try {
      const s = await getDoc(groupRef(g.code))
      if (s.exists() && s.data().owner === uid) await deleteGroup(uid, g.code)
      else if (s.exists()) await leaveGroup(uid, g.code)
    } catch { /* se sigue con el resto */ }
  }
  const docs = [...(await getDocs(days(uid))).docs, ...(await getDocs(retosCol(uid))).docs, ...(await getDocs(cuadernosCol(uid))).docs, ...(await getDocs(collection(db, 'users', uid, 'grupos'))).docs]
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db)
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
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
