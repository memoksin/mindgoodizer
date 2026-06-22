import { useContext } from 'react'
import { AppContext } from '../App'
import { AgentCard } from './AgentCard'
import { OrchestratorCard } from './OrchestratorCard'
import { AgentId, CORE_AGENTS, NICHE_AGENTS } from '../types'

const ALL_AGENTS: AgentId[] = [...CORE_AGENTS, ...NICHE_AGENTS]

export function Dashboard() {
  const { state, run, dispatch } = useContext(AppContext)
  const { config, agents, orchestrator, phase } = state

  function handleRetry(id: AgentId) {
    run(id)
  }

  return (
    <section className="dashboard">
      <OrchestratorCard orchState={orchestrator} />
      <div className="agent-grid">
        {ALL_AGENTS.map((id) => (
          <AgentCard
            key={id}
            id={id}
            agentState={agents[id]}
            selected={config.includes(id)}
            canToggle={!CORE_AGENTS.includes(id) && phase !== 'running'}
            onToggle={() => dispatch({ type: 'TOGGLE_AGENT', id })}
            onRetry={handleRetry}
            isRunning={phase === 'running'}
          />
        ))}
      </div>
    </section>
  )
}
