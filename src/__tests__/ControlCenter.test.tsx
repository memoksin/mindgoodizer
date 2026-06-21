import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppContext } from '../App'
import { ControlCenter } from '../components/ControlCenter'
import { initialState } from '../state'

function renderWithCtx(stateOverride = {}, run = vi.fn()) {
  const dispatch = vi.fn()
  const state = { ...initialState, ...stateOverride }
  return render(
    <AppContext.Provider value={{ state, dispatch, run }}>
      <ControlCenter />
    </AppContext.Provider>
  )
}

describe('ControlCenter', () => {
  it('Run button disabled when idea < 20 chars', () => {
    renderWithCtx({ idea: 'short' })
    expect(screen.getByRole('button', { name: /run/i })).toBeDisabled()
  })

  it('Run button enabled when idea >= 20 chars', () => {
    renderWithCtx({ idea: 'A'.repeat(20) })
    expect(screen.getByRole('button', { name: /run/i })).not.toBeDisabled()
  })

  it('Run button disabled during running phase', () => {
    renderWithCtx({ idea: 'A'.repeat(20), phase: 'running' })
    expect(screen.getByRole('button', { name: /evaluating/i })).toBeDisabled()
  })

  it('clicking Run calls run()', () => {
    const run = vi.fn()
    renderWithCtx({ idea: 'A'.repeat(20) }, run)
    fireEvent.click(screen.getByRole('button', { name: /run/i }))
    expect(run).toHaveBeenCalledOnce()
  })

  it('shows New idea button in complete phase', () => {
    renderWithCtx({ idea: 'A'.repeat(20), phase: 'complete' })
    expect(screen.getByText('New idea')).toBeInTheDocument()
  })
})
