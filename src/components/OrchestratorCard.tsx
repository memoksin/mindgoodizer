import { useState } from 'react'
import { OrchestratorState } from '../types'

interface Props {
  orchState: OrchestratorState
}

const VERDICT_CLASS = {
  pursue: 'badge--pass',
  refine: 'badge--caution',
  reconsider: 'badge--fail',
}

export function OrchestratorCard({ orchState }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { status, partial, result, error } = orchState

  return (
    <div className={`orch-card orch-card--${status}`}>
      <div className="card-header">
        <span className="card-name">Orchestrator</span>
        {status === 'done' && result && (
          <span className={`badge ${VERDICT_CLASS[result.overallVerdict]}`}>
            {result.overallVerdict} · {result.confidence}/10
          </span>
        )}
        {status === 'streaming' && <span className="spinner" aria-label="streaming" />}
        {status === 'idle' && (
          <span className="badge badge--idle">Waiting for agents…</span>
        )}
      </div>

      {status === 'streaming' && (
        <pre className="card-stream">{partial}<span className="cursor">▌</span></pre>
      )}

      {status === 'done' && result && (
        <>
          <p className="card-summary orch-summary">{result.oneLineSummary}</p>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide report' : 'Full report'}
          </button>
          {expanded && (
            <div className="card-details orch-details">
              {result.coreStrengths.length > 0 && (
                <section>
                  <h4>Core Strengths</h4>
                  <ul>{result.coreStrengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </section>
              )}
              {result.criticalBlindSpots.length > 0 && (
                <section>
                  <h4>Critical Blind Spots</h4>
                  <ul>{result.criticalBlindSpots.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </section>
              )}
              {result.conflicts.length > 0 && (
                <section>
                  <h4>Conflicts</h4>
                  <table className="conflicts-table">
                    <thead>
                      <tr><th>Tension</th><th>Resolution</th></tr>
                    </thead>
                    <tbody>
                      {result.conflicts.map((c, i) => (
                        <tr key={i}>
                          <td>{c.tension}</td>
                          <td>{c.resolution}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
              {result.roadmap.length > 0 && (
                <section>
                  <h4>Roadmap</h4>
                  <ol>
                    {result.roadmap.map((r, i) => (
                      <li key={i}><strong>{r.phase}:</strong> {r.action}</li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {status === 'error' && (
        <p className="error-msg">{error ?? 'Orchestrator failed'}</p>
      )}
    </div>
  )
}
