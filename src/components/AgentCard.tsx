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

type Verdict = 'pass' | 'caution' | 'fail'
type Severity = 'low' | 'med' | 'high'

const SEVERITY_CLASS: Record<Severity, string> = {
  low: 'finding--low',
  med: 'finding--med',
  high: 'finding--high',
}

export function AgentCard({ id, agentState, selected = true, canToggle = false, onToggle, onRetry, isRunning }: Props) {
  const { status, partial, result, error } = agentState

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

  const verdictClass = result ? `agent-card--${result.verdict}` : ''

  return (
    <div
      className={`agent-card agent-card--${status} ${verdictClass}${canToggle && !isRunning ? ' agent-card--toggleable' : ''}`}
      onClick={canToggle && !isRunning ? onToggle : undefined}
      role={canToggle && !isRunning ? 'button' : undefined}
      tabIndex={canToggle && !isRunning ? 0 : undefined}
      onKeyDown={canToggle && !isRunning ? (e) => e.key === 'Enter' && onToggle?.() : undefined}
    >
      <div className="card-header">
        <span className="card-name">{AGENT_LABELS[id]}</span>
        {status === 'done' && result && (
          <span className="card-score">{result.score}</span>
        )}
        {(status === 'streaming' || (status === 'idle' && isRunning)) && (
          <span className="spinner" aria-label="loading" />
        )}
      </div>

      <p className="card-motto">{AGENT_MOTTOS[id]}</p>

      {status === 'done' && result && (
        <div className="score-bar">
          <div
            className={`score-bar__fill score-bar__fill--${result.verdict}`}
            style={{ width: `${result.score * 10}%` }}
          />
        </div>
      )}

      {status === 'streaming' && (
        <pre className="card-stream">{partial}<span className="cursor">▌</span></pre>
      )}

      {status === 'done' && result && (
        <>
          <p className="card-summary">{result.summary}</p>

          {result.findings.length > 0 && (
            <details className="findings-details">
              <summary className="findings-summary-toggle">
                ▸ Findings ({result.findings.length})
              </summary>
              <div className="findings-list">
                {result.findings.map((f, i) => (
                  <div key={i} className={`finding ${SEVERITY_CLASS[f.severity as Severity]}`}>
                    <span className="finding-severity">{f.severity.toUpperCase()}</span>
                    {f.point}
                  </div>
                ))}
              </div>
            </details>
          )}

          {result.recommendations.length > 0 && (
            <div className="recs-section">
              <div className="recs-label">Recommendations</div>
              <ul className="recs-list">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
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
