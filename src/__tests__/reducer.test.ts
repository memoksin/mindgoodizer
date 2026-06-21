import { describe, it, expect } from 'vitest'
import { reducer, initialState } from '../state'
import { FilterOutput, OrchestratorOutput } from '../types'

const FILTER: FilterOutput = {
  verdict: 'pass',
  score: 8,
  summary: 'Solid idea.',
  findings: [{ point: 'Good timing', severity: 'low' }],
  recommendations: ['Go for it'],
}

const ORCH: OrchestratorOutput = {
  overallVerdict: 'pursue',
  confidence: 9,
  oneLineSummary: 'Ship it.',
  coreStrengths: ['Unique'],
  criticalBlindSpots: ['Funding'],
  conflicts: [],
  roadmap: [{ phase: 'Test', action: 'Run a pilot' }],
}

describe('reducer', () => {
  it('SET_IDEA updates idea without mutating', () => {
    const next = reducer(initialState, { type: 'SET_IDEA', idea: 'My idea' })
    expect(next.idea).toBe('My idea')
    expect(initialState.idea).toBe('')
    expect(next).not.toBe(initialState)
  })

  it('TOGGLE_AGENT adds niche agent', () => {
    const next = reducer(initialState, { type: 'TOGGLE_AGENT', id: 'futurist' })
    expect(next.config).toContain('futurist')
  })

  it('TOGGLE_AGENT removes already-present agent', () => {
    const withFuturist = reducer(initialState, { type: 'TOGGLE_AGENT', id: 'futurist' })
    const without = reducer(withFuturist, { type: 'TOGGLE_AGENT', id: 'futurist' })
    expect(without.config).not.toContain('futurist')
  })

  it('RUN_START sets phase to running and resets agents', () => {
    const next = reducer(initialState, { type: 'RUN_START' })
    expect(next.phase).toBe('running')
    expect(next.agents.devils_advocate.status).toBe('idle')
    expect(next.orchestrator.status).toBe('idle')
  })

  it('AGENT_DELTA accumulates partial text', () => {
    const s1 = reducer(initialState, { type: 'AGENT_DELTA', agent: 'monetizer', text: 'hello' })
    const s2 = reducer(s1, { type: 'AGENT_DELTA', agent: 'monetizer', text: ' world' })
    expect(s2.agents.monetizer.partial).toBe('hello world')
    expect(s2.agents.monetizer.status).toBe('streaming')
  })

  it('AGENT_DONE sets result and clears partial', () => {
    const next = reducer(initialState, { type: 'AGENT_DONE', agent: 'monetizer', result: FILTER })
    expect(next.agents.monetizer.status).toBe('done')
    expect(next.agents.monetizer.result).toEqual(FILTER)
    expect(next.agents.monetizer.partial).toBe('')
  })

  it('AGENT_ERROR records message', () => {
    const next = reducer(initialState, { type: 'AGENT_ERROR', agent: 'pragmatist', message: 'oops' })
    expect(next.agents.pragmatist.status).toBe('error')
    expect(next.agents.pragmatist.error).toBe('oops')
  })

  it('AGENT_TIMEOUT sets timeout status', () => {
    const next = reducer(initialState, { type: 'AGENT_TIMEOUT', agent: 'futurist' })
    expect(next.agents.futurist.status).toBe('timeout')
  })

  it('ORCH_DONE sets orchestrator result', () => {
    const next = reducer(initialState, { type: 'ORCH_DONE', result: ORCH })
    expect(next.orchestrator.status).toBe('done')
    expect(next.orchestrator.result).toEqual(ORCH)
  })

  it('COMPLETE sets phase to complete', () => {
    const next = reducer(initialState, { type: 'COMPLETE' })
    expect(next.phase).toBe('complete')
  })

  it('RESET returns to initial config', () => {
    const dirty = reducer(initialState, { type: 'SET_IDEA', idea: 'test' })
    const reset = reducer(dirty, { type: 'RESET' })
    expect(reset.idea).toBe('')
    expect(reset.phase).toBe('config')
  })

  it('LOAD_HISTORY_RUN reconstructs done state', () => {
    const run = {
      id: '1',
      idea: 'Old idea',
      config: ['devils_advocate' as const],
      agentResults: { devils_advocate: FILTER },
      report: ORCH,
      createdAt: 0,
    }
    const next = reducer(initialState, { type: 'LOAD_HISTORY_RUN', run })
    expect(next.phase).toBe('complete')
    expect(next.idea).toBe('Old idea')
    expect(next.agents.devils_advocate.status).toBe('done')
    expect(next.orchestrator.result).toEqual(ORCH)
  })
})
