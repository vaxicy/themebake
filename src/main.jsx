import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { LanguageProvider } from './i18n/index.jsx'

import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/studio.css'
import './styles/preview.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('ThemeBake could not find #root in index.html.')
}

// Provider order matters:
//   ErrorBoundary  — outermost, so it catches a crash in anything below it
//                    (it uses the hook-free `translate()` for that reason).
//   LanguageProvider — every child, including ToastProvider, needs `t()`.
//   ToastProvider  — owns the aria-live region that overlays the whole app.
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
