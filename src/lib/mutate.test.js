import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the toast before importing mutate
vi.mock('../components/ui/Toast', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}))

import { runMutation } from './mutate'
import { toast } from '../components/ui/Toast'

beforeEach(() => { vi.clearAllMocks() })

describe('runMutation', () => {
  it('calls optimistic, then persist, returns true on success', async () => {
    const optimistic = vi.fn()
    const persist = vi.fn().mockResolvedValue({})
    const ok = await runMutation({ optimistic, persist, errorMsg: 'err' })
    expect(optimistic).toHaveBeenCalledOnce()
    expect(persist).toHaveBeenCalledOnce()
    expect(ok).toBe(true)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('calls rollback and toast.error when persist returns an error', async () => {
    const optimistic = vi.fn()
    const rollback = vi.fn()
    const persist = vi.fn().mockResolvedValue({ error: new Error('db fail') })
    const ok = await runMutation({ optimistic, persist, rollback, errorMsg: 'Error!' })
    expect(rollback).toHaveBeenCalledOnce()
    expect(toast.error).toHaveBeenCalledWith('Error!')
    expect(ok).toBe(false)
  })

  it('calls rollback and toast.error when persist throws', async () => {
    const rollback = vi.fn()
    const persist = vi.fn().mockRejectedValue(new Error('boom'))
    const ok = await runMutation({ persist, rollback, errorMsg: 'Crash' })
    expect(rollback).toHaveBeenCalledOnce()
    expect(toast.error).toHaveBeenCalledWith('Crash')
    expect(ok).toBe(false)
  })

  it('shows successMsg toast on success if provided', async () => {
    await runMutation({ persist: vi.fn().mockResolvedValue({}), errorMsg: 'e', successMsg: 'Done!' })
    expect(toast.success).toHaveBeenCalledWith('Done!')
  })

  it('works without optional fields (no crash)', async () => {
    const ok = await runMutation({ persist: vi.fn().mockResolvedValue({}), errorMsg: 'e' })
    expect(ok).toBe(true)
  })
})
