// Service worker SOLO para los avisos del Diario (ruta /diario). No guarda nada en caché.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let d = {}
  try { d = event.data.json() } catch { /* aviso sin datos */ }
  event.waitUntil(
    self.registration.showNotification(d.title || 'Sobre Lacrado · Diario', {
      body: d.body || 'Ya está el código de hoy.',
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
      tag: 'diario', // un aviso nuevo sustituye al anterior, no se apilan
      data: { url: '/diario' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/diario'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) if (new URL(w.url).pathname.startsWith('/diario') && 'focus' in w) return w.focus()
      return self.clients.openWindow(url)
    }),
  )
})
