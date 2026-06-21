import { createContext, Dispatch, useReducer } from 'react'
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
  const { run } = useSSE(state, dispatch)

  return (
    <AppContext.Provider value={{ state, dispatch, run }}>
      <div className="app-layout">
        <header className="app-header">
          <div />
          <HistoryPanel />
        </header>
        <main className="app-main">
          <ControlCenter />
          <Dashboard />
        </main>
      </div>
    </AppContext.Provider>
  )
}
