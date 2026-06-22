import { useContext } from 'react'
import { AppContext } from '../App'
import { AgentId, AGENT_LABELS, CORE_AGENTS, NICHE_AGENTS } from '../types'

export function ControlCenter() {
  const { state, dispatch, run } = useContext(AppContext)
  const isRunning = state.phase === 'running'
  const canRun = state.idea.trim().length >= 20 && !isRunning

  const activeCount = state.config.length
  const buttonLabel = isRunning
    ? `Evaluating (${activeCount} agents)…`
    : `Run (${activeCount} agents)`

  function toggleNiche(id: AgentId) {
    dispatch({ type: 'TOGGLE_AGENT', id })
  }

  return (
    <section className="control-center">
      <h1 className="app-title">Mindgoodizer</h1>
      <p className="app-subtitle">Throw your idea at a panel of brutal critics.</p>

      <textarea
        className="idea-input"
        placeholder="Describe your idea… (min 20 chars)"
        value={state.idea}
        onChange={(e) => dispatch({ type: 'SET_IDEA', idea: e.target.value })}
        disabled={isRunning}
        rows={4}
      />

      <div className="agents-row">
        <div className="core-agents">
          <span className="agents-label">Core (always on)</span>
          <div className="agent-chips">
            {CORE_AGENTS.map((id) => (
              <span key={id} className="chip chip--locked">
                {AGENT_LABELS[id]}
              </span>
            ))}
          </div>
        </div>

        <div className="niche-agents">
          <span className="agents-label">Niche (optional)</span>
          <div className="agent-chips">
            {NICHE_AGENTS.map((id) => {
              const checked = state.config.includes(id)
              return (
                <label key={id} className={`chip chip--toggle ${checked ? 'chip--on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNiche(id)}
                    disabled={isRunning}
                  />
                  {AGENT_LABELS[id]}
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <label className={`opus-toggle ${state.useOpus ? 'opus-toggle--on' : ''}`}>
        <input
          type="checkbox"
          checked={state.useOpus}
          onChange={() => dispatch({ type: 'TOGGLE_OPUS' })}
          disabled={isRunning}
        />
        <span className="opus-toggle__track"><span className="opus-toggle__thumb" /></span>
        <span className="opus-toggle__text">
          Opus orchestrator
          <small>Max reasoning. Skips classifier, higher cost.</small>
        </span>
      </label>

      <div className="run-row">
        {state.phase === 'complete' && (
          <button
            className="btn btn--ghost"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            New idea
          </button>
        )}
        <button
          className="btn btn--primary"
          disabled={!canRun}
          onClick={() => run()}
        >
          {buttonLabel}
        </button>
      </div>

      {state.classification && (
        <span className={`badge badge--classify badge--${state.classification}`}>
          {state.classification === 'heavy' ? '⚡ Heavy idea' : '✦ Light idea'}
        </span>
      )}
    </section>
  )
}
