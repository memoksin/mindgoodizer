import {
  AgentId,
  AgentState,
  AppState,
  FilterOutput,
  HistoryRun,
  OrchestratorOutput,
  CORE_AGENTS,
} from './types'

export type Action =
  | { type: 'SET_IDEA'; idea: string }
  | { type: 'TOGGLE_AGENT'; id: AgentId }
  | { type: 'TOGGLE_OPUS' }
  | { type: 'RUN_START' }
  | { type: 'CLASSIFY'; result: 'light' | 'heavy' }
  | { type: 'AGENT_DELTA'; agent: AgentId; text: string }
  | { type: 'AGENT_DONE'; agent: AgentId; result: FilterOutput }
  | { type: 'AGENT_ERROR'; agent: AgentId; message: string }
  | { type: 'AGENT_TIMEOUT'; agent: AgentId }
  | { type: 'ORCH_DELTA'; text: string }
  | { type: 'ORCH_DONE'; result: OrchestratorOutput }
  | { type: 'ORCH_ERROR'; message: string }
  | { type: 'COMPLETE' }
  | { type: 'RETRY_AGENT'; id: AgentId }
  | { type: 'LOAD_HISTORY_RUN'; run: HistoryRun }
  | { type: 'RESET' }

const makeIdleAgent = (): AgentState => ({ status: 'idle', partial: '' })

const ALL_AGENTS: AgentId[] = [
  'devils_advocate',
  'reality_checker',
  'monetizer',
  'pragmatist',
  'grandma_test',
  'copycat_detector',
  'futurist',
]

const makeAgentMap = (): Record<AgentId, AgentState> =>
  Object.fromEntries(ALL_AGENTS.map((id) => [id, makeIdleAgent()])) as Record<
    AgentId,
    AgentState
  >

export const initialState: AppState = {
  phase: 'config',
  idea: '',
  config: [...CORE_AGENTS],
  agents: makeAgentMap(),
  orchestrator: { status: 'idle', partial: '' },
  useOpus: false,
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_IDEA':
      return { ...state, idea: action.idea }

    case 'TOGGLE_OPUS':
      return { ...state, useOpus: !state.useOpus }

    case 'TOGGLE_AGENT': {
      const inConfig = state.config.includes(action.id)
      return {
        ...state,
        config: inConfig
          ? state.config.filter((id) => id !== action.id)
          : [...state.config, action.id],
      }
    }

    case 'RUN_START':
      return {
        ...state,
        phase: 'running',
        agents: makeAgentMap(),
        orchestrator: { status: 'idle', partial: '' },
        classification: undefined,
      }

    case 'CLASSIFY':
      return { ...state, classification: action.result }

    case 'AGENT_DELTA':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: {
            ...state.agents[action.agent],
            status: 'streaming',
            partial: state.agents[action.agent].partial + action.text,
          },
        },
      }

    case 'AGENT_DONE':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: {
            status: 'done',
            partial: '',
            result: action.result,
          },
        },
      }

    case 'AGENT_ERROR':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: {
            status: 'error',
            partial: '',
            error: action.message,
          },
        },
      }

    case 'AGENT_TIMEOUT':
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: { status: 'timeout', partial: '' },
        },
      }

    case 'ORCH_DELTA':
      return {
        ...state,
        orchestrator: {
          ...state.orchestrator,
          status: 'streaming',
          partial: state.orchestrator.partial + action.text,
        },
      }

    case 'ORCH_DONE':
      return {
        ...state,
        orchestrator: {
          status: 'done',
          partial: '',
          result: action.result,
        },
      }

    case 'ORCH_ERROR':
      return {
        ...state,
        orchestrator: {
          status: 'error',
          partial: '',
          error: action.message,
        },
      }

    case 'COMPLETE':
      return { ...state, phase: 'complete' }

    case 'RETRY_AGENT':
      return {
        ...state,
        phase: 'running',
        agents: {
          ...state.agents,
          [action.id]: makeIdleAgent(),
        },
        orchestrator: { status: 'idle', partial: '' },
      }

    case 'LOAD_HISTORY_RUN': {
      const { run } = action
      const agents = makeAgentMap()
      for (const [id, result] of Object.entries(run.agentResults)) {
        if (result) {
          agents[id as AgentId] = { status: 'done', partial: '', result }
        }
      }
      return {
        phase: 'complete',
        idea: run.idea,
        config: run.config,
        agents,
        orchestrator: { status: 'done', partial: '', result: run.report },
        useOpus: state.useOpus,
      }
    }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}
