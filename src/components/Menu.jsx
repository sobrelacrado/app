import { useEffect, useRef, useState } from 'react'

// Menú desplegable de la cabecera (⋮): agrupa los ajustes para que la pantalla quede limpia.
export default function Menu({ label, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const outside = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className="menu" ref={ref}>
      <button
        type="button" className="suave menu-boton" aria-haspopup="menu" aria-expanded={open} aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        ⋮
      </button>
      {open && <div className="menu-panel" role="menu" onClick={(e) => { if (!e.target.closest('[data-keep]')) setOpen(false) }}>{children}</div>}
    </div>
  )
}
