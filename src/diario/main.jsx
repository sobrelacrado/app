import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/theme.css'
import Diario from './Diario.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Diario />
  </StrictMode>,
)
