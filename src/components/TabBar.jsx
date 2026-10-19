// Barra de pestañas flotante (abajo) con un selector que se desliza hasta la pestaña pulsada. La usan el panel de admin y el Diario.
// tabs = [{ id, label, icon, badge? }]. variant = '' (colores del panel) o 'diario' (siempre oscura).
import { useEffect, useState } from 'react'
import './TabBar.css'

// Iconos de línea (24×24, trazo fino): se pintan con el color del texto, así valen en claro y oscuro.
const G = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const ICONS = {
  hoy: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6" /><path d="m9.2 15 2 2 3.8-3.9" /></>,
  archivo: <><rect x="3.5" y="4" width="17" height="5" rx="1.6" /><path d="M5.2 9v9.2a1.8 1.8 0 0 0 1.8 1.8h10a1.8 1.8 0 0 0 1.8-1.8V9M10 13h4" /></>,
  progreso: <><path d="m3.5 17 5.5-5.5 3.8 3.8 7.7-7.8" /><path d="M15.5 7.5h5v5" /></>,
  casos: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 5 5" /></>,
  amigos: <><circle cx="9" cy="8.4" r="3.4" /><path d="M2.8 20c.5-3.5 3.1-5.4 6.2-5.4s5.7 1.9 6.2 5.4" /><circle cx="17.4" cy="9.4" r="2.5" /><path d="M17.2 14.4c2.3.2 3.9 1.7 4.2 4.6" /></>,
  partidas: <><circle cx="12" cy="12" r="8.8" /><path d="m10.2 8.7 5.2 3.3-5.2 3.3z" /></>,
  stats: <path d="M5.5 20V11M12 20V4.5M18.5 20v-6.5" />,
  juegos: <><rect x="3.8" y="3.8" width="7" height="7" rx="1.8" /><rect x="13.2" y="3.8" width="7" height="7" rx="1.8" /><rect x="3.8" y="13.2" width="7" height="7" rx="1.8" /><rect x="13.2" y="13.2" width="7" height="7" rx="1.8" /></>,
  jugadores: <><circle cx="9" cy="8.4" r="3.4" /><path d="M2.8 20c.5-3.5 3.1-5.4 6.2-5.4s5.7 1.9 6.2 5.4" /><circle cx="17.4" cy="9.4" r="2.5" /><path d="M17.2 14.4c2.3.2 3.9 1.7 4.2 4.6" /></>,
}

export default function TabBar({ tabs, active, onChange, label, variant = '' }) {
  const [hidden, setHidden] = useState(false) // se esconde mientras se escribe, para que no se suba encima del teclado
  useEffect(() => {
    const isField = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
    const on = (e) => setHidden(isField(e.target))
    const off = () => setHidden(false)
    document.addEventListener('focusin', on)
    document.addEventListener('focusout', off)
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off) }
  }, [])

  const i = Math.max(0, tabs.findIndex((t) => t.id === active))
  const key = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    onChange(next.id)
    e.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus()
  }
  return (
    <nav className={`tabbar ${variant}${hidden ? ' oculta' : ''}`} role="tablist" aria-label={label} style={{ '--n': tabs.length, '--i': i }} onKeyDown={key}>
      <span className="tabbar-sel" aria-hidden="true" />
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" data-tab={t.id} aria-selected={t.id === active} tabIndex={t.id === active ? 0 : -1}
          className={(t.id === active ? 'activa' : '') + (t.destacada ? ' destacada' : '')} onClick={() => onChange(t.id)}>
          <span className="tabbar-ico">
            <svg viewBox="0 0 24 24" aria-hidden="true" {...G}>{ICONS[t.icon]}</svg>
            {t.badge && <i className="tabbar-punto" role="img" aria-label={typeof t.badge === 'string' ? t.badge : 'pendiente'} />}
          </span>
          <span className="tabbar-txt">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
