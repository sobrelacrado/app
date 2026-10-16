export const TEXTS = {
  es: {
    welcome: 'Bienvenidos al caso',
    aliasHelp: 'Pongan un nombre a su grupo (opcional). Empieza a contar el tiempo al pulsar.',
    aliasPlaceholder: 'Nombre del grupo',
    start: 'Empezar',
    invalid: 'Este código QR no es válido.',
    notStarted: 'Esta partida aún no ha empezado en este móvil. Escaneen primero el QR de inicio.',
    anyway: 'Ver contenido igualmente',
    error: 'No se ha podido cargar. Revisen la conexión e inténtenlo de nuevo.',
    retry: 'Reintentar',
  },
  en: {
    welcome: 'Welcome to the case',
    aliasHelp: 'Give your group a name (optional). The clock starts when you press the button.',
    aliasPlaceholder: 'Group name',
    start: 'Start',
    invalid: 'This QR code is not valid.',
    notStarted: 'The game has not started on this phone yet. Scan the start QR first.',
    anyway: 'View content anyway',
    error: 'Could not load. Check your connection and try again.',
    retry: 'Retry',
  },
}

export const t = TEXTS[(navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es']
