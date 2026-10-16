import { useState } from 'react'
import { useT } from '../i18n.js'

// Botón "?" que despliega un texto de ayuda: las explicaciones solo molestan cuando se leen.
export default function Ayuda({ children }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <span className="ayuda">
      <button type="button" className="suave ayuda-boton" aria-expanded={open} aria-label={t.help} onClick={() => setOpen((o) => !o)}>?</button>
      {open && <span className="nota ayuda-texto">{children}</span>}
    </span>
  )
}
