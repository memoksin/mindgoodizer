import { AgentId, AgentState, AGENT_LABELS, AGENT_MOTTOS } from '../types'

interface Props {
  id: AgentId
  agentState: AgentState
  selected?: boolean
  canToggle?: boolean
  onToggle?: () => void
  onRetry: (id: AgentId) => void
  isRunning: boolean
}

const VERDICT_CLASS = { pass: 'badge--pass', caution: 'badge--caution', fail: 'badge--fail' }
const SEVERITY_CLASS = { low: 'finding--low', med: 'finding--med', high: 'finding--high' }

export function AgentCard({ id, agentState, selected = true, canToggle = false, onToggle, onRetry, isRunning }: Props) {
  const { status, partial, result, error } = agentState

  // Unselected: show an inert preview (name + motto) so users see what the agent does.
  // Click to enable when toggling is allowed (niche agent, not mid-run).
  if (!selected) {
    return (
      <button
        type="button"
        className="agent-card agent-card--off"
        onClick={canToggle ? onToggle : undefined}
        disabled={!canToggle}
        aria-pressed={false}
      >
        <div className="card-header">
          <span className="card-name">{AGENT_LABELS[id]}</span>
          <span className="badge badge--off">off</span>
        </div>
        <p className="card-motto">{AGENT_MOTTOS[id]}</p>
        {canToggle && <span className="card-enable-hint">Click to enable</span>}
      </button>
    )
  }

  return (
    <div
      className={`agent-card agent-card--${status}${canToggle && !isRunning ? ' agent-card--toggleable' : ''}`}
      onClick={canToggle && !isRunning ? onToggle : undefined}
      role={canToggle && !isRunning ? 'button' : undefined}
      tabIndex={canToggle && !isRunning ? 0 : undefined}
      onKeyDown={canToggle && !isRunning ? (e) => e.key === 'Enter' && onToggle?.() : undefined}
    >
      <div className="card-header">
        <span className="card-name">{AGENT_LABELS[id]}</span>
        {status === 'done' && result && (
          <span className={`badge ${VERDICT_CLASS[result.verdict]}`}>
            {result.verdict} · {result.score}/10
          </span>
        )}
        {(status === 'streaming' || (status === 'idle' && isRunning)) && (
          <span className="spinner" aria-label="loading" />
        )}
      </div>

      <p className="card-motto">{AGENT_MOTTOS[id]}</p>

      {status === 'streaming' && (
        <pre className="card-stream">{partial}<span className="cursor">▌</span></pre>
      )}

      {status === 'done' && result && (
        <>
          <p className="card-summary">{result.summary}</p>
          <div className="card-details">
            {result.findings.length > 0 && (
              <>
                <h4>Findings</h4>
                <ul>
                  {result.findings.map((f, i) => (
                    <li key={i} className={`finding ${SEVERITY_CLASS[f.severity]}`}>
                      <span className="finding-severity">{f.severity}</span> {f.point}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {result.recommendations.length > 0 && (
              <>
                <h4>Recommendations</h4>
                <ul>
                  {result.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="card-error">
          <span className="error-msg">{error ?? 'Agent failed'}</span>
          <button
            className="btn btn--danger btn--sm"
            onClick={(e) => { e.stopPropagation(); onRetry(id) }}
            disabled={isRunning}
          >
            Retry
          </button>
        </div>
      )}

      {status === 'timeout' && (
        <div className="card-timeout">
          <span>Timed out</span>
          <button
            className="btn btn--warning btn--sm"
            onClick={(e) => { e.stopPropagation(); onRetry(id) }}
            disabled={isRunning}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
