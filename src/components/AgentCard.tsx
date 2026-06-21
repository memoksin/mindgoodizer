import { AgentId, AgentState, AGENT_LABELS, AGENT_MOTTOS } from '../types'

interface Props {
  id: AgentId
  agentState: AgentState
  onRetry: (id: AgentId) => void
  isRunning: boolean
}

const VERDICT_CLASS = { pass: 'badge--pass', caution: 'badge--caution', fail: 'badge--fail' }
const SEVERITY_CLASS = { low: 'finding--low', med: 'finding--med', high: 'finding--high' }

export function AgentCard({ id, agentState, onRetry, isRunning }: Props) {
  const { status, partial, result, error } = agentState

  return (
    <div className={`agent-card agent-card--${status}`}>
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
            onClick={() => onRetry(id)}
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
            onClick={() => onRetry(id)}
            disabled={isRunning}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
