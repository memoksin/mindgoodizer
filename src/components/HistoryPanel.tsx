import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../App'
import { HistoryRun } from '../types'
import { clearAll, deleteRun, getRuns } from '../db'

const VERDICT_CLASS = {
  pursue: 'badge--pass',
  refine: 'badge--caution',
  reconsider: 'badge--fail',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel() {
  const { dispatch } = useContext(AppContext)
  const [open, setOpen] = useState(false)
  const [runs, setRuns] = useState<HistoryRun[]>([])

  useEffect(() => {
    if (open) {
      getRuns().then(setRuns).catch(console.error)
    }
  }, [open])

  async function handleDelete(id: string) {
    if (!confirm('Delete this run?')) return
    await deleteRun(id)
    setRuns((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleClearAll() {
    if (!confirm('Delete all history? This cannot be undone.')) return
    await clearAll()
    setRuns([])
  }

  function handleLoad(run: HistoryRun) {
    dispatch({ type: 'LOAD_HISTORY_RUN', run })
    setOpen(false)
  }

  return (
    <>
      <button className="btn btn--ghost history-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close history' : 'History'}
      </button>

      {open && (
        <aside className="history-panel">
          <div className="history-header">
            <h2>History</h2>
            {runs.length > 0 && (
              <button className="btn btn--danger btn--sm" onClick={handleClearAll}>
                Clear all
              </button>
            )}
          </div>

          {runs.length === 0 ? (
            <p className="history-empty">No runs yet.</p>
          ) : (
            <ul className="history-list">
              {runs.map((run) => (
                <li key={run.id} className="history-item">
                  <button className="history-load" onClick={() => handleLoad(run)}>
                    <span className="history-snippet">
                      {run.idea.slice(0, 60)}{run.idea.length > 60 ? '…' : ''}
                    </span>
                    <span className="history-meta">
                      <span className={`badge ${VERDICT_CLASS[run.report.overallVerdict]}`}>
                        {run.report.overallVerdict}
                      </span>
                      <span className="history-date">{formatDate(run.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    className="btn btn--danger btn--sm history-delete"
                    onClick={() => handleDelete(run.id)}
                    aria-label="Delete run"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </>
  )
}
