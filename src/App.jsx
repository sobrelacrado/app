import { useEffect, useMemo, useState } from 'react'
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth } from './auth.js'
import { LANGS, LangContext, initialLang, textsFor } from './i18n.js'
import { ADMIN_EMAIL } from './lib/runs.js'
import { applyUpdate, promptInstall, useCanInstall, useNeedRefresh, useOnline } from './lib/pwa.js'
import AlertWatcher from './components/AlertWatcher.jsx'
import Games from './components/Games.jsx'
import Panel from './components/Panel.jsx'
import Stats from './components/Stats.jsx'

const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } },
}
// En la app instalada, la ventana emergente de Google falla en algunos móviles: se usa redirección.
const isInstalledApp = () => window.matchMedia?.('(display-mode: standalone)').matches

export default function App() {
  const [lang, setLang] = useState(initialLang)
  const [user, setUser] = useState(undefined) // undefined = comprobando sesión
  const [loginError, setLoginError] = useState(false) // false | código del error
  const [redirectDiag, setRedirectDiag] = useState('…')
  const [tab, setTab] = useState('runs')
  const [alertsOn, setAlertsOn] = useState(() => store.get('sl_alerts', 'off') === 'on')
  const ctx = useMemo(() => ({ lang, t: textsFor(lang) }), [lang])
  const { t } = ctx
  const needRefresh = useNeedRefresh()
  const canInstall = useCanInstall()
  const online = useOnline()

  useEffect(() => onAuthStateChanged(auth, setUser), [])
  // Al volver de Google (app instalada) se completa el acceso; si falla, se muestra el motivo.
  useEffect(() => {
    getRedirectResult(auth)
      .then((r) => setRedirectDiag(r?.user ? `ok (${r.user.email})` : 'sin resultado'))
      .catch((e) => { setLoginError(e?.code ?? 'error'); setRedirectDiag(e?.code ?? 'error') })
  }, [])
  // En la pantalla de acceso no hay nada que perder: si hay versión nueva, se aplica sola.
  useEffect(() => { if (needRefresh && user === null) applyUpdate() }, [needRefresh, user])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const chooseLang = (l) => {
    setLang(l)
    store.set('sl_lang', l)
  }

  const login = async (forcePopup = false) => {
    setLoginError(false)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' }) // que Google siempre deje elegir la cuenta
    try {
      // Con la redirección, Google exigiría autorizar web.app en Google Cloud: se usa siempre la ventana emergente.
      if (forcePopup === 'redirect') await signInWithRedirect(auth, provider)
      else await signInWithPopup(auth, provider)
    } catch (e) {
      setLoginError(e?.code ?? 'error')
    }
  }

  // Activar los avisos pide permiso al navegador (solo la primera vez, y hace falta un toque del usuario).
  const toggleAlerts = async () => {
    const next = !alertsOn
    if (next && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch { /* sin soporte */ }
    }
    setAlertsOn(next)
    store.set('sl_alerts', next ? 'on' : 'off')
  }

  // Orientativo: quien no sea Alberto no puede leer nada aunque llegara aquí (lo impiden las reglas).
  const allowed = user && user.email === ADMIN_EMAIL
  const blocked = alertsOn && 'Notification' in window && Notification.permission === 'denied'

  return (
    <LangContext.Provider value={ctx}>
      {!online && <div className="banda">{t.offline}</div>}
      {needRefresh && (
        <div className="banda banda-version">
          {t.updateAvailable}{' '}
          <button type="button" className="suave" onClick={() => applyUpdate()}>{t.update}</button>
        </div>
      )}
      <div className="hoja">
        <header className="membrete">
          <div className="marca">
            <img src="/sello-128.png" alt="" />
            <div className="logo">SOBRE LACRADO<small>{t.panel.toUpperCase()}</small></div>
          </div>
          <div className="herramientas">
            {canInstall && <button type="button" className="suave" onClick={promptInstall}>{t.install}</button>}
            {allowed && (
              <button type="button" className={`suave ${alertsOn ? 'activo' : ''}`} onClick={toggleAlerts} aria-pressed={alertsOn}>
                {alertsOn ? t.alertsOn : t.alertsOff}
              </button>
            )}
            {LANGS.map((l) => (
              <button key={l} type="button" className={`suave ${l === lang ? 'activo' : ''}`} onClick={() => chooseLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
            {user && <button type="button" className="suave" onClick={() => signOut(auth)}>{t.logout}</button>}
          </div>
        </header>

        {blocked && <p className="nota">{t.alertsBlocked}</p>}

        {user === undefined && <p className="vacio">{t.loading}</p>}

        {user === null && (
          <div className="centro acceso">
            <span className="sello-acceso"><img src="/sello-128.png" alt="Sobre Lacrado" /></span>
            <h1>SOBRE LACRADO</h1>
            <p>{t.loginHelp}</p>
            <button type="button" onClick={() => login()}>{t.login}</button>
            {loginError && <p className="error">{t.loginError} ({loginError})</p>}
            <p className="nota">v{__BUILD__} · {isInstalledApp() ? 'app' : 'navegador'} · {auth.config.authDomain} · redirección: {redirectDiag}</p>
          </div>
        )}

        {user && !allowed && (
          <div className="centro">
            <h1>{t.noAccess}</h1>
            <p>{t.noAccessHelp}</p>
            <p>{user.email}</p>
          </div>
        )}

        {allowed && (
          <>
            <nav className="pestanas">
              <button type="button" className={tab === 'runs' ? 'activa' : ''} onClick={() => setTab('runs')}>{t.tabRuns}</button>
              <button type="button" className={tab === 'stats' ? 'activa' : ''} onClick={() => setTab('stats')}>{t.tabStats}</button>
              <button type="button" className={tab === 'games' ? 'activa' : ''} onClick={() => setTab('games')}>{t.tabGames}</button>
            </nav>
            <div className="vista" key={tab}>
              {tab === 'runs' && <Panel />}
              {tab === 'stats' && <Stats />}
              {tab === 'games' && <Games />}
            </div>
            <AlertWatcher enabled={alertsOn} onOpen={() => setTab('runs')} />
          </>
        )}
      </div>
    </LangContext.Provider>
  )
}
