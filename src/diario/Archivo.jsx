// Archivo del Diario: calendario con todos los días anteriores. Tocar un día lo abre para jugarlo (sin racha, con la mitad de puntos).
import { archiveMonths, archiveSummary } from './archive.js'

const MARK = { done: '✓', late: '↺', started: '…' }
const LABEL = { done: 'resuelto', late: 'resuelto desde el archivo', started: 'empezado', miss: 'sin jugar', today: 'hoy', future: 'todavía no', before: '' }

export default function Archivo({ days, todayKey, onPick, onSellos }) {
  const months = archiveMonths(days, todayKey)
  const { done, total } = archiveSummary(days, todayKey)
  return (
    <article className="dr-carta tema-detective">
      <h1>Archivo</h1>
      <p className="dr-nota dr-izq">
        Juega los días que te perdiste. Aquí <b>no sube la racha</b> y los puntos son <b>la mitad</b> (y solo la primera vez).
        {total > 0 && <> Llevas <b>{done}</b> de <b>{total}</b> días anteriores.</>}
      </p>

      {onSellos && (
        <div className="dr-sellos-invita">
          <p><b>Sellos</b> · tableros de lógica sin límite, para jugar cuando quieras.</p>
          <button type="button" className="suave" onClick={onSellos}>Jugar a Sellos</button>
        </div>
      )}

      {months.map((m) => (
        <section key={m.key} className="dr-mes">
          <h2 className="dr-sub">{m.label}</h2>
          <div className="dr-cal dr-arch">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span className="dr-dia-sem" key={d}>{d}</span>)}
            {Array.from({ length: m.blanks }, (_, i) => <span key={'b' + i} />)}
            {m.cells.map((c) => {
              const playable = c.state === 'done' || c.state === 'late' || c.state === 'started' || c.state === 'miss'
              const text = `${c.day} de ${m.label}: ${LABEL[c.state]}`
              return playable || c.state === 'today' ? (
                <button type="button" key={c.key} className={`dr-dia dr-dia-b ${c.state}`} aria-label={text} onClick={() => onPick(c.state === 'today' ? null : c.key)}>
                  <span className="dr-num">{c.day}</span>{MARK[c.state] && <i>{MARK[c.state]}</i>}
                </button>
              ) : (
                <span key={c.key} className={`dr-dia ${c.state}`} aria-label={text}><span className="dr-num">{c.day}</span></span>
              )
            })}
          </div>
        </section>
      ))}

      <p className="dr-nota">✓ resuelto en su día · ↺ resuelto desde el archivo · … empezado</p>
    </article>
  )
}
