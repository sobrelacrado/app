// Botón "Avisarme cada día": activa o apaga las notificaciones del Diario. No hace falta cuenta.
import { useEffect, useState } from 'react'

export default function Avisos({ compact = false }) {
  const [push, setPush] = useState(null) // módulo de avisos (se carga al mostrar el botón)
  const [st, setSt] = useState('') // '' (cargando) · 'no' · 'bloqueado' · 'activo' · 'apagado'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vivo = true
    import('./push.js').then(async (m) => { const s = await m.state(); if (vivo) { setPush(m); setSt(s) } }).catch(() => vivo && setSt('no'))
    return () => { vivo = false }
  }, [])

  if (!st || st === 'no') return null
  if (compact && st === 'activo') return null

  const run = async (fn) => {
    setBusy(true); setError(false)
    try { setSt(await fn()) } catch { setError(true) }
    setBusy(false)
  }

  return (
    <div className="dr-avisos">
      {st === 'activo' ? (
        <>
          <p>🔔 Te avisaremos cada día cuando haya un acertijo nuevo.</p>
          <button type="button" className="suave" disabled={busy} onClick={() => run(push.disable)}>Dejar de avisarme</button>
        </>
      ) : st === 'bloqueado' ? (
        <p>🔕 Las notificaciones están bloqueadas en este navegador. Puedes permitirlas en los ajustes del sitio y volver aquí.</p>
      ) : (
        <>
          <p>{compact ? 'Mañana habrá otro código.' : 'Recibe un aviso en el móvil cuando salga el acertijo de cada día.'}</p>
          <button type="button" className="suave" disabled={busy} onClick={() => run(push.enable)}>
            {busy ? 'Activando…' : '🔔 Avisarme cada día'}
          </button>
        </>
      )}
      {error && <p className="dr-aviso">No se pudo cambiar. Inténtalo de nuevo.</p>}
    </div>
  )
}
