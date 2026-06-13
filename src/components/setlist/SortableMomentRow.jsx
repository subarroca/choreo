import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MicVocal, ArrowRight, X, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SortableMomentRow({ moment, index, showId, songId, onDelete, onCopy, micAssignments }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: moment.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  const activeMicCount = micAssignments
    ? Object.values(micAssignments[moment.id] ?? {}).filter(Boolean).length
    : 0

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2 pl-8 pr-3 py-2 border-b border-gray-800/50 bg-black/20 hover:bg-black/40 border-l-2 border-l-gray-700/60 group transition-colors">
      <button {...attributes} {...listeners}
        className="text-gray-700 hover:text-gray-500 cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none shrink-0">
        <GripVertical size={16} />
      </button>
      <span className="text-xs text-gray-600 w-5 text-center shrink-0 tabular-nums">{index + 1}</span>
      <Link to={`/show/${showId}/song/${songId}/moment/${moment.id}`} className="flex-1 min-w-0 py-0.5">
        <span className="text-sm text-gray-200 font-medium block truncate">{moment.title}</span>
        {moment.subtitle && <span className="text-xs text-gray-500 block truncate">{moment.subtitle}</span>}
      </Link>
      {activeMicCount > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-gray-500 shrink-0">
          <MicVocal size={10} className="text-gray-600" />
          {activeMicCount}
        </span>
      )}
      {onCopy && (
        <button onClick={() => onCopy(moment)}
          className="text-gray-700 hover:text-cyan-400 p-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
          title="Copiar moment">
          <Copy size={14} />
        </button>
      )}
      <Link to={`/show/${showId}/song/${songId}/moment/${moment.id}`}
        className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-400 px-2.5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
        <ArrowRight size={16} />
      </Link>
      <button onClick={() => onDelete(moment.id)}
        className="text-gray-700 hover:text-red-500 p-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
