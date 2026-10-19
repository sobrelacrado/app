// Chat de un grupo de amigos: mensajes en directo. Privado: solo lo ven las personas del grupo (ni el creador del juego).
import { useEffect, useRef, useState } from 'react'

const MAX = 300
const two = (n) => String(n).padStart(2, '0')
const stamp = (ms) => {
  const d = new Date(ms), now = new Date()
  const hm = `${two(d.getHours())}:${two(d.getMinutes())}`
  return d.toDateString() === now.toDateString() ? hm : `${d.getDate()}/${d.getMonth() + 1} ${hm}`
}

// canModerate: el creador del grupo o un moderador que él ha nombrado (pueden borrar cualquier mensaje).
export default function Chat({ code, user, cloud, myName, canModerate, onBack }) {
  const [msgs, setMsgs] = useState(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sure, setSure] = useState('') // id del mensaje que se va a borrar
  const listRef = useRef(null)
  const stick = useRef(true) // si estás leyendo lo último, al llegar un mensaje se baja solo

  useEffect(() => {
    const stop = cloud.watchMessages(code, (list) => { setMsgs(list); setError(''); cloud.markChatSeen(code) }, () => setError('No se pudo cargar el chat. Comprueba tu conexión.'))
    return () => { stop(); cloud.markChatSeen(code) }
  }, [cloud, code])

  useEffect(() => {
    const el = listRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [msgs])

  const onScroll = () => {
    const el = listRef.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }
  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || sending) return
    setSending(true); setError('')
    stick.current = true
    try { await cloud.sendMessage(user.uid, code, myName, t); setText('') } catch { setError('No se pudo enviar. Inténtalo de nuevo.') }
    setSending(false)
  }
  const remove = async (id) => {
    setSure('')
    try { await cloud.deleteMessage(code, id) } catch { setError('No se pudo borrar el mensaje.') }
  }

  return (
    <div className="dr-chat">
      <button type="button" className="suave" onClick={onBack}>← Volver al grupo</button>
      <h2>Chat del grupo</h2>
      <p className="dr-nota">🔒 Solo lo ven las personas de este grupo. Nadie más, ni siquiera el creador del juego. Se guardan los últimos 100 mensajes.</p>

      <div className="dr-chat-lista" ref={listRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Mensajes del grupo">
        {msgs === null && !error && <p className="dr-nota">Cargando mensajes…</p>}
        {msgs?.length === 0 && <p className="dr-nota dr-chat-vacio">Todavía no hay mensajes. ¡Rompe el hielo!</p>}
        {msgs?.map((m) => {
          const mine = m.uid === user.uid
          return (
            <div key={m.id} className={'dr-msg' + (mine ? ' mio' : '')}>
              {!mine && <b className="dr-msg-nom">{m.name}</b>}
              <p>{m.text}</p>
              <small>
                {stamp(m.ms)}
                {(mine || canModerate) && (sure === m.id
                  ? <> · <button type="button" className="dr-msg-borrar" onClick={() => remove(m.id)}>¿Borrar?</button> <button type="button" className="dr-msg-borrar" onClick={() => setSure('')}>No</button></>
                  : <> · <button type="button" className="dr-msg-borrar" onClick={() => setSure(m.id)}>borrar</button></>)}
              </small>
            </div>
          )
        })}
      </div>

      {error && <p className="dr-aviso">{error}</p>}
      <form className="dr-chat-form" onSubmit={send}>
        <textarea value={text} maxLength={MAX} rows={2} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Escribe un mensaje" />
        <div className="dr-chat-pie">
          <small>{text.length}/{MAX}</small>
          <button type="submit" disabled={sending || !text.trim()}>{sending ? 'Enviando…' : 'Enviar'}</button>
        </div>
      </form>
    </div>
  )
}
