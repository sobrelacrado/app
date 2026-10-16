import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useT } from '../i18n.js'
import { download } from '../lib/csv.js'
import { scanUrl } from '../lib/games.js'
import { qrPath, qrSvgString } from '../lib/qr.js'

const PER_PAGE = 12 // 3 columnas x 4 filas en A4

function Qr({ text }) {
  const { d, box } = useMemo(() => qrPath(text), [text])
  return (
    <svg viewBox={`0 0 ${box} ${box}`} shapeRendering="crispEdges" role="img" aria-label={text}>
      <rect width={box} height={box} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  )
}

export default function QrSheet({ gameId, onBack }) {
  const { t } = useT()
  const [state, setState] = useState({ loading: true, name: '', steps: [] })

  useEffect(() => {
    let cancelled = false
    Promise.all([getDoc(doc(db, 'games', gameId)), getDocs(collection(db, 'games', gameId, 'steps'))])
      .then(([g, s]) => {
        if (cancelled) return
        const steps = s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => x.active !== false)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        setState({ loading: false, name: g.data()?.name ?? '', steps })
      })
      .catch(() => !cancelled && setState({ loading: false, name: '', steps: [], error: true }))
    return () => { cancelled = true }
  }, [gameId])

  const pages = []
  for (let i = 0; i < state.steps.length; i += PER_PAGE) pages.push(state.steps.slice(i, i + PER_PAGE))

  return (
    <>
      <div className="no-imprimir">
        <div className="encabezado-grafico">
          <button type="button" className="suave" onClick={onBack}>← {t.back}</button>
          <button type="button" onClick={() => window.print()} disabled={!state.steps.length}>{t.print}</button>
        </div>
        <h2>{t.sheetTitle} · {state.name}</h2>
        <p className="nota">{t.sheetHelp}</p>
        {state.loading && <p className="vacio">{t.loading}</p>}
        {state.error && <p className="vacio error">{t.loadError}</p>}
        {!state.loading && !state.error && !state.steps.length && <p className="vacio">{t.noActiveSteps}</p>}
      </div>

      {pages.map((page, n) => (
        <section className="pagina-qr" key={n}>
          <div className="no-imprimir etiqueta-hoja">{t.sheetN} {n + 1}</div>
          <div className="rejilla-qr">
            {page.map((s) => {
              const url = scanUrl(gameId, s.id)
              return (
                <figure className="tarjeta-qr" key={s.id}>
                  <Qr text={url} />
                  <figcaption>
                    <b>{s.label}</b>
                    <small>{state.name}</small>
                  </figcaption>
                  <button
                    type="button" className="suave no-imprimir"
                    onClick={() => download(`qr_${s.label.replace(/[^\w-]+/g, '_')}.svg`, qrSvgString(url), 'image/svg+xml')}
                  >
                    {t.downloadSvg}
                  </button>
                </figure>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
