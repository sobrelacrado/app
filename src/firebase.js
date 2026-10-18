import { initializeApp } from 'firebase/app'
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore'

// El acceso con Google usa la MISMA dirección que la web (web.app): el iPhone (Safari y Chrome) aísla el almacenamiento entre
// direcciones distintas y con firebaseapp.com daba "missing initial state". Autorizada en Google Cloud (cliente web) el 18/10/2026.

// Estos datos son públicos por diseño: la seguridad la dan las reglas de Firestore.
export const app = initializeApp({
  apiKey: 'AIzaSyCksj_fxBiDwFaGiXHpSgVKI0gi6uV-Cj8',
  authDomain: 'app-sobre-lacrado.web.app',
  projectId: 'app-sobre-lacrado',
  storageBucket: 'app-sobre-lacrado.firebasestorage.app',
  messagingSenderId: '656901903049',
  appId: '1:656901903049:web:060fcfb2b93c6da18cf318',
})

// El panel guarda una copia en el móvil para poder enseñar lo último cargado sin conexión.
// La página del jugador (/s/...) y el Diario público no la usan: se queda tal cual, sin copia ni escrituras pendientes.
const isPlayerPage = location.pathname.startsWith('/s/') || location.pathname.startsWith('/diario')
export const db = isPlayerPage
  ? getFirestore(app)
  : initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })

// En local (emulador) nunca se tocan los datos reales.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
