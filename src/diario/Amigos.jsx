// Pestaña "Amigos" del Diario: grupos con código y clasificación semanal (lunes a domingo) entre quienes están en el mismo grupo.
import { useCallback, useEffect, useState } from 'react'
import { nextKey } from './ciphers.js'
import { weekStart, weeklyPoints, weeklyRanking } from './points.js'

const MEDAL = ['🥇', '🥈', '🥉']
const SITE_URL = 'https://app-sobre-lacrado.web.app/diario'
const firstName = (u) => String(u?.displayName ?? '').trim().split(/\s+/)[0] || 'Detective'
const ERRORS = {
  nogroup: 'No existe ningún grupo con ese código. Revisa que esté bien escrito.',
  limit: 'Ya estás en 5 grupos, el máximo. Sal de alguno para unirte a otro.',
  full: 'Ese grupo ya tiene 20 personas, el máximo.',
  already: 'Ya estás en ese grupo.',
}
const fmtWeek = (wk) => new Date(wk + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })

function Clasificacion({ rows, user }) {
  return (
    <ol className="dr-clasif">
      {rows.map((r, i) => (
        <li key={r.uid} className={r.uid === user.uid ? 'yo' : ''}>
          <span className="dr-pos">{r.pts > 0 && i < 3 ? MEDAL[i] : i + 1}</span>
          <span className="dr-nom">{r.name}{r.uid === user.uid ? ' (tú)' : ''}<small>{r.solved} {r.solved === 1 ? 'acertijo' : 'acertijos'}{r.streak > 0 ? ` · 🔥 ${r.streak}` : ''}</small></span>
          <b>{r.pts} pts</b>
        </li>
      ))}
    </ol>
  )
}

