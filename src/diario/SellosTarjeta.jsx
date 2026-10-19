// Tarjeta que invita a jugar a Sellos (al resolver el acertijo del día y en el Archivo).
import { dateKey } from './ciphers.js'

// Tablero de adorno 5×5 con una solución válida (letras = regiones) y sus cinco sellos.
const MAPA = ['AAABB', 'CABBB', 'CCDDB', 'CDDEE', 'CDEEE']
const COLOR = { A: '#e8cf9c', B: '#b6c79b', C: '#d9a38a', D: '#a9b8d6', E: '#c4aed0' }
const SELLOS = [[0, 1], [1, 3], [2, 0], [3, 2], [4, 4]]
const NUEVO_HASTA = '2026-11-30' // la etiqueta «Nuevo» se quita sola

function Mini() {
  return (
    <svg viewBox="0 0 50 50" className="ss-mini" aria-hidden="true">
      {MAPA.flatMap((fila, r) => [...fila].map((l, c) => <rect key={r * 5 + c} x={c * 10} y={r * 10} width="10" height="10" fill={COLOR[l]} stroke="rgba(70,48,22,.22)" strokeWidth=".5" />))}
      <rect x=".5" y=".5" width="49" height="49" fill="none" stroke="rgba(70,48,22,.55)" strokeWidth="1" rx="2" />
      {SELLOS.map(([r, c]) => (
        <g key={r}>
          <circle cx={c * 10 + 5} cy={r * 10 + 5} r="4.3" fill="#a8201a" stroke="#7d1510" strokeWidth=".6" />
          <circle cx={c * 10 + 5} cy={r * 10 + 5} r="2.2" fill="#c23a30" />
          <circle cx={c * 10 + 5} cy={r * 10 + 4.4} r=".8" fill="#f1c7c2" />
        </g>
      ))}
    </svg>
  )
}

export default function SellosTarjeta({ onClick }) {
  return (
    <div className="ss-tarjeta">
      <div className="ss-tarjeta-fila">
        <Mini />
        <div>
          <p className="ss-tarjeta-titulo">Sellos {dateKey() < NUEVO_HASTA && <span className="ss-nuevo">Nuevo</span>}</p>
          <p className="ss-tarjeta-texto">Tableros de lógica <b>sin límite</b>. Coloca los sellos de lacre sin que se toquen.</p>
        </div>
      </div>
      <button type="button" onClick={onClick}>Jugar a Sellos</button>
    </div>
  )
}
