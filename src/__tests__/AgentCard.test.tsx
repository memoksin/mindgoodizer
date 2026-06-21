import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AgentCard } from '../components/AgentCard'
import { AgentState } from '../types'

const baseState = (overrides: Partial<AgentState>): AgentState => ({
  status: 'idle',
  partial: '',
  ...overrides,
})

describe('AgentCard', () => {
  it('shows motto when idle', () => {
    render(<AgentCard id="futurist" agentState={baseState({ status: 'idle' })} onRetry={vi.fn()} isRunning={false} />)
    expect(screen.getByText(/5 years/i)).toBeInTheDocument()
  })

  it('shows partial text when streaming', () => {
    render(<AgentCard id="futurist" agentState={baseState({ status: 'streaming', partial: 'hello...' })} onRetry={vi.fn()} isRunning={false} />)
    expect(screen.getByText(/hello/)).toBeInTheDocument()
  })

  it('shows verdict badge when done', () => {
    render(<AgentCard id="futurist" agentState={baseState({
      status: 'done',
      result: { verdict: 'pass', score: 9, summary: 'Great', findings: [], recommendations: [] }
    })} onRetry={vi.fn()} isRunning={false} />)
    expect(screen.getByText(/pass/i)).toBeInTheDocument()
  })

  it('shows Retry button on error', () => {
    const onRetry = vi.fn()
    render(<AgentCard id="futurist" agentState={baseState({ status: 'error', error: 'boom' })} onRetry={onRetry} isRunning={false} />)
    fireEvent.click(screen.getByText('Retry'))
    expect(onRetry).toHaveBeenCalledWith('futurist')
  })

  it('shows Retry button on timeout', () => {
    const onRetry = vi.fn()
    render(<AgentCard id="futurist" agentState={baseState({ status: 'timeout' })} onRetry={onRetry} isRunning={false} />)
    fireEvent.click(screen.getByText('Retry'))
    expect(onRetry).toHaveBeenCalledWith('futurist')
  })
})
