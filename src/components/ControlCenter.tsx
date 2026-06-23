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
      <div className="cc-left">
        <div>
          <h1 className="cc-heading">Mindgoodizer</h1>
          <p className="cc-sub">Throw your idea at a panel of brutal critics.</p>
        </div>

        <textarea
          className="idea-input"
          placeholder="Describe your idea… (min 20 chars)"
          value={state.idea}
          onChange={(e) => dispatch({ type: 'SET_IDEA', idea: e.target.value })}
          disabled={isRunning}
          rows={5}
        />

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
            <small>Max reasoning. Higher cost.</small>
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
          {state.classification && (
            <span className={`badge badge--classify badge--${state.classification}`}>
              {state.classification === 'heavy' ? '⚡ Heavy' : '✦ Light'}
            </span>
          )}
        </div>
      </div>

      <div className="cc-right">
        <div>
          <div className="agents-section-label">Core agents (always on)</div>
          <div className="core-grid">
            {CORE_AGENTS.map((id) => (
              <div key={id} className="core-cell">
                <span className="core-dot" />
                {AGENT_LABELS[id]}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="agents-section-label">Niche agents (optional)</div>
          <div className="niche-well">
            {NICHE_AGENTS.map((id) => {
              const checked = state.config.includes(id)
              return (
                <label key={id} className={`niche-cell ${checked ? 'niche-cell--on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNiche(id)}
                    disabled={isRunning}
                  />
                  <span className="niche-dot" />
                  {AGENT_LABELS[id]}
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
