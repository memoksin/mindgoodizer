import { Dispatch, useCallback, useRef } from 'react'
import { Action } from './state'
import { AgentId, AppState, FilterOutput, OrchestratorOutput } from './types'
import { saveRun } from './db'

export function useSSE(
  state: AppState,
  dispatch: Dispatch<Action>,
  onError: (msg: string) => void,
) {
  const abortRef = useRef<AbortController | null>(null)

  const run = useCallback(
    async (retryAgent?: AgentId) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      if (retryAgent) {
        dispatch({ type: 'RETRY_AGENT', id: retryAgent })
      } else {
        dispatch({ type: 'RUN_START' })
      }

      const agents = retryAgent ? [retryAgent] : state.config

      try {
        const res = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: state.idea, agents, useOpus: state.useOpus }),
          signal: ctrl.signal,
        })

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => '')
          throw new Error(`Server ${res.status}: ${errText || res.statusText}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let orchResult: OrchestratorOutput | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            // SSE format: "data: {...}"
            const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed
            if (!jsonStr) continue
            let msg: Record<string, unknown>
            try {
              msg = JSON.parse(jsonStr)
            } catch {
              continue
            }

            if (msg.type === 'classify') {
              dispatch({ type: 'CLASSIFY', result: msg.result as 'light' | 'heavy' })
            } else if (msg.type === 'delta' && msg.agent) {
              dispatch({
                type: 'AGENT_DELTA',
                agent: msg.agent as AgentId,
                text: (msg.text as string) ?? '',
              })
            } else if (msg.type === 'done' && msg.agent) {
              try {
                const result = JSON.parse(msg.result as string) as FilterOutput
                dispatch({ type: 'AGENT_DONE', agent: msg.agent as AgentId, result })
              } catch {
                dispatch({
                  type: 'AGENT_ERROR',
                  agent: msg.agent as AgentId,
                  message: 'Invalid JSON from agent',
                })
              }
            } else if (msg.type === 'error' && msg.agent) {
              const message = (msg.message as string) ?? 'Unknown error'
              const isTimeout = message.toLowerCase().includes('timeout')
              if (isTimeout) {
                dispatch({ type: 'AGENT_TIMEOUT', agent: msg.agent as AgentId })
              } else {
                dispatch({ type: 'AGENT_ERROR', agent: msg.agent as AgentId, message })
              }
            } else if (msg.type === 'orchestrator_delta') {
              dispatch({ type: 'ORCH_DELTA', text: (msg.text as string) ?? '' })
            } else if (msg.type === 'orchestrator_done') {
              try {
                orchResult = JSON.parse(msg.result as string) as OrchestratorOutput
                dispatch({ type: 'ORCH_DONE', result: orchResult })
              } catch {
                dispatch({ type: 'ORCH_ERROR', message: 'Invalid JSON from orchestrator' })
              }
            } else if (msg.type === 'orchestrator_error') {
              dispatch({ type: 'ORCH_ERROR', message: (msg.message as string) ?? 'Orchestrator failed' })
            } else if (msg.type === 'complete') {
              dispatch({ type: 'COMPLETE' })
              if (orchResult) {
                const agentResults = Object.fromEntries(
                  state.config.map((id) => [id, state.agents[id]?.result ?? null])
                )
                await saveRun({
                  id: crypto.randomUUID(),
                  idea: state.idea,
                  config: state.config,
                  agentResults,
                  report: orchResult,
                  createdAt: Date.now(),
                })
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onError(String((err as Error).message ?? err))
          dispatch({ type: 'RESET' })
        }
      }
    },
    [state, dispatch, onError]
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { run, abort }
}
