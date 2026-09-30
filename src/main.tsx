import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Initializes i18next synchronously (inline resources) before first render.
import './i18n'
import './index.css'
import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
