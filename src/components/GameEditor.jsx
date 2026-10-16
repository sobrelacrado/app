import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import { newGameId, newStepId } from '../lib/ids.js'
import { THEMES, DEFAULT_THEME, themeOf } from '../lib/themes.js'
import { CASE2, CASE3, EXPEDIENTE_TEMPLATE, STEP_TYPES, saveGame, scanUrl, validateGame } from '../lib/games.js'

const TYPE_KEY = { start: 'typeStart', clue: 'typeClue', normal: 'typeNormal', solution: 'typeSolution' }
const blankStep = () => ({ id: newStepId(), label: '', type: 'normal', url: '', active: true, saved: false })
const fromTemplate = (steps) => steps.map((s) => ({ ...blankStep(), ...s }))

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function GameEditor({ gameId, onBack, onQr }) {
  const { t } = useT()
  const [id] = useState(() => gameId ?? newGameId())
  const [isNew, setIsNew] = useState(!gameId)
  const [loading, setLoading] = useState(!!gameId)
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('240')
  const [active, setActive] = useState(true)
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [steps, setSteps] = useState([])
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState('idle') // idle | saving | saved | failed
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!gameId) return
    let cancelled = false
    ;(async () => {
      const [g, s] = await Promise.all([getDoc(doc(db, 'games', gameId)), getDocs(collection(db, 'games', gameId, 'steps'))])
      if (cancelled) return
      const data = g.data() ?? {}
      setName(data.name ?? '')
      setLimit(String(data.timeLimitMinutes ?? 240))
      setActive(data.active !== false)
      setTheme(themeOf(data))
      setSteps(
        s.docs
          .map((d) => ({ id: d.id, ...d.data(), saved: true }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      )
      setLoading(false)
    })().catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [gameId])

  const patch = (i, change) => setSteps((list) => list.map((s, k) => (k === i ? { ...s, ...change } : s)))
  const move = (i, d) =>
    setSteps((list) => {
      const j = i + d
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const remove = (i) => setSteps((list) => list.filter((_, k) => k !== i))
  const touched = () => status !== 'idle' && setStatus('idle')

  const flash = async (key, text) => {
    if (await copy(text)) {
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    }
  }

  const submit = async () => {
    const found = validateGame({ name, timeLimitMinutes: limit, steps })
    setErrors(found)
    if (found.length) return
    setStatus('saving')
    try {
      await saveGame(db, { id, isNew, name, timeLimitMinutes: limit, active, theme, steps })
      setSteps((list) => list.map((s) => ({ ...s, saved: true })))
      setIsNew(false)
      setStatus('saved')
    } catch {
      setStatus('failed')
    }
  }

  if (loading) return <p className="vacio">{t.loading}</p>

  return (
    <div onChange={touched}>
      <div className="encabezado-grafico">
        <button type="button" className="suave" onClick={onBack}>← {t.back}</button>
        {!isNew && <button type="button" className="suave" onClick={() => onQr(id)}>{t.printQr}</button>}
      </div>

      <label className="campo">
        {t.gName}
        <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="campo">
        {t.gTheme}
        <div className="temas" role="radiogroup" aria-label={t.gTheme}>
          {THEMES.map((k) => (
            <button
              key={k} type="button" role="radio" aria-checked={theme === k}
              className={`muestra-tema tema-${k} ${theme === k ? 'elegido' : ''}`}
              onClick={() => { setTheme(k); touched() }}
            >
              {t.theme[k]}
            </button>
          ))}
        </div>
      </div>
      <p className="nota">{t.gThemeHelp}</p>
      <div className="fila-campos">
        <label className="campo">
          {t.gLimit}
          <input type="number" inputMode="numeric" min="5" max="1440" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>
        <label className="casilla">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> {t.gActive}
        </label>
      </div>
      <p className="nota">{t.gActiveHelp}</p>
      <p className="nota">{t.changeWarn}</p>

      <h2>{t.gSteps}</h2>
      <p className="nota">{t.gStepsHelp}</p>

      {!steps.length && (
        <div className="plantillas">
          <b>{t.gTemplates}</b>
          <button type="button" className="suave" onClick={() => setSteps(fromTemplate(EXPEDIENTE_TEMPLATE))}>{t.tplExpediente}</button>
          <button
            type="button" className="suave"
            onClick={() => {
              if (isNew) setName(CASE3.name)
              setLimit(String(CASE3.timeLimitMinutes)); setTheme(CASE3.theme); setSteps(fromTemplate(CASE3.steps))
            }}
          >
            {t.tplCase3}
          </button>
          {isNew && (
            <button
              type="button" className="suave"
              onClick={() => { setName(CASE2.name); setLimit(String(CASE2.timeLimitMinutes)); setSteps(fromTemplate(CASE2.steps)) }}
            >
              {t.tplCase2}
            </button>
          )}
        </div>
      )}

      {steps.map((s, i) => (
        <div className={`paso-fila ${s.active ? '' : 'inactivo'}`} key={s.id}>
          <span className="num-paso">{i + 1}</span>
          <label className="campo">
            {t.stepLabel}
            <input value={s.label} maxLength={60} onChange={(e) => patch(i, { label: e.target.value })} />
          </label>
          <label className="campo">
            {t.type}
            <select value={s.type} onChange={(e) => patch(i, { type: e.target.value })}>
              {STEP_TYPES.map((ty) => <option key={ty} value={ty}>{t[TYPE_KEY[ty]]}</option>)}
            </select>
          </label>
          <label className="campo ancho">
            {t.stepUrl}
            <input value={s.url} inputMode="url" onChange={(e) => patch(i, { url: e.target.value })} />
          </label>
          <div className="acciones">
            <label className="casilla">
              <input type="checkbox" checked={s.active} onChange={(e) => patch(i, { active: e.target.checked })} /> {t.stepActive}
            </label>
            <button type="button" className="suave" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.moveUp}>▲</button>
            <button type="button" className="suave" onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label={t.moveDown}>▼</button>
            <button type="button" className="suave" onClick={() => flash(s.id, scanUrl(id, s.id))}>
              {copied === s.id ? t.copied : t.copyLink}
            </button>
            {!s.saved && <button type="button" className="suave" onClick={() => remove(i)}>{t.removeStep}</button>}
          </div>
        </div>
      ))}

      <div className="acciones fila-botones">
        <button type="button" className="suave" onClick={() => setSteps((l) => [...l, blankStep()])}>+ {t.addStep}</button>
        {steps.length > 0 && (
          <button
            type="button" className="suave"
            onClick={() => flash('all', steps.map((s) => `${s.label}\t${scanUrl(id, s.id)}`).join('\n'))}
          >
            {copied === 'all' ? t.copied : t.copyAll}
          </button>
        )}
      </div>
      <p className="nota">{t.linksWork}</p>

      {errors.length > 0 && (
        <ul className="error lista-errores">
          {errors.map((e, k) => (
            <li key={k}>{e.step ? `${t.stepWord} ${e.step}: ` : ''}{t.gErr[e.code]}</li>
          ))}
        </ul>
      )}

      <div className="exportar">
        <button type="button" onClick={submit} disabled={status === 'saving'}>
          {status === 'saving' ? t.saving : t.save}
        </button>
        {status === 'saved' && <span className="ok">{t.savedOk}</span>}
        {status === 'failed' && <span className="error">{t.saveError}</span>}
      </div>
    </div>
  )
}
