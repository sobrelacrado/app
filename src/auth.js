import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { app } from './firebase.js'

// Solo lo usa el panel de Alberto (la página del jugador no necesita login).
export const auth = getAuth(app)

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
