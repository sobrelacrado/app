import { useEffect, useMemo, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from './auth.js'
import { LANGS, LangContext, initialLang, textsFor } from './i18n.js'
import { ADMIN_EMAIL } from './lib/runs.js'
import Panel from './components/Panel.jsx'
import Stats from './components/Stats.jsx'

export default function App() {
  const [lang, setLang] = useState(initialLang)
  const [user, setUser] = useState(undefined) // undefined = comprobando sesión
  const [loginError, setLoginError] = useState(false)
  const [tab, setTab] = useState('runs')
  const ctx = useMemo(() => ({ lang, t: textsFor(lang) }), [lang])
  const { t } = ctx

  useEffect(() => onAuthStateChanged(auth, setUser), [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const chooseLang = (l) => {
    setLang(l)
    try { localStorage.setItem('sl_lang', l) } catch { /* sin almacenamiento */ }
  }

  const login = async () => {
    setLoginError(false)
    try { await signInWithPopup(auth, new GoogleAuthProvider()) } catch { setLoginError(true) }
  }

  // Orientativo: quien no sea Alberto no puede leer nada aunque llegara aquí (lo impiden las reglas).
  const allowed = user && user.email === ADMIN_EMAIL

  return (
    <LangContext.Provider value={ctx}>
      <div className="hoja">
        <header className="membrete">
          <div className="marca">
            <img src="/sello.png" alt="" />
            <div className="logo">SOBRE LACRADO<small>{t.panel.toUpperCase()}</small></div>
          </div>
          <div className="herramientas">
            {LANGS.map((l) => (
              <button key={l} type="button" className={`suave ${l === lang ? 'activo' : ''}`} onClick={() => chooseLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
            {user && <button type="button" className="suave" onClick={() => signOut(auth)}>{t.logout}</button>}
          </div>
        </header>

        {user === undefined && <p className="vacio">{t.loading}</p>}

        {user === null && (
          <div className="centro">
            <img src="/sello.png" alt="Sobre Lacrado" />
            <h1>SOBRE LACRADO</h1>
            <p>{t.loginHelp}</p>
            <button type="button" onClick={login}>{t.login}</button>
            {loginError && <p className="error">{t.loginError}</p>}
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
            </nav>
            {tab === 'runs' ? <Panel /> : <Stats />}
          </>
        )}
      </div>
    </LangContext.Provider>
  )
}
