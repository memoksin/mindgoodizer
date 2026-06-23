import { OrchestratorState } from '../types'

interface Props {
  orchState: OrchestratorState
}

export function OrchestratorCard({ orchState }: Props) {
  const { status, partial, result, error } = orchState

  return (
    <div className={`orch-card orch-card--${status}`}>
      {status === 'idle' && (
        <div className="orch-header">
          <span className="orch-label">Orchestrator</span>
          <span className="badge badge--idle">Waiting for agents…</span>
        </div>
      )}

      {status === 'streaming' && (
        <>
          <div className="orch-header">
            <span className="orch-label">Orchestrator</span>
            <span className="spinner" aria-label="streaming" />
          </div>
          <pre className="card-stream">{partial}<span className="cursor">▌</span></pre>
        </>
      )}

      {status === 'done' && result && (
        <>
          <div className="orch-header">
            <span className="orch-label">Orchestrator</span>
            <span className="orch-confidence">{result.confidence}<span style={{ fontSize: 14, color: 'var(--text-4)' }}>/10</span></span>
          </div>

          <div className={`orch-verdict orch-verdict--${result.overallVerdict}`}>
            {result.overallVerdict.toUpperCase()}
          </div>

          <p className="orch-summary">{result.oneLineSummary}</p>

          <div className="orch-body">
            <div>
              <div className="orch-col-label">Core Strengths</div>
              <div className="orch-bullets">
                {result.coreStrengths.map((s, i) => (
                  <div key={i} className="orch-bullet">
                    <span className="orch-bullet-arrow orch-bullet-arrow--pass">▸</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="orch-col-label">Critical Blind Spots</div>
              <div className="orch-bullets">
                {result.criticalBlindSpots.map((s, i) => (
                  <div key={i} className="orch-bullet">
                    <span className="orch-bullet-arrow orch-bullet-arrow--fail">▸</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result.conflicts.length > 0 && (
            <div>
              <div className="orch-section-label">Conflicts</div>
              <div className="orch-conflicts">
                {result.conflicts.map((c, i) => (
                  <div key={i} className="conflict-row">
                    <span className="conflict-tension">{c.tension}</span>
                    <span className="conflict-resolution">{c.resolution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.roadmap.length > 0 && (
            <div>
              <div className="orch-section-label">Roadmap</div>
              <div className="orch-roadmap">
                {result.roadmap.map((r, i) => (
                  <div key={i} className="roadmap-item">
                    <span className="roadmap-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="roadmap-phase">{r.phase}</span>
                    <span className="roadmap-action">{r.action}</span>
                  </div>
                ))}
              </div>
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
