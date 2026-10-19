// Interruptor deslizante de dos posiciones con texto: [izquierda | derecha]. checked = la posición de la derecha está activa.
export default function Switch({ left, right, checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={'sw' + (checked ? ' on' : '')} onClick={() => onChange(!checked)}>
      <span className="sw-pos" aria-hidden="true" />
      <span className="sw-t l">{left}</span>
      <span className="sw-t r">{right}</span>
    </button>
  )
}
