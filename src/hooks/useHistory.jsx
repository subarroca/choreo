import { useRef, useState, useCallback, useEffect, createContext, useContext } from 'react'

const MAX_HISTORY = 50

// Generic, per-context undo/redo built on the command pattern.
//
// A command is `{ label, do, undo }` where `do` and `undo` are (optionally
// async) functions that BOTH apply the change AND persist it — typically by
// wrapping a `runMutation(...)` call. `dispatch` runs `do` and records the
// command; `undo`/`redo` replay `undo`/`do`. Each page/area gets its own stack,
// so undo only affects what you are currently editing.
//
//   const history = useHistory()
//   history.dispatch({
//     label: 'move',
//     do:   () => applyPlacements(next),
//     undo: () => applyPlacements(prev),
//   })
export function useHistory() {
  const past = useRef([])
  const future = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const busy = useRef(false)

  const sync = useCallback(() => {
    setCanUndo(past.current.length > 0)
    setCanRedo(future.current.length > 0)
  }, [])

  const dispatch = useCallback(async (command) => {
    past.current = [...past.current.slice(-(MAX_HISTORY - 1)), command]
    future.current = []
    sync()
    await command.do()
  }, [sync])

  const undo = useCallback(async () => {
    if (busy.current || !past.current.length) return
    busy.current = true
    try {
      const command = past.current[past.current.length - 1]
      past.current = past.current.slice(0, -1)
      future.current = [command, ...future.current.slice(0, MAX_HISTORY - 1)]
      sync()
      await command.undo()
    } finally {
      busy.current = false
    }
  }, [sync])

  const redo = useCallback(async () => {
    if (busy.current || !future.current.length) return
    busy.current = true
    try {
      const command = future.current[0]
      future.current = future.current.slice(1)
      past.current = [...past.current.slice(-(MAX_HISTORY - 1)), command]
      sync()
      await command.do()
    } finally {
      busy.current = false
    }
  }, [sync])

  const clear = useCallback(() => {
    past.current = []
    future.current = []
    sync()
  }, [sync])

  return { dispatch, undo, redo, clear, canUndo, canRedo }
}

// Global Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z bound to a given history instance.
// Ignores keystrokes while the user is typing in an input/textarea.
export function useHistoryHotkeys({ undo, redo }) {
  useEffect(() => {
    function onKey(e) {
      const key = e.key.toLowerCase()
      if (key !== 'z' || !(e.metaKey || e.ctrlKey)) return
      const el = document.activeElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])
}

// Optional context so deep children can share one history stack per area.
const HistoryContext = createContext(null)

export function HistoryProvider({ value, children }) {
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export function useHistoryContext() {
  return useContext(HistoryContext)
}
