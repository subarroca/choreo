import { useRef, useState, useCallback } from 'react'

const MAX_HISTORY = 50

export function useEditorHistory(applyPlacements) {
  const past = useRef([])
  const future = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  function sync() {
    setCanUndo(past.current.length > 0)
    setCanRedo(future.current.length > 0)
  }

  // Call this instead of applyPlacements to record history
  const applyWithHistory = useCallback((next, currentSnapshot) => {
    if (currentSnapshot !== undefined) {
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), currentSnapshot]
      future.current = []
    }
    applyPlacements(next)
    sync()
  }, [applyPlacements])

  const undo = useCallback((currentPlacements) => {
    if (!past.current.length) return
    const prev = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [currentPlacements, ...future.current.slice(0, MAX_HISTORY - 1)]
    applyPlacements(prev)
    sync()
  }, [applyPlacements])

  const redo = useCallback((currentPlacements) => {
    if (!future.current.length) return
    const next = future.current[0]
    future.current = future.current.slice(1)
    past.current = [...past.current.slice(-(MAX_HISTORY - 1)), currentPlacements]
    applyPlacements(next)
    sync()
  }, [applyPlacements])

  return { applyWithHistory, undo, redo, canUndo, canRedo }
}
