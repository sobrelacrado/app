// Cuaderno de detective de un caso: lista de sospechosos (con estado) + notas libres. Privado: solo su dueño lo lee.
// Se guarda solo unos segundos después de escribir; si no hay conexión queda en el móvil y se sube cuando vuelva.
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_TEXT = 5000
const MAX_SUSPECTS = 12
const STATES = [['🔎', 'Sospechoso'], ['❌', 'Descartado'], ['🎯', 'Mi apuesta']] // st 0, 1, 2
const SNIPPETS = ['Pista:', 'Coartada:', 'Pendiente:']
const draftKey = (uid, gameId) => `sl_cuaderno_${uid}_${gameId}`
const readDraft = (k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }
const writeDraft = (k, v) => { try { if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k) } catch { /* sin almacenamiento */ } }

export default function Cuaderno({ uid, cloud, gameId }) {
  const [nb, setNb] = useState(null) // { text, suspects }; null = cargando
  const [status, setStatus] = useState('') // '' | 'pendiente' | 'guardando' | 'guardado' | 'sinred'
  const [name, setName] = useState('')
  const [sure, setSure] = useState(false)
  const nbRef = useRef(null)
  const timer = useRef(null)
  const key = draftKey(uid, gameId)

  const save = useCallback(async () => {
    clearTimeout(timer.current)
    const cur = nbRef.current
    if (!cur) return
    setStatus('guardando')
    try {
      await cloud.saveNotebook(uid, gameId, cur)
      if (nbRef.current === cur) { writeDraft(key, null); setStatus('guardado') } // si siguió escribiendo, se vuelve a guardar luego
    } catch { setStatus('sinred') }
  }, [cloud, uid, gameId, key])

  // Al abrir: si quedó algo sin subir en este móvil, manda eso; si no, lo de la cuenta.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const draft = readDraft(key)
      if (draft?.dirty) {
        const v = { text: draft.text ?? '', suspects: draft.suspects ?? [] }
        if (!alive) return
        nbRef.current = v; setNb(v); save()
        return
      }
      try {
        const v = await cloud.loadNotebook(uid, gameId)
        if (alive) { nbRef.current = v; setNb(v) }
      } catch { if (alive) { const v = { text: '', suspects: [] }; nbRef.current = v; setNb(v); setStatus('sinred') } }
    })()
    return () => { alive = false }
  }, [cloud, uid, gameId, key, save])

  // Al salir de la pantalla o volver la conexión, se sube lo pendiente.
  useEffect(() => {
    const flush = () => { if (readDraft(key)?.dirty) save() }
    const hide = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('online', flush)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('online', flush); document.removeEventListener('visibilitychange', hide); flush() }
  }, [key, save])

  const change = (next) => {
    nbRef.current = next
    setNb(next)
    setStatus('pendiente')
    writeDraft(key, { ...next, dirty: true })
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 1500)
  }

  const addSuspect = () => {
    const n = name.trim().slice(0, 40)
    if (!n || nb.suspects.length >= MAX_SUSPECTS) return
    change({ ...nb, suspects: [...nb.suspects, { n, st: 0 }] })
    setName('')
  }
  const cycle = (i) => change({ ...nb, suspects: nb.suspects.map((s, k) => (k === i ? { ...s, st: (s.st + 1) % STATES.length } : s)) })
  const remove = (i) => change({ ...nb, suspects: nb.suspects.filter((_, k) => k !== i) })
  const snippet = (t) => change({ ...nb, text: (nb.text && !nb.text.endsWith('\n') ? nb.text + '\n' : nb.text) + t + ' ' })
  const wipe = async () => {
    setSure(false)
    clearTimeout(timer.current)
    writeDraft(key, null)
    try { await cloud.deleteNotebook(uid, gameId); const v = { text: '', suspects: [] }; nbRef.current = v; setNb(v); setStatus('') } catch { setStatus('sinred') }
  }

  if (!nb) return <p className="dr-nota">Abriendo tu cuaderno…</p>
  const MSG = { pendiente: 'Escribiendo…', guardando: 'Guardando…', guardado: 'Guardado ✓', sinred: 'Sin conexión: queda en este móvil y se guardará al volver.' }
  return (
    <div className="dr-cuaderno">
      <p className="dr-cuaderno-priv">🔒 Solo tú lo ves. Ni siquiera el creador del juego puede leerlo.</p>

      <h3>Sospechosos</h3>
      {nb.suspects.length === 0 && <p className="dr-nota">Apunta aquí a quien te parezca sospechoso y toca su estado para cambiarlo.</p>}
      <ul className="dr-sosp">
        {nb.suspects.map((s, i) => (
          <li key={i} className={'st' + s.st}>
            <button type="button" className="dr-sosp-st" onClick={() => cycle(i)} aria-label={`${s.n}: ${STATES[s.st][1]}. Toca para cambiar`}>{STATES[s.st][0]}</button>
            <span className="dr-sosp-n">{s.n}</span>
            <small>{STATES[s.st][1]}</small>
            <button type="button" className="dr-sosp-x" onClick={() => remove(i)} aria-label={`Quitar a ${s.n}`}>✕</button>
          </li>
        ))}
      </ul>
      {nb.suspects.length < MAX_SUSPECTS
        ? (
          <form className="dr-sosp-nuevo" onSubmit={(e) => { e.preventDefault(); addSuspect() }}>
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Nombre del sospechoso" aria-label="Nombre del sospechoso" />
            <button type="submit" className="suave" disabled={!name.trim()}>Añadir</button>
          </form>
        )
        : <p className="dr-nota">Máximo {MAX_SUSPECTS} sospechosos.</p>}

      <h3>Notas</h3>
      <div className="dr-snippets">
        {SNIPPETS.map((t) => <button key={t} type="button" className="suave" onClick={() => snippet(t)}>+ {t}</button>)}
      </div>
      <textarea value={nb.text} maxLength={MAX_TEXT} rows={8} placeholder="Escribe aquí tus pistas, horas, contradicciones…"
        onChange={(e) => change({ ...nb, text: e.target.value })} aria-label="Notas del caso" />
      <div className="dr-cuaderno-pie">
        <small className={'dr-guardado ' + status}>{MSG[status] ?? ''}</small>
        <small>{nb.text.length}/{MAX_TEXT}</small>
      </div>

      {sure
        ? (
          <div className="dr-borrar">
            <p>Se borrará todo el cuaderno de este caso. ¿Seguro?</p>
            <button type="button" className="suave" onClick={wipe}>Sí, borrar</button>
            <button type="button" className="suave" onClick={() => setSure(false)}>Cancelar</button>
          </div>
        )
        : (nb.text || nb.suspects.length > 0) && <button type="button" className="suave dr-quitar" onClick={() => setSure(true)}>Borrar cuaderno</button>}
    </div>
  )
}
