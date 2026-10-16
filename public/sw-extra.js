// Se añade al service worker generado. Al tocar un aviso, abre (o enfoca) el panel.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) if ('focus' in w) return w.focus()
      return self.clients.openWindow('/')
    }),
  )
})