function Grupo({ code, user, cloud, today, days, retos, onBack, onChange }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('now') // 'now' | 'prev'
  const [sure, setSure] = useState('') // 'salir' | 'borrar' | uid a echar
  const [copied, setCopied] = useState(false)
  const week = weekStart(today)
  const prev = nextKey(week, -7)

  const load = useCallback(async () => {
    setError('')
    try { setDetail(await cloud.loadGroup(code, [week, prev])) } catch (e) {
      if (e?.message === 'gone') { await cloud.forgetGroup(user.uid, code).catch(() => {}); onChange(); onBack(); return }
      setError('No se pudo cargar el grupo. Inténtalo de nuevo.')
    }
  }, [cloud, code, week, prev, user.uid, onBack, onChange])
  useEffect(() => { load() }, [load])

  const invite = async () => {
    const text = `Únete a mi grupo «${detail.group.name}» del Diario de Sobre Lacrado y compite cada semana. Código: ${code}`
    const url = `${SITE_URL}#grupo=${code}`
    try {
      if (navigator.share) { await navigator.share({ title: 'Diario de Sobre Lacrado', text, url }); return }
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { /* cancelado */ }
  }
  const act = async (fn) => {
    setSure('')
    try { await fn(); onChange() } catch { setError('No se pudo completar. Inténtalo de nuevo.'); return false }
    return true
  }
  const leave = async () => { if (await act(() => cloud.leaveGroup(user.uid, code))) onBack() }
  const wipe = async () => { if (await act(() => cloud.deleteGroup(user.uid, code))) onBack() }
  const kick = async (uid) => { if (await act(() => cloud.removeMember(code, uid))) load() }

  if (error && !detail) return <><p className="dr-aviso">{error}</p><button type="button" className="suave" onClick={load}>Reintentar</button> <button type="button" className="suave" onClick={onBack}>← Mis grupos</button></>
  if (!detail) return <p className="dr-nota">Cargando el grupo…</p>
  const owner = detail.group.owner === user.uid
  const wk = tab === 'now' ? week : prev
  const yo = { uid: user.uid, ...weeklyPoints(days, retos, week), streak: 0 } // tu fila siempre al día, aunque aún no se haya subido
  const rows = weeklyRanking(detail.members, detail.scores, wk, tab === 'now' ? { ...yo, streak: detail.scores?.[week]?.[user.uid]?.streak ?? 0 } : null)
  const winner = weeklyRanking(detail.members, detail.scores, prev)[0]
  return (
    <div className="dr-amigos-grupo">
      <button type="button" className="suave" onClick={onBack}>← Mis grupos</button>
      <h2>{detail.group.name}</h2>
      <p className="dr-nota">{detail.members.length} {detail.members.length === 1 ? 'persona' : 'personas'} · código <b className="dr-codigo">{code}</b></p>
      <button type="button" className="dr-reto-boton dr-invitar" onClick={invite}>{copied ? '¡Copiado!' : '📨 Invitar amigos'}</button>

      <div className="dr-sem-tabs">
        <button type="button" className={tab === 'now' ? 'activa' : ''} onClick={() => setTab('now')}>Esta semana</button>
        <button type="button" className={tab === 'prev' ? 'activa' : ''} onClick={() => setTab('prev')}>Semana pasada</button>
      </div>
      <p className="dr-nota">Semana del {fmtWeek(wk)} al {fmtWeek(nextKey(wk, 6))}{tab === 'now' ? ' · se reinicia el lunes' : ''}</p>
      {tab === 'prev' && winner?.pts > 0 && <p className="dr-ganador">🏆 Ganó <b>{winner.name}</b> con {winner.pts} puntos</p>}
      <Clasificacion rows={rows} user={user} />
      <p className="dr-nota">Suman los acertijos del día y los retos resueltos en su día (no los del archivo). Se actualiza cuando cada persona juega.</p>
      <button type="button" className="suave" onClick={load}>Actualizar</button>

      {error && <p className="dr-aviso">{error}</p>}
      {owner && detail.members.length > 1 && (
        <div className="dr-gestion">
          <h3>Gestionar miembros</h3>
          {detail.members.filter((m) => m.uid !== user.uid).map((m) => (
            sure === m.uid
              ? <div key={m.uid} className="dr-borrar"><p>¿Echar a {m.name} del grupo?</p><button type="button" className="suave" onClick={() => kick(m.uid)}>Sí, echar</button> <button type="button" className="suave" onClick={() => setSure('')}>Cancelar</button></div>
              : <p key={m.uid}>{m.name} <button type="button" className="suave" onClick={() => setSure(m.uid)}>Echar</button></p>
          ))}
        </div>
      )}
      {sure === (owner ? 'borrar' : 'salir')
        ? (
          <div className="dr-borrar">
            <p>{owner ? 'Se borrará el grupo para todos. ¿Seguro?' : 'Dejarás de aparecer en este grupo. ¿Seguro?'}</p>
            <button type="button" className="suave" onClick={owner ? wipe : leave}>{owner ? 'Sí, borrar el grupo' : 'Sí, salir'}</button>
            <button type="button" className="suave" onClick={() => setSure('')}>Cancelar</button>
          </div>
        )
        : <button type="button" className="suave dr-quitar" onClick={() => setSure(owner ? 'borrar' : 'salir')}>{owner ? 'Borrar grupo' : 'Salir del grupo'}</button>}
    </div>
  )
}

export default function Amigos({ user, cloud, status, onLogin, today, days, retos, joinCode, onChange }) {
  const [groups, setGroups] = useState(null)
  const [open, setOpen] = useState('')
  const [mode, setMode] = useState(joinCode ? 'unir' : '') // '' | 'crear' | 'unir'
  const [name, setName] = useState('')
  const [alias, setAlias] = useState(firstName(user))
  const [code, setCode] = useState(joinCode ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try { setGroups(await cloud.myGroups(user.uid)) } catch { setGroups([]); setError('No se pudieron cargar tus grupos.') }
  }, [cloud, user])
  useEffect(() => { if (user && cloud) load() }, [user, cloud, load])
  useEffect(() => { if (joinCode) { setMode('unir'); setCode(joinCode) } }, [joinCode])

  if (!user) {
    return (
      <article className="dr-carta tema-detective">
        <h1>Amigos</h1>
        <p>Crea un grupo con tus amigos y compite cada semana: quién suma más puntos de lunes a domingo.</p>
        <div className="dr-cuenta">
          <p>Para jugar con amigos necesitas entrar con Google: así cada uno guarda sus puntos y se reconoce al unirse.</p>
          <button type="button" onClick={onLogin} disabled={status === 'entrando'}>{status === 'entrando' ? 'Entrando…' : 'Entrar con Google'}</button>
          {status === 'error' && <p className="dr-aviso">No se pudo entrar. Inténtalo de nuevo.</p>}
          {joinCode && <p className="dr-nota">Te han invitado al grupo <b>{joinCode}</b>. Entra y te unirás.</p>}
        </div>
      </article>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const c = mode === 'crear' ? await cloud.createGroup(user.uid, name.trim(), alias.trim() || firstName(user)) : await cloud.joinGroup(user.uid, code, alias.trim() || firstName(user))
      onChange(); setMode(''); setName(''); setCode(''); await load(); setOpen(c)
      if (window.location.hash) history.replaceState(null, '', window.location.pathname)
    } catch (err) { setError(ERRORS[err?.message] ?? 'No se pudo completar. Inténtalo de nuevo.') }
    setBusy(false)
  }

  if (open) return <article className="dr-carta tema-detective"><Grupo code={open} user={user} cloud={cloud} today={today} days={days} retos={retos} onBack={() => { setOpen(''); load() }} onChange={onChange} /></article>

  return (
    <article className="dr-carta tema-detective">
      <h1>Amigos</h1>
      <p>Compite cada semana con tus amigos: gana quien sume más puntos de lunes a domingo. La clasificación se reinicia cada lunes.</p>
      {groups === null && <p className="dr-nota">Cargando tus grupos…</p>}
      {groups?.length > 0 && (
        <ul className="dr-grupos">
          {groups.map((g) => <li key={g.code}><button type="button" onClick={() => setOpen(g.code)}><b>{g.name}</b><small>código {g.code}</small></button></li>)}
        </ul>
      )}
      {groups?.length === 0 && !mode && <p className="dr-nota">Todavía no estás en ningún grupo.</p>}

      {!mode && (
        <div className="dr-grupo-acciones">
          <button type="button" className="dr-reto-boton" onClick={() => { setMode('crear'); setError('') }}>➕ Crear un grupo</button>
          <button type="button" className="suave" onClick={() => { setMode('unir'); setError('') }}>Tengo un código</button>
        </div>
      )}
      {mode && (
        <form className="dr-grupo-form" onSubmit={submit}>
          <h2>{mode === 'crear' ? 'Nuevo grupo' : 'Unirme a un grupo'}</h2>
          {mode === 'crear'
            ? <label>Nombre del grupo<input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Los Sabuesos" required /></label>
            : <label>Código del grupo<input className="dr-codigo-in" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="K7M2QX" required /></label>}
          <label>Tu nombre en el grupo<input value={alias} maxLength={30} onChange={(e) => setAlias(e.target.value)} placeholder="Cómo te verán tus amigos" /></label>
          <small>Solo lo verán las personas de este grupo.</small>
          {error && <p className="dr-aviso">{error}</p>}
          <div className="dr-grupo-acciones">
            <button type="submit" disabled={busy || (mode === 'crear' ? !name.trim() : code.length !== 6)}>{busy ? 'Un momento…' : mode === 'crear' ? 'Crear grupo' : 'Unirme'}</button>
            <button type="button" className="suave" onClick={() => { setMode(''); setError('') }}>Cancelar</button>
          </div>
        </form>
      )}
      {!mode && error && <p className="dr-aviso">{error}</p>}
      <p className="dr-nota">Los grupos son privados: solo los ven sus miembros (y el creador del juego, para saber cuántos grupos hay).</p>
    </article>
  )
}
