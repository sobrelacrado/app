import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/theme.css'
import Cerrado from './Cerrado.jsx'

// Interruptor: true = el Diario muestra solo el cartel de «cerrado por mantenimiento» y ni siquiera carga el juego.
// Para reabrirlo: ponerlo en false y publicar.
const MANTENIMIENTO = true

const Diario = lazy(() => import('./Diario.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MANTENIMIENTO ? (
      <Cerrado />
    ) : (
      <Suspense fallback={null}>
        <Diario />
      </Suspense>
    )}
  </StrictMode>,
)
