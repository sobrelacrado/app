import { addDoc, doc, getDoc, setDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../firebase.js'
import { t } from './texts.js'
import { alertsDue, bonusPoints, fmtClock, remainingSec, scene, sky } from '../lib/countdown.js'
import '../styles/theme.css'
import './scan.css'

const app = document.getElementById('app')
const [, , gameId, stepId] = location.pathname.split('/') // /s/<juego>/<paso>  (o /s/<juego>/tiempo: la cuenta atrás sola)
const RUN_KEY = `sl_run_${gameId}` // un móvil = un grupo: guardamos el id de su partida
const MAX_AFTER_MS = 12 * 3600000 // en juegos que dejan seguir tras agotar el tiempo, la partida se da por abandonada a las 12 h (igual que en las reglas)

const safeGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const safeSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }

// Aspecto por juego: de momento solo el hotel (caso 5) cambia la página del jugador; los demás juegos se ven como siempre.
let BRAND = 'SOBRE LACRADO'
function applyTheme(game) {
  if (game.theme !== 'hotel') return
  document.body.classList.add('tema-hotel')
  BRAND = 'GRAN HOTEL MIRAMAR'
  HOTEL = true
}
// En el hotel el inicio y la acusación solo enseñan el reloj y el resumen: sin botón que lleve a otra página.
let HOTEL = false
const nextOf = (step) => (HOTEL ? null : step.url)
// Caso 5: en la pantalla del reloj del QR de inicio, botón al vídeo de instrucciones (pestaña nueva; el reloj no se para)
const INSTRUCTIONS_URL = 'https://sobrelacrado.github.io/c5/instrucciones/'
const videoOf = (step) => (HOTEL && step.type === 'start' ? INSTRUCTIONS_URL : null)

