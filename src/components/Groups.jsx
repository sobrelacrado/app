// Grupos de amigos del Diario (solo los ve Alberto): nombre, código, creador y quién forma parte de cada uno.
import { useCallback, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'

const toDate = (v) => v?.toDate?.() ?? null

export default function Groups() {
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const snap = await getDocs(collection(db, 'groups'))
      const profiles = {}
      const profile = (uid) => (profiles[uid] ??= getDoc(doc(db, 'users', uid)).then((u) => (u.exists() ? u.data() : null)).catch(() => null))
      const out = await Promise.all(snap.docs.map(async (g) => {
        const members = (await getDocs(collection(db, 'groups', g.id, 'members'))).docs
        const rows = await Promise.all(members.map(async (m) => {
          const p = await profile(m.id)
          return { alias: m.data().name, name: p?.name ?? '', email: p?.email ?? '', joined: toDate(m.data().at) }
        }))
        rows.sort((a, b) => (a.joined?.getTime() ?? 0) - (b.joined?.getTime() ?? 0))
        const owner = await profile(g.data().owner)
        return { code: g.id, name: g.data().name, owner: owner?.name || owner?.email || '—', at: toDate(g.data().at), rows }
      }))
      setGroups(out.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0)))
    } catch { setError(true) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <>
      <h2>Grupos de amigos <button type="button" className="suave" onClick={load}>Actualizar</button></h2>
      {!groups && !error && <p className="vacio">Cargando…</p>}
      {error && <p className="vacio error">No se pudo cargar.</p>}
      {groups && !groups.length && <p className="vacio">Todavía no hay grupos.</p>}
      {groups?.length > 0 && <p className="jug-resumen">{groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} · {groups.reduce((n, g) => n + g.rows.length, 0)} personas en total</p>}
      {groups?.map((g) => (
        <div key={g.code} className="jug-item abierto">
          <div className="jug-fila">
            <span className="jug-nombre">{g.name}</span>
            <span className="jug-pts">{g.rows.length} {g.rows.length === 1 ? 'persona' : 'personas'}</span>
            <span className="jug-cuando">{g.code}</span>
          </div>
          <div className="jug-cuerpo">
            <p className="nota">Creado por {g.owner}{g.at ? ` · ${g.at.toLocaleDateString('es')}` : ''}</p>
            {g.rows.map((r, i) => <p key={i} className="nota"><b>{r.alias}</b>{r.name && r.name !== r.alias ? ` (${r.name})` : ''}{r.email ? ` · ${r.email}` : ''}</p>)}
          </div>
        </div>
      ))}
    </>
  )
}
