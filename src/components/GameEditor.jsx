import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import Ayuda from './Ayuda.jsx'
import { newGameId, newStepId } from '../lib/ids.js'
import { THEMES, DEFAULT_THEME, themeOf } from '../lib/themes.js'
import { CASE2, CASE3, EXPEDIENTE_TEMPLATE, STEP_TYPES, countGameRuns, deleteGame, saveGame, scanUrl, validateGame } from '../lib/games.js'
import { clearStatsCache } from '../lib/loadStats.js'

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
  const [del, setDel] = useState(null) // null | { runs, sure, busy, failed }
  const [openIds, setOpenIds] = useState(() => new Set()) // pasos desplegados (los nuevos nacen desplegados)

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
  const toggleStep = (sid) =>
    setOpenIds((o) => {
      const next = new Set(o)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  const addStep = () => {
    const s = blankStep()
    setSteps((l) => [...l, s])
    setOpenIds((o) => new Set(o).add(s.id))
  }
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
    if (found.length) {
      // desplegar los pasos con fallos para que se vean
      setOpenIds((o) => new Set([...o, ...found.filter((e) => e.step).map((e) => steps[e.step - 1]?.id).filter(Boolean)]))
      return
    }
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

  const askDelete = async () => {
    setDel({ runs: undefined, sure: false, busy: false, failed: false })
    const runs = await countGameRuns(db, id)
    setDel((d) => d && { ...d, runs })
  }
  const confirmDelete = async () => {
    setDel((d) => ({ ...d, busy: true, failed: false }))
    try {
      await deleteGame(db, id)
      clearStatsCache()
      onBack()
    } catch {
      setDel((d) => ({ ...d, busy: false, failed: true }))
    }
  }

  const saveButton = (
    <button type="button" onClick={submit} disabled={status === 'saving'}>
      {status === 'saving' ? t.saving : t.save}
    </button>
  )
  const saveStatus = (
    <>
      {status === 'saved' && <span className="ok">{t.savedOk}</span>}
      {status === 'failed' && <span className="error">{t.saveError}</span>}
    </>
  )

  if (loading) return <p className="vacio">{t.loading}</p>

  return (
    <div onChange={touched}>
      <div className="barra-editor">
        <button type="button" className="suave" onClick={onBack}>← {t.back}</button>
        <span className="barra-estado">{saveStatus}</span>
        {saveButton}
      </div>
      {!isNew && (
        <div className="acciones fila-botones">
          <button type="button" className="suave" onClick={() => onQr(id)}>{t.printQr}</button>
        </div>
      )}

      <label className="campo">
        {t.gName}
        <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="campo">
        <span>{t.gTheme} <Ayuda>{t.gThemeHelp}</Ayuda></span>
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
      <div className="fila-campos">
        <label className="campo">
          {t.gLimit}
          <input type="number" inputMode="numeric" min="5" max="1440" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>
        <div className="casilla">
          <label className="casilla">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> {t.gActive}
          </label>
          <Ayuda>{t.gActiveHelp} {t.changeWarn}</Ayuda>
        </div>
      </div>

      <h2>{t.gSteps} <Ayuda>{t.gStepsHelp}</Ayuda></h2>

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

      {steps.map((s, i) => {
        const isOpen = openIds.has(s.id)
        return (
        <div className={`paso-fila ${s.active ? '' : 'inactivo'}`} key={s.id}>
          <div className="paso-resumen">
            <button type="button" className="paso-toggle" aria-expanded={isOpen} onClick={() => toggleStep(s.id)}>
              <span className="num-paso">{i + 1}</span>
              <span className="paso-texto">
                <span className="paso-nombre">{s.label || t.stepLabel}</span>
                <span className="paso-tipo">{t[TYPE_KEY[s.type]]}{s.active ? '' : ` · ${t.inactiveGame}`}</span>
              </span>
              <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
            </button>
            <button type="button" className="suave" onClick={() => flash(s.id, scanUrl(id, s.id))}>
              {copied === s.id ? t.copied : t.copyLink}
            </button>
          </div>
          {isOpen && (
          <div className="paso-detalle">
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
            {!s.saved && <button type="button" className="suave" onClick={() => remove(i)}>{t.removeStep}</button>}
          </div>
          </div>
          )}
        </div>
        )
      })}

      <div className="acciones fila-botones">
        <button type="button" className="suave" onClick={addStep}>+ {t.addStep}</button>
        {steps.length > 0 && (
          <button
            type="button" className="suave"
            onClick={() => flash('all', steps.map((s) => `${s.label}\t${scanUrl(id, s.id)}`).join('\n'))}
          >
            {copied === 'all' ? t.copied : t.copyAll}
          </button>
        )}
        <Ayuda>{t.linksWork}</Ayuda>
      </div>

      {errors.length > 0 && (
        <ul className="error lista-errores">
          {errors.map((e, k) => (
            <li key={k}>{e.step ? `${t.stepWord} ${e.step}: ` : ''}{t.gErr[e.code]}</li>
          ))}
        </ul>
      )}

      <div className="exportar">
        {saveButton}
        <button type="button" className="suave" onClick={onBack}>← {t.back}</button>
        {saveStatus}
      </div>

      {!isNew && (
        <div className="peligro">
          <h2>{t.dangerZone}</h2>
          {!del ? (
            <button type="button" className="suave peligro-boton" onClick={askDelete}>{t.delGame}</button>
          ) : (
            <div className="peligro-confirmar">
              <p className="error">{del.runs === undefined ? t.loading : t.delGameWarn(del.runs)}</p>
              <label className="casilla">
                <input type="checkbox" checked={del.sure} onChange={(e) => setDel((d) => ({ ...d, sure: e.target.checked }))} /> {t.delSure}
              </label>
              <div className="acciones">
                <button type="button" className="suave" onClick={() => setDel(null)} disabled={del.busy}>{t.delCancel}</button>
                <button type="button" onClick={confirmDelete} disabled={!del.sure || del.busy || del.runs === undefined}>
                  {del.busy ? t.delDeleting : t.delForever}
                </button>
              </div>
              {del.failed && <p className="error">{t.delError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
