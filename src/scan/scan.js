import { doc, getDoc, setDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { t } from './texts.js'
import '../styles/theme.css'

const app = document.getElementById('app')
const [, , gameId, stepId] = location.pathname.split('/') // /s/<juego>/<paso>
const RUN_KEY = `sl_run_${gameId}` // un móvil = un grupo: guardamos el id de su partida

const safeGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const safeSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }

function show(html) { app.innerHTML = `<div class="logo">SOBRE LACRADO</div>${html}` }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`) }

function redirect(url) {
  if (!/^https?:\/\//i.test(url)) return show(`<p>${t.invalid}</p>`)
  location.replace(url)
}

// Espera a que el servidor confirme, pero nunca retiene al jugador más de 4 s.
const withTimeout = (p) => Promise.race([p.catch(() => {}), new Promise((r) => setTimeout(r, 4000))])

async function main() {
  if (!gameId || !stepId) return show(`<p>${t.invalid}</p>`)
  const [gameSnap, stepSnap] = await Promise.all([
    getDoc(doc(db, 'games', gameId)),
    getDoc(doc(db, 'games', gameId, 'steps', stepId)),
  ])
  if (!gameSnap.exists() || !stepSnap.exists() || stepSnap.data().active === false) {
    return show(`<p>${t.invalid}</p>`)
  }
  const game = gameSnap.data()
  const step = stepSnap.data()

  // Juego desactivado: el QR sigue llevando al contenido, pero no se registra nada.
  if (game.active === false) return redirect(step.url)

  // ¿Hay una partida en curso en este móvil?
  let runId = safeGet(RUN_KEY)
  let run = null
  if (runId) {
    const snap = await getDoc(doc(db, 'runs', runId))
    if (snap.exists()) run = snap.data()
  }
  const limitMs = (game.timeLimitMinutes ?? 240) * 60000
  const open = run && !run.endedAt && Date.now() < run.startedAt.toMillis() + limitMs

  if (!open) {
    if (step.type === 'start') return askAlias(step) // partida nueva
    return show(`<p>${t.notStarted}</p><a class="btn" href="${esc(step.url)}">${t.anyway}</a>`)
  }

  // Partida en curso: registrar el paso (un QR repetido se ignora).
  const scanRef = doc(db, 'runs', runId, 'scans', stepId)
  if (!(await getDoc(scanRef)).exists()) {
    const runRef = doc(db, 'runs', runId)
    const batch = writeBatch(db)
    batch.set(scanRef, { scannedAt: serverTimestamp() })
    if (step.type === 'solution') batch.update(runRef, { endedAt: serverTimestamp(), endStepId: stepId })
    await withTimeout(batch.commit())
  }
  redirect(step.url)
}

function askAlias(step) {
  show(`
    <h1>${t.welcome}</h1>
    <p>${t.aliasHelp}</p>
    <input id="alias" maxlength="30" placeholder="${t.aliasPlaceholder}" autocomplete="off" />
    <button id="go">${t.start}</button>`)
  document.getElementById('go').onclick = async (e) => {
    e.target.disabled = true
    const newRef = doc(collection(db, 'runs'))
    const batchRun = {
      gameId, alias: document.getElementById('alias').value.trim().slice(0, 30),
      startedAt: serverTimestamp(), endedAt: null,
    }
    try {
      await withTimeout(setDoc(newRef, batchRun))
      safeSet(RUN_KEY, newRef.id)
      await withTimeout(setDoc(doc(db, 'runs', newRef.id, 'scans', stepId), { scannedAt: serverTimestamp() }))
    } catch { /* se redirige igualmente */ }
    redirect(step.url)
  }
}

main().catch(() => show(`<p>${t.error}</p><button onclick="location.reload()">${t.retry}</button>`))
