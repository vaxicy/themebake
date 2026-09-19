/**
 * Top-level error boundary.
 *
 * If an unexpected runtime error slips through, the user sees a recoverable
 * message with a "reset local data" escape hatch rather than a blank page.
 *
 * This is a class component, so it cannot use the `useI18n` hook. It calls the
 * hook-free `translate()` with the *persisted* language instead — which is the
 * right value anyway, since the provider may have been unmounted by the crash.
 */

import { Component } from 'react'
import { detectInitialLanguage, translate } from '../i18n/index.jsx'
import { clearTheme } from '../utils/storage.js'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.lang = detectInitialLanguage()
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Kept as a console error rather than a network report: ThemeBake has no
    // backend by design, so nothing is ever sent anywhere.
    console.error('[ThemeBake] Unhandled error:', error, info)
  }

  handleReset = () => {
    clearTheme()
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const t = (key, vars) => translate(this.lang, key, vars)

    return (
      <div className="crash">
        <div className="crash__card">
          <h1 className="crash__title">{t('crash.title')}</h1>
          <p className="crash__text">{t('crash.text')}</p>
          <pre className="crash__detail">{String(this.state.error?.message ?? this.state.error)}</pre>
          <div className="crash__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => window.location.reload()}
            >
              {t('crash.reload')}
            </button>
            <button type="button" className="button button--outline" onClick={this.handleReset}>
              {t('crash.clear')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
