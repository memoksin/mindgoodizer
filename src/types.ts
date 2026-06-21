export type AgentId =
  | 'devils_advocate'
  | 'reality_checker'
  | 'monetizer'
  | 'pragmatist'
  | 'grandma_test'
  | 'copycat_detector'
  | 'futurist'

export type AgentStatus = 'idle' | 'streaming' | 'done' | 'error' | 'timeout'
export type AppPhase = 'config' | 'running' | 'complete'

export interface FilterOutput {
  verdict: 'pass' | 'caution' | 'fail'
  score: number
  summary: string
  findings: { point: string; severity: 'low' | 'med' | 'high' }[]
  recommendations: string[]
}

export interface OrchestratorOutput {
  overallVerdict: 'pursue' | 'refine' | 'reconsider'
  confidence: number
  oneLineSummary: string
  coreStrengths: string[]
  criticalBlindSpots: string[]
  conflicts: { tension: string; resolution: string }[]
  roadmap: { phase: string; action: string }[]
}

export interface AgentState {
  status: AgentStatus
  partial: string
  result?: FilterOutput
  error?: string
}

export interface OrchestratorState {
  status: AgentStatus
  partial: string
  result?: OrchestratorOutput
  error?: string
}

export interface AppState {
  phase: AppPhase
  idea: string
  config: AgentId[]
  agents: Record<AgentId, AgentState>
  orchestrator: OrchestratorState
  classification?: 'light' | 'heavy'
}

export interface HistoryRun {
  id: string
  idea: string
  config: AgentId[]
  agentResults: Partial<Record<AgentId, FilterOutput>>
  report: OrchestratorOutput
  createdAt: number
}

export const CORE_AGENTS: AgentId[] = [
  'devils_advocate',
  'reality_checker',
  'monetizer',
  'pragmatist',
]

export const NICHE_AGENTS: AgentId[] = [
  'grandma_test',
  'copycat_detector',
  'futurist',
]

export const AGENT_LABELS: Record<AgentId, string> = {
  devils_advocate: "Devil's Advocate",
  reality_checker: 'Reality Checker',
  monetizer: 'Monetizer',
  pragmatist: 'Pragmatist',
  grandma_test: 'Grandma Test',
  copycat_detector: 'Copycat Detector',
  futurist: 'Futurist',
}

export const AGENT_MOTTOS: Record<AgentId, string> = {
  devils_advocate: 'What could go horribly wrong?',
  reality_checker: 'Does the market actually want this?',
  monetizer: 'Show me the money.',
  pragmatist: 'Can you actually build this?',
  grandma_test: 'Would my grandma understand it?',
  copycat_detector: 'Has someone already done this?',
  futurist: 'Will this matter in 5 years?',
}
