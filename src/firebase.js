import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// En la app instalada el acceso con Google va por redirección, y Chrome aísla el almacenamiento entre
// dominios distintos: la página de acceso tiene que estar en el MISMO dominio que la app (web.app).
// En el navegador se mantiene el dominio de siempre, que funciona con la ventana emergente.
const installed = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches

// Estos datos son públicos por diseño: la seguridad la dan las reglas de Firestore.
export const app = initializeApp({
  apiKey: 'AIzaSyCksj_fxBiDwFaGiXHpSgVKI0gi6uV-Cj8',
  authDomain: installed ? 'app-sobre-lacrado.web.app' : 'app-sobre-lacrado.firebaseapp.com',
  projectId: 'app-sobre-lacrado',
  storageBucket: 'app-sobre-lacrado.firebasestorage.app',
  messagingSenderId: '656901903049',
  appId: '1:656901903049:web:060fcfb2b93c6da18cf318',
})

export const db = getFirestore(app)

// En local (emulador) nunca se tocan los datos reales.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
