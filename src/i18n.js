import { createContext, useContext } from 'react'

const TEXTS = {
  es: {
    panel: 'Panel de casos',
    login: 'Entrar con Google',
    loginHelp: 'Acceso reservado a la agencia.',
    loginError: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
    noAccess: 'Sin permiso',
    noAccessHelp: 'Esta cuenta no tiene acceso al panel.',
    logout: 'Salir',
    running: 'Partidas en curso',
    recent: 'Terminadas recientes',
    noRunning: 'No hay partidas en curso.',
    noRecent: 'Todavía no hay partidas terminadas.',
    noName: 'Sin nombre',
    started: 'Inicio',
    steps: 'pasos',
    clues: 'pistas',
    lastStep: 'Último',
    noScansYet: 'Sin escaneos aún',
    ago: (min) => (min < 1 ? 'hace menos de 1 min' : `hace ${min} min`),
    idle: 'sin actividad',
    statusOpen: 'En curso',
    statusFinished: 'Terminada',
    statusTimeout: 'Tiempo agotado',
    loading: 'Cargando…',
    loadError: 'No se pudieron cargar las partidas.',
    unknownGame: 'Juego desconocido',
  },
  en: {
    panel: 'Case dashboard',
    login: 'Sign in with Google',
    loginHelp: 'Access restricted to the agency.',
    loginError: 'Could not sign in. Please try again.',
    noAccess: 'No access',
    noAccessHelp: 'This account is not allowed in the dashboard.',
    logout: 'Sign out',
    running: 'Games in progress',
    recent: 'Recently finished',
    noRunning: 'No games in progress.',
    noRecent: 'No finished games yet.',
    noName: 'Unnamed',
    started: 'Started',
    steps: 'steps',
    clues: 'clues',
    lastStep: 'Last',
    noScansYet: 'No scans yet',
    ago: (min) => (min < 1 ? 'less than 1 min ago' : `${min} min ago`),
    idle: 'inactive',
    statusOpen: 'In progress',
    statusFinished: 'Finished',
    statusTimeout: 'Time out',
    loading: 'Loading…',
    loadError: 'Could not load the games.',
    unknownGame: 'Unknown game',
  },
}

export const LANGS = Object.keys(TEXTS)
export const textsFor = (lang) => TEXTS[lang] ?? TEXTS.es
export const LangContext = createContext({ lang: 'es', t: TEXTS.es })
export const useT = () => useContext(LangContext)

export function initialLang() {
  try {
    const saved = localStorage.getItem('sl_lang')
    if (saved && TEXTS[saved]) return saved
  } catch { /* sin almacenamiento */ }
  return (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es'
}
