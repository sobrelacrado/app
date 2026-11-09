import './cerrado.css'

// Cartel que sustituye al Diario mientras está cerrado (interruptor MANTENIMIENTO en main.jsx).
export default function Cerrado() {
  return (
    <main className="cerrado">
      <div className="cerrado-hoja">
        <img className="cerrado-sello" src="/sello-128.png" alt="Sobre Lacrado" />
        <div className="cerrado-cinta" aria-hidden="true">Cerrado por mantenimiento</div>
        <h1>El Diario está cerrado por mantenimiento</h1>
        <p>Estamos arreglando cosas entre bastidores.</p>
        <p className="cerrado-puntos">Tus puntos están guardados a buen recaudo… <em>o no.</em></p>
        <p className="cerrado-firma">Volvemos pronto · Sobre Lacrado</p>
      </div>
    </main>
  )
}