function show(html) { app.className = 'hoja'; app.removeAttribute('style'); document.body.removeAttribute('style'); app.innerHTML = `<div class="logo">${BRAND}</div>${html}` }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`) }

function redirect(url) {
  if (!/^https?:\/\//i.test(url)) return show(`<p>${t.invalid}</p>`)
  location.replace(url)
}

// Espera a que el servidor confirme, pero nunca retiene al jugador más de 4 s.
const withTimeout = (p) => Promise.race([p.catch(() => {}), new Promise((r) => setTimeout(r, 4000))])

// Datos de una partida en forma sencilla (milisegundos). La hora de inicio se guarda también en el móvil por si luego falla la conexión.
function runInfo(id, data) {
  const startMs = data.startedAt ? data.startedAt.toMillis() : Number(safeGet(`sl_start_${id}`)) || Date.now()
  safeSet(`sl_start_${id}`, String(startMs))
  return { id, alias: data.alias ?? '', startMs, endedMs: data.endedAt ? data.endedAt.toMillis() : null }
}

async function readRun(id) {
  const snap = await getDoc(doc(db, 'runs', id))
  return snap.exists() ? runInfo(id, snap.data({ serverTimestamps: 'estimate' })) : null
}

// Cielo de la cuenta atrás (lienzo 300×140, horizonte en y=100): estrellas, luna que se esconde y sol que sale.
const ESTRELLAS = [[30, 20], [70, 50], [150, 14], [190, 44], [230, 24], [265, 60], [120, 70], [250, 90], [20, 80]]
const SKY_SVG = `
  <svg class="cuenta-cielo" viewBox="0 0 300 140" aria-hidden="true" focusable="false">
    <defs><clipPath id="cielo"><rect x="0" y="0" width="300" height="100"/></clipPath></defs>
    <g id="estrellas" fill="#FFF1E2">${ESTRELLAS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>
    <g clip-path="url(#cielo)">
      <g id="sol">
        <g stroke="#F2685B" stroke-width="3" stroke-linecap="round">
          <path d="M0 -34V-24M24 -24L17 -17M34 0H24M-24 -24L-17 -17M-34 0H-24"/>
        </g>
        <circle r="18" fill="#FFF3C4" stroke="#F2685B" stroke-width="3"/>
      </g>
      <g id="luna">
        <circle r="16" fill="#FFF1E2"/>
        <circle cx="7" cy="-4" r="13" id="luna-sombra" fill="#14213D"/>
      </g>
    </g>
    <path d="M0 100 Q40 90 80 98 T160 96 T240 99 T300 94 V140 H0 Z" fill="#0B1226" opacity=".6"/>
  </svg>`

// `next` = dirección a la que lleva el botón (o null). El reloj sale de la hora de inicio guardada, nunca de un contador propio.
function timeScreen({ game, run, title, next, video = null }) {
  const limitMin = game.timeLimitMinutes ?? 240
  const ended = run.endedMs != null
  app.className = 'hoja cuenta'
  app.innerHTML = `
    <div class="logo">${BRAND}</div>
    ${SKY_SVG}
    ${title ? `<h1>${esc(title)}</h1>` : ''}
    <p class="cuenta-equipo">${esc(run.alias || '')}</p>
    <div class="cuenta-reloj" id="cr" role="timer"></div>
    <p class="cuenta-texto" id="ct"></p>
    <p class="cuenta-bonus" id="cb" hidden></p>
    <p class="cuenta-aviso" id="ca" role="status" aria-live="polite" hidden></p>
    ${ended && BRAND !== 'SOBRE LACRADO' ? '<div class="sl-sello" aria-hidden="true">SL</div>' : ''}
    ${next ? `<a class="boton cuenta-boton" href="${esc(next)}">${t.continue}</a>` : ''}
    ${video ? `<a class="boton cuenta-boton" href="${esc(video)}" target="_blank" rel="noopener">${t.watchInstructions}</a>` : ''}`
  const $ = (id) => document.getElementById(id)
  const given = []
  const firstSeen = remainingSec(run.startMs, limitMin, Date.now())

  const paint = () => {
    const now = ended ? run.endedMs : Date.now()
    const rem = remainingSec(run.startMs, limitMin, now)
    const progress = 1 - rem / (limitMin * 60)
    const { bg, ink } = sky(progress)
    document.body.style.background = bg
    document.body.style.color = ink
    app.style.color = ink
    const sc = scene(progress)
    $('luna').setAttribute('transform', `translate(${sc.moon.x} ${sc.moon.y})`)
    $('luna-sombra').setAttribute('fill', bg) // la sombra de la luna es el propio cielo: queda en cuarto creciente
    $('sol').setAttribute('transform', `translate(${sc.sun.x} ${sc.sun.y})`)
    $('estrellas').setAttribute('opacity', String(sc.stars))
    if (ended) {
      $('cr').textContent = fmtClock(Math.floor((run.endedMs - run.startMs) / 1000))
      $('ct').textContent = rem >= 0 ? `${t.usedTime} · ${t.leftOver} ${fmtClock(rem)}` : `${t.usedTime} · ${t.lateEnd}`
      if (HOTEL) {
        $('cb').hidden = false
        $('cb').textContent = `${t.bonusMsg(bonusPoints(rem))} ${t.bonusNote}`
      }
      return
    }
    $('cr').classList.toggle('amanece', rem <= 0)
    if (rem > 0) {
      $('cr').textContent = fmtClock(rem)
      $('ct').textContent = t.timeLeft
    } else {
      $('cr').textContent = t.dawn
      $('ct').textContent = `${t.dawnHelp} (${t.overtime} ${fmtClock(rem)})`
    }
    for (const m of alertsDue(rem, given, firstSeen)) {
      given.push(m)
      const a = $('ca')
      a.hidden = false
      a.textContent = t.alertMsg(m)
      try { navigator.vibrate?.([200, 100, 200]) } catch { /* sin vibración */ }
    }
  }
  paint()
  if (!ended) setInterval(paint, 1000)
}

// Página `/s/<juego>/tutorial`: tutorial animado de plegado de los sobres. No lee ni escribe la partida (el reloj sigue como esté).
async function tutorialRoute() {
  const gameSnap = await getDoc(doc(db, 'games', gameId))
  if (!gameSnap.exists()) return show(`<p>${t.invalid}</p>`)
  applyTheme(gameSnap.data())
  const { tutorialPage } = await import('./tutorial.js')
  tutorialPage({ app, brand: BRAND, t })
}

// Página `/s/<juego>/tiempo`: la cuenta atrás sola, para abrirla cuando se quiera.
async function timePage() {
  const gameSnap = await getDoc(doc(db, 'games', gameId))
  if (!gameSnap.exists() || gameSnap.data().countdown !== true) return show(`<p>${t.invalid}</p>`)
  applyTheme(gameSnap.data())
  const id = safeGet(RUN_KEY)
  const run = id ? await readRun(id).catch(() => null) : null
  if (!run) return show(`<p>${t.notStarted}</p>`)
  timeScreen({ game: gameSnap.data(), run, title: run.endedMs ? t.finishedTitle : '', next: null })
}

async function main() {
  if (!gameId || !stepId) return show(`<p>${t.invalid}</p>`)
  if (stepId === 'tiempo') return timePage()
  if (stepId === 'tutorial') return tutorialRoute()
  const [gameSnap, stepSnap] = await Promise.all([
    getDoc(doc(db, 'games', gameId)),
    getDoc(doc(db, 'games', gameId, 'steps', stepId)),
  ])
  if (!gameSnap.exists() || !stepSnap.exists() || stepSnap.data().active === false) {
    return show(`<p>${t.invalid}</p>`)
  }
  const game = gameSnap.data()
  const step = stepSnap.data()
  applyTheme(game)

  // Juego desactivado: el QR sigue llevando al contenido, pero no se registra nada.
  if (game.active === false) return redirect(step.url)

  const countdown = game.countdown === true
  const playAfter = game.playAfterTime === true // se puede seguir jugando pasado el límite
  if (step.type === 'optional') return optionalStep({ game, step, playAfter })

  // ¿Hay una partida en curso en este móvil?
  const runId = safeGet(RUN_KEY)
  let run = null
  if (runId) {
    const snap = await getDoc(doc(db, 'runs', runId))
    if (snap.exists()) run = snap.data()
  }
  const limitMs = (game.timeLimitMinutes ?? 240) * 60000
  const open = run && !run.endedAt && Date.now() < run.startedAt.toMillis() + (playAfter ? MAX_AFTER_MS : limitMs)

  // Cuenta atrás: al volver al QR de inicio con una partida ya hecha en el móvil, se pregunta si seguir o empezar otra.
  if (countdown && step.type === 'start' && run && (open || run.endedAt)) return askContinue({ game, step, runId })

  // Juegos que dejan seguir jugando: una partida ya terminada sigue pudiendo ver el contenido (no se registra más).
  if (playAfter && run?.endedAt && step.type !== 'start') return redirect(step.url)

  // Tiempo agotado (juegos normales): ya no se registra nada, pero las pistas y la solución se pueden seguir viendo.
  const agotada = run && !run.endedAt && !open
  if (agotada && (step.type === 'clue' || step.type === 'solution')) return redirect(step.url)

  if (!open) {
    if (agotada && step.type !== 'start') return show(`<p>${t.timeUp}</p>`)
    if (step.type === 'start') return askAlias(game, step) // partida nueva
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
  // Cuenta atrás: al escanear la solución (la acusación) se enseña el tiempo con el reloj parado.
  if (countdown && step.type === 'solution') {
    const done = await readRun(runId)
    if (done) return timeScreen({ game, run: done, title: t.finishedTitle, next: nextOf(step) })
  }
  redirect(step.url)
}

// Paso "opcional" (páginas interactivas): nunca bloquea. Con partida abierta se registra en ella; sin partida empezada
// se cuenta un escaneo suelto (una vez por móvil). Siempre redirige, tarde lo que tarde el servidor (máx. 4 s).
async function optionalStep({ game, step, playAfter }) {
  const runId = safeGet(RUN_KEY)
  let run = null
  if (runId) {
    const snap = await getDoc(doc(db, 'runs', runId)).catch(() => null)
    if (snap?.exists()) run = snap.data()
  }
  if (!run) {
    // sin partida en este móvil: escaneo suelto, una sola vez por móvil
    const looseKey = `sl_suelto_${gameId}_${stepId}`
    if (!safeGet(looseKey)) {
      safeSet(looseKey, '1')
      await withTimeout(addDoc(collection(db, 'escaneosSueltos'), { gameId, stepId, scannedAt: serverTimestamp() }))
    }
    return redirect(step.url)
  }
  const limitMs = (game.timeLimitMinutes ?? 240) * 60000
  const open = !run.endedAt && Date.now() < run.startedAt.toMillis() + (playAfter ? MAX_AFTER_MS : limitMs)
  if (open) {
    const scanRef = doc(db, 'runs', runId, 'scans', stepId)
    const done = await getDoc(scanRef).catch(() => null)
    if (done && !done.exists()) await withTimeout(setDoc(scanRef, { scannedAt: serverTimestamp() }))
  }
  redirect(step.url)
}

function askContinue({ game, step, runId }) {
  show(`
    <h1>${t.haveGame}</h1>
    <div class="scan-opciones">
      <button id="keep">${t.keepGame}</button>
      <button id="fresh" class="secundario">${t.newGame}</button>
    </div>`)
  document.getElementById('keep').onclick = async () => {
    const info = await readRun(runId)
    if (!info) return askAlias(game, step)
    timeScreen({ game, run: info, title: info.endedMs ? t.finishedTitle : t.started, next: nextOf(step), video: videoOf(step) })
  }
  document.getElementById('fresh').onclick = () => {
    show(`
      <h1>${t.newGame}</h1>
      <p>${t.newGameSure}</p>
      <div class="scan-opciones">
        <button id="yes">${t.newGameYes}</button>
        <button id="no" class="secundario">${t.cancel}</button>
      </div>`)
    document.getElementById('yes').onclick = () => askAlias(game, step)
    document.getElementById('no').onclick = () => askContinue({ game, step, runId })
  }
}

function askAlias(game, step) {
  const must = game.requireAlias === true
  show(`
    <h1>${t.welcome}</h1>
    <p>${must ? t.aliasHelpRequired : t.aliasHelp}</p>
    <input id="alias" maxlength="30" placeholder="${t.aliasPlaceholder}" autocomplete="off" />
    <button id="go"${must ? ' disabled' : ''}>${t.start}</button>`)
  const input = document.getElementById('alias')
  const go = document.getElementById('go')
  if (must) input.oninput = () => { go.disabled = !input.value.trim() }
  go.onclick = async (e) => {
    if (must && !input.value.trim()) return
    e.target.disabled = true
    const newRef = doc(collection(db, 'runs'))
    const batchRun = {
      gameId, alias: input.value.trim().slice(0, 30),
      startedAt: serverTimestamp(), endedAt: null,
    }
    try {
      await withTimeout(setDoc(newRef, batchRun))
      safeSet(RUN_KEY, newRef.id)
      await withTimeout(setDoc(doc(db, 'runs', newRef.id, 'scans', stepId), { scannedAt: serverTimestamp() }))
    } catch { /* se sigue igualmente */ }
    if (game.countdown === true) {
      const info = await readRun(newRef.id).catch(() => null)
      if (info) return timeScreen({ game, run: info, title: t.started, next: nextOf(step), video: videoOf(step) })
    }
    started(step)
  }
}

// Tras empezar: el vídeo de inicio (lo de siempre) o el cuaderno de detective, que necesita entrar con Google en el Diario.
function started(step) {
  if (!/^https?:\/\//i.test(step.url)) return show(`<p>${t.invalid}</p>`)
  show(`
    <h1>${t.started}</h1>
    <p>${t.startedHelp}</p>
    <div class="scan-opciones">
      <a class="boton" href="${esc(step.url)}">${t.watch}</a>
      <a class="boton secundario" href="/diario#casos">${t.book}</a>
      <small>${t.bookHelp}</small>
    </div>`)
}

main().catch(() => show(`<p>${t.error}</p><button onclick="location.reload()">${t.retry}</button>`))
