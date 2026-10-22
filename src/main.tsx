import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LogtoProvider } from '@logto/react'
// Initializes i18next synchronously (inline resources) before first render.
import './i18n'
import './index.css'
import { logtoConfig } from './auth'
import { AuthGate } from './components/auth-gate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogtoProvider config={logtoConfig}>
      <AuthGate />
    </LogtoProvider>
  </StrictMode>,
)
