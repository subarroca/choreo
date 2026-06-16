import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from './useHistory'

describe('useHistory', () => {
  it('starts with canUndo=false, canRedo=false', () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('dispatch runs `do` and enables canUndo', async () => {
    const { result } = renderHook(() => useHistory())
    const doFn = vi.fn()
    const undoFn = vi.fn()
    await act(() => result.current.dispatch({ label: 'x', do: doFn, undo: undoFn }))
    expect(doFn).toHaveBeenCalledOnce()
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('undo calls command.undo and moves to future', async () => {
    const { result } = renderHook(() => useHistory())
    const doFn = vi.fn()
    const undoFn = vi.fn()
    await act(() => result.current.dispatch({ label: 'x', do: doFn, undo: undoFn }))
    await act(() => result.current.undo())
    expect(undoFn).toHaveBeenCalledOnce()
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo calls command.do again', async () => {
    const { result } = renderHook(() => useHistory())
    const doFn = vi.fn()
    const undoFn = vi.fn()
    await act(() => result.current.dispatch({ label: 'x', do: doFn, undo: undoFn }))
    await act(() => result.current.undo())
    await act(() => result.current.redo())
    expect(doFn).toHaveBeenCalledTimes(2)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('dispatch clears the future (redo stack)', async () => {
    const { result } = renderHook(() => useHistory())
    const cmd = { label: 'x', do: vi.fn(), undo: vi.fn() }
    await act(() => result.current.dispatch(cmd))
    await act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)
    await act(() => result.current.dispatch({ label: 'y', do: vi.fn(), undo: vi.fn() }))
    expect(result.current.canRedo).toBe(false)
  })

  it('clear resets both stacks', async () => {
    const { result } = renderHook(() => useHistory())
    await act(() => result.current.dispatch({ label: 'x', do: vi.fn(), undo: vi.fn() }))
    act(() => result.current.clear())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('respects MAX_HISTORY limit of 50', async () => {
    const { result } = renderHook(() => useHistory())
    for (let i = 0; i < 55; i++) {
      await act(() => result.current.dispatch({ label: `c${i}`, do: vi.fn(), undo: vi.fn() }))
    }
    // undo 50 times should reach canUndo=false at exactly 50
    for (let i = 0; i < 50; i++) {
      await act(() => result.current.undo())
    }
    expect(result.current.canUndo).toBe(false)
  })
})
