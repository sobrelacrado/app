import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Estos datos son públicos por diseño: la seguridad la dan las reglas de Firestore.
const app = initializeApp({
  apiKey: 'AIzaSyCksj_fxBiDwFaGiXHpSgVKI0gi6uV-Cj8',
  authDomain: 'app-sobre-lacrado.firebaseapp.com',
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
