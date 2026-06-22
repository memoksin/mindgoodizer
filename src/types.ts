export type AgentId =
  | 'devils_advocate'
  | 'reality_checker'
  | 'monetizer'
  | 'pragmatist'
  | 'grandma_test'
  | 'copycat_detector'
  | 'futurist'
  | 'hidden_cost_finder'
  | 'reversibility_checker'
  | 'boredom_predictor'
  | 'beginner_blindspot_scanner'
  | 'minimum_viable_try'
  | 'key_person_risk'
  | 'prior_art_checker'
  | 'proxy_metric_detector'
  | 'thesis_vs_weekend'
  | 'real_world_distribution'
  | 'metric_validity'
  | 'reproducibility_checker'

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
  useOpus: boolean
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
  'hidden_cost_finder',
  'reversibility_checker',
  'boredom_predictor',
  'beginner_blindspot_scanner',
  'minimum_viable_try',
  'key_person_risk',
  'prior_art_checker',
  'proxy_metric_detector',
  'thesis_vs_weekend',
  'real_world_distribution',
  'metric_validity',
  'reproducibility_checker',
]

export const AGENT_LABELS: Record<AgentId, string> = {
  devils_advocate: "Devil's Advocate",
  reality_checker: 'Reality Checker',
  monetizer: 'Monetizer',
  pragmatist: 'Pragmatist',
  grandma_test: 'Grandma Test',
  copycat_detector: 'Copycat Detector',
  futurist: 'Futurist',
  hidden_cost_finder: 'The Receipt',
  reversibility_checker: 'No Take-Backs',
  boredom_predictor: 'Week Four',
  beginner_blindspot_scanner: 'The Intern',
  minimum_viable_try: 'The Napkin Test',
  key_person_risk: 'Hit By A Bus',
  prior_art_checker: 'Already On ArXiv',
  proxy_metric_detector: "Goodhart's Ghost",
  thesis_vs_weekend: 'Scope Creep',
  real_world_distribution: 'The Demo Effect',
  metric_validity: 'The Benchmark Trap',
  reproducibility_checker: 'The Replication Crisis',
}

export const AGENT_MOTTOS: Record<AgentId, string> = {
  devils_advocate: 'What could go horribly wrong?',
  reality_checker: 'Does the market actually want this?',
  monetizer: 'Show me the money.',
  pragmatist: 'Can you actually build this?',
  grandma_test: 'Would my grandma understand it?',
  copycat_detector: 'Has someone already done this?',
  futurist: 'Will this matter in 5 years?',
  hidden_cost_finder: 'What does this really cost you?',
  reversibility_checker: 'How hard is it to undo?',
  boredom_predictor: 'Will you still care in a month?',
  beginner_blindspot_scanner: 'What would a newcomer get wrong first?',
  minimum_viable_try: "What's the smallest way to test this?",
  key_person_risk: 'Who continues if you vanish?',
  prior_art_checker: 'Has this been done and abandoned?',
  proxy_metric_detector: 'Solving the problem or gaming a metric?',
  thesis_vs_weekend: 'Weekend project or three-year thesis?',
  real_world_distribution: 'Does this only work in a demo?',
  metric_validity: 'Does the metric still mean anything?',
  reproducibility_checker: 'Could anyone else reproduce this?',
}
