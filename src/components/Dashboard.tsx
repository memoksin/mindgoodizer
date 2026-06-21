import { useContext } from 'react'
import { AppContext } from '../App'
import { AgentCard } from './AgentCard'
import { OrchestratorCard } from './OrchestratorCard'
import { AgentId } from '../types'

export function Dashboard() {
  const { state, run } = useContext(AppContext)
  const { config, agents, orchestrator, phase } = state

  if (phase === 'config') return null

  function handleRetry(id: AgentId) {
    run(id)
  }

  return (
    <section className="dashboard">
      <div className="agent-grid">
        {config.map((id) => (
          <AgentCard
            key={id}
            id={id}
            agentState={agents[id]}
            onRetry={handleRetry}
            isRunning={phase === 'running'}
          />
        ))}
      </div>
      <OrchestratorCard orchState={orchestrator} />
    </section>
  )
}
