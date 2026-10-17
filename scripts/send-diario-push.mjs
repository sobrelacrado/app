// Envía el aviso diario del Diario a los móviles suscritos. Lo ejecuta GitHub Actions (.github/workflows/diario-aviso.yml).
// Variables: FIREBASE_SERVICE_ACCOUNT (JSON de la cuenta de servicio), VAPID_PRIVATE_KEY.
// Opcionales: FORCE=1 (envía aunque no sean las 8:00 en Madrid), DRY_RUN=1 (no envía, solo cuenta).
import { createPrivateKey } from 'node:crypto'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import webpush from 'web-push'
import { dayIndex, levelStars, puzzleFor } from '../src/diario/ciphers.js'
import PUZZLES from '../src/diario/puzzles.js'
import { VAPID_PUBLIC } from '../src/diario/vapid.js'

const SEND_HOUR = 8 // hora de Madrid a la que sale el aviso
const madrid = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
const parts = Object.fromEntries(madrid.formatToParts(new Date()).map((p) => [p.type, p.value]))

export const BODIES = [
  'Ya está el código de hoy. ¿Lo descifras?',
  'Un mensaje cifrado te espera. ¿Cuánto tardas hoy?',
  'Sobre lacrado, código nuevo. Ábrelo cuando quieras.',
  'Hoy hay otro acertijo. Mantén tu racha 🔥',
  'El sobre de hoy ya está sobre la mesa.',
]

export function buildMessage(key) {
  const level = puzzleFor(PUZZLES, key).level
  const i = ((dayIndex(key) % BODIES.length) + BODIES.length) % BODIES.length
  return { title: `🔎 Diario nº ${dayIndex(key) + 1} · ${levelStars(level)}`, body: BODIES[i] }
}

// Lee la clave de servicio tolerando pegados raros (comillas de más, "\n" sin convertir) y explica el fallo sin enseñar la clave.
export function readServiceAccount(raw) {
  let text = String(raw).trim()
  if (text.startsWith('"') && text.endsWith('"')) text = JSON.parse(text) // pegado entre comillas
  let acc
  try { acc = JSON.parse(text) } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido: pega el contenido ENTERO del archivo, de { a }.') }
  if (typeof acc.private_key !== 'string') throw new Error('Al JSON le falta "private_key": no es la clave de cuenta de servicio.')
  const H = '-----BEGIN PRIVATE KEY-----', F = '-----END PRIVATE KEY-----'
  const raw0 = acc.private_key.replace(/\\n/g, '\n')
  const i = raw0.indexOf(H), j = raw0.indexOf(F)
  if (i < 0 || j < i) throw new Error(`La private_key no tiene el formato esperado (largo ${raw0.length}, contiene BEGIN: ${i >= 0}, contiene END: ${j >= 0}).`)
  const body = raw0.slice(i + H.length, j).replace(/\s+/g, '') // quita saltos de línea, espacios y tabuladores
  const bad = [...new Set(body.replace(/[A-Za-z0-9+/=]/g, ''))]
  if (bad.length) throw new Error(`La private_key tiene caracteres que no deberían estar (códigos: ${bad.map((c) => c.charCodeAt(0)).join(', ')}). Largo del cuerpo: ${body.length}.`)
  if (body.length < 1000) throw new Error(`La private_key parece cortada: el cuerpo mide ${body.length} caracteres y debería pasar de 1000.`)
  acc.private_key = `${H}\n${body.match(/.{1,64}/g).join('\n')}\n${F}\n` // se reconstruye en líneas de 64
  try { createPrivateKey(acc.private_key) } catch {
    // Diagnóstico sin enseñar la clave: una clave PKCS#8 empieza por 0x30 y declara su propio largo.
    const der = Buffer.from(body, 'base64')
    const declared = der[1] === 0x82 ? ((der[2] << 8) | der[3]) + 4 : der[1] === 0x81 ? der[2] + 3 : null
    throw new Error(`La private_key está dañada: cuerpo ${body.length} caracteres (múltiplo de 4: ${body.length % 4 === 0}), ${der.length} bytes, primer byte ${der[0]?.toString(16)}, largo declarado ${declared}. Una clave normal mide unos 1624 caracteres / 1217 bytes. Vuelve a copiar el .json entero.`)
  }
  return acc
}

async function main() {
  if (process.env.FORCE !== '1' && Number(parts.hour) !== SEND_HOUR) {
    console.log(`Son las ${parts.hour}:xx en Madrid; el aviso sale a las ${SEND_HOUR}. No se envía nada.`)
    return
  }
  const key = `${parts.year}-${parts.month}-${parts.day}`
  const message = buildMessage(key)
  console.log(`Día ${key}:`, message)

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    initializeApp({ credential: cert(readServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)) })
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId: 'demo-sobre-lacrado' })
  } else {
    throw new Error('Falta FIREBASE_SERVICE_ACCOUNT')
  }
  const db = getFirestore()
  const snap = await db.collection('pushSubs').get()
  console.log(`${snap.size} móviles suscritos.`)
  if (process.env.DRY_RUN === '1') return

  if (!process.env.VAPID_PRIVATE_KEY) throw new Error('Falta VAPID_PRIVATE_KEY')
  webpush.setVapidDetails('mailto:sobrelacradojuegos@gmail.com', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)
  const payload = JSON.stringify(message)
  let ok = 0, gone = 0, failed = 0
  for (let i = 0; i < snap.docs.length; i += 50) {
    await Promise.all(snap.docs.slice(i, i + 50).map(async (d) => {
      const s = d.data()
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600 })
        ok++
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone++; await d.ref.delete() } // el móvil ya no quiere avisos
        else { failed++; console.warn('Fallo', e.statusCode ?? e.message) }
      }
    }))
  }
  console.log(`Enviados: ${ok} · dados de baja: ${gone} · fallos: ${failed}`)
  if (failed > 0 && ok === 0) process.exitCode = 1
}

if (process.argv[1]?.endsWith('send-diario-push.mjs')) await main()
