import { useDroppable } from '@dnd-kit/core'

export default function DroppableSongZone({ id, children, isEmpty }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef}
      className={`space-y-2 rounded-xl transition-colors ${isOver ? 'bg-cyan-950/30 ring-1 ring-cyan-700/50' : ''} ${isEmpty && isOver ? 'min-h-[60px]' : ''}`}>
      {children}
    </div>
  )
}
