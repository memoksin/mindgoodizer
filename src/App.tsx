import { createContext, Dispatch, useReducer, useState, useCallback } from 'react'
import './App.css'
import { ControlCenter } from './components/ControlCenter'
import { Dashboard } from './components/Dashboard'
import { HistoryPanel } from './components/HistoryPanel'
import { initialState, reducer, Action } from './state'
import { AppState, AgentId } from './types'
import { useSSE } from './useSSE'

interface ContextValue {
  state: AppState
  dispatch: Dispatch<Action>
  run: (retryAgent?: AgentId) => void
}

export const AppContext = createContext<ContextValue>({
  state: initialState,
  dispatch: () => {},
  run: () => {},
})

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [error, setError] = useState<string | null>(null)
  const onError = useCallback((msg: string) => setError(msg), [])
  const { run } = useSSE(state, dispatch, onError)

  return (
    <AppContext.Provider value={{ state, dispatch, run }}>
      <div className="app-layout">
        <header className="app-header">
          <div className="app-brand">
            <span className="app-wordmark">MINDGOODIZER</span>
            <span className="app-tagline">Idea Validator</span>
          </div>
          <HistoryPanel />
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠ {error}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => setError(null)}>✕</button>
          </div>
        )}
        <main className="app-main">
          <ControlCenter />
          <Dashboard />
        </main>
      </div>
    </AppContext.Provider>
  )
}
