import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from '../../lib/icons'

export default function SortableRow({ id, label, elevation, onEdit, onEditElevation, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-1">
      <button {...attributes} {...listeners}
        className="text-gray-700 hover:text-muted cursor-grab active:cursor-grabbing shrink-0 touch-none p-1.5 -ml-1">
        <GripVertical size={14} />
      </button>
      <input value={label} onChange={e => onEdit(e.target.value)}
        className="flex-1 min-w-0 bg-fill border border-line rounded px-1.5 py-1.5 text-xs text-body focus:outline-none focus:border-cyan-500" />
      <input value={elevation ?? 0} onChange={e => onEditElevation(e.target.value)}
        type="number" min="0" max="300" step="5"
        className="w-12 bg-fill border border-line rounded px-1 py-1.5 text-xs text-soft focus:outline-none focus:border-cyan-500 tabular-nums"
        title="Alçada de la tarima (cm)" />
      <span className="text-xs text-gray-700 shrink-0">cm</span>
      <button onClick={onRemove} className="text-ghost hover:text-red-500 shrink-0 p-1.5 -mr-1">
        <X size={14} />
      </button>
    </div>
  )
}
