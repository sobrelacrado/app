// Opiniones de los casos (solo las ve Alberto): nota media por caso y los comentarios con quién los escribió.
import { useCallback, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'

const toDate = (v) => v?.toDate?.() ?? null
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function Ratings() {
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const snap = await getDocs(collection(db, 'valoraciones'))
      const names = {}, games = {}
      const byGame = {}
      await Promise.all(snap.docs.map(async (d) => {
        const x = d.data()
        names[x.uid] ??= getDoc(doc(db, 'users', x.uid)).then((u) => (u.exists() ? u.data() : null)).catch(() => null)
        games[x.gameId] ??= getDoc(doc(db, 'games', x.gameId)).then((g) => (g.exists() ? g.data().name : null)).catch(() => null)
        ;(byGame[x.gameId] ??= []).push(x)
      }))
      const out = []
      for (const [gameId, list] of Object.entries(byGame)) {
        const rows = await Promise.all(list.map(async (x) => {
          const p = await names[x.uid]
          return { who: p?.name || p?.email || 'Jugador', stars: x.stars, comment: x.comment ?? '', at: toDate(x.at) }
        }))
        rows.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0))
        out.push({ gameId, name: (await games[gameId]) ?? gameId, rows, avg: rows.reduce((n, r) => n + r.stars, 0) / rows.length })
      }
      setGroups(out.sort((a, b) => b.rows.length - a.rows.length))
    } catch { setError(true) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <>
      <h2>Opiniones de los casos <button type="button" className="suave" onClick={load}>Actualizar</button></h2>
      {!groups && !error && <p className="vacio">Cargando…</p>}
      {error && <p className="vacio error">No se pudo cargar.</p>}
      {groups && !groups.length && <p className="vacio">Todavía nadie ha valorado un caso. Solo pueden hacerlo quienes lo terminan.</p>}
      {groups?.map((g) => (
        <div key={g.gameId} className="jug-item abierto">
          <div className="jug-fila">
            <span className="jug-nombre">{g.name}</span>
            <span className="jug-pts">{g.avg.toFixed(1)} ★</span>
            <span className="jug-cuando">{g.rows.length} {g.rows.length === 1 ? 'valoración' : 'valoraciones'}</span>
          </div>
          <div className="jug-cuerpo">
            {g.rows.map((r, i) => (
              <p key={i} className="nota"><b>{stars(r.stars)}</b> {r.who}{r.at ? ` · ${r.at.toLocaleDateString('es')}` : ''}{r.comment ? <><br />{r.comment}</> : null}</p>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
