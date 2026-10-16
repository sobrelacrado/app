import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import { themeOf } from '../lib/themes.js'
import GameEditor from './GameEditor.jsx'
import QrSheet from './QrSheet.jsx'

export default function Games() {
  const [view, setView] = useState({ name: 'list' })
  const toList = () => setView({ name: 'list' })

  if (view.name === 'edit') {
    return <GameEditor gameId={view.gameId} onBack={toList} onQr={(id) => setView({ name: 'qr', gameId: id })} />
  }
  if (view.name === 'qr') return <QrSheet gameId={view.gameId} onBack={toList} />
  return (
    <GameList
      onNew={() => setView({ name: 'edit', gameId: null })}
      onEdit={(id) => setView({ name: 'edit', gameId: id })}
      onQr={(id) => setView({ name: 'qr', gameId: id })}
    />
  )
}

function GameList({ onNew, onEdit, onQr }) {
  const { t } = useT()
  const [state, setState] = useState({ loading: true, games: [], error: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'games'))
        const games = await Promise.all(
          snap.docs.map(async (d) => {
            const steps = await getDocs(collection(db, 'games', d.id, 'steps'))
            return { id: d.id, ...d.data(), stepCount: steps.docs.filter((s) => s.data().active !== false).length }
          }),
        )
        games.sort((a, b) => String(a.name).localeCompare(String(b.name)))
        if (!cancelled) setState({ loading: false, games, error: false })
      } catch {
        if (!cancelled) setState({ loading: false, games: [], error: true })
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <div className="encabezado-grafico">
        <h2 style={{ flex: 1 }}>{t.tabGames}</h2>
        <button type="button" onClick={onNew}>{t.newGame}</button>
      </div>
      {state.loading && <p className="vacio">{t.loading}</p>}
      {state.error && <p className="vacio error">{t.loadError}</p>}
      {!state.loading && !state.error && !state.games.length && <p className="vacio">{t.noGames}</p>}
      {state.games.map((g) => (
        <div className={`ficha tema-${themeOf(g)}`} key={g.id}>
          <span className="etq">{g.active === false ? t.inactiveGame : t.activeGame}</span>
          <div className="fila-juego">
            <div>
              <div className="alias">{g.name}</div>
              <div className="meta">
                {g.stepCount} {t.steps} · {g.timeLimitMinutes ?? 240} {t.limitMin}
              </div>
            </div>
            <div className="acciones">
              <button type="button" className="suave" onClick={() => onEdit(g.id)}>{t.edit}</button>
              <button type="button" className="suave" onClick={() => onQr(g.id)}>{t.printQr}</button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
