import { useEffect, useRef } from 'react'

// Attach to an element ref; calls `onOutside` when a pointerdown lands outside it.
// Replaces the repeated `ref + useState + mousedown listener` pattern.
export function useClickOutside(onOutside, active = true) {
  const ref = useRef(null)
  useEffect(() => {
    if (!active) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onOutside, active])
  return ref
}
