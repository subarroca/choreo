import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical, Pencil, X, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import SortableMomentRow from './SortableMomentRow'
import { formatDuration } from './SongForm'
import { repertoireType, isSongType } from '../../lib/repertoireTypes'

export default function SortableSong({ song, moments, expanded, onToggle, onEdit, onDelete, onAddMoment, onDeleteMoment, onReorderMoments, showId, activeDragId, repSong, micAssignments }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  const isOtherDragging = activeDragId && activeDragId !== song.id
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : isOtherDragging ? 0.4 : 1,
  }

  const momentSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleMomentDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = moments.findIndex(m => m.id === active.id)
    const newIndex = moments.findIndex(m => m.id === over.id)
    onReorderMoments(song.id, arrayMove(moments, oldIndex, newIndex))
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Song header */}
      <div className="flex items-center gap-1.5 px-2 min-h-[52px]">
        <button {...attributes} {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-2 touch-none shrink-0">
          <GripVertical size={15} />
        </button>
        <button onClick={onToggle} className="text-gray-500 hover:text-white p-2 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {repSong && !isSongType(repSong.type) && (() => {
          const rt = repertoireType(repSong.type)
          const Icon = rt.icon
          return <Icon size={14} className={`${rt.color} shrink-0`} />
        })()}
        <button onClick={onToggle}
          className="flex-1 text-left min-w-0 py-2">
          <span className="text-sm font-medium text-white block truncate">
            {repSong ? repSong.title : song.title}
          </span>
          <span className="text-xs text-gray-500 block truncate">
            {repSong?.composer && <span className="text-gray-600">{repSong.composer}</span>}
            {repSong?.composer && song.notes && <span className="text-gray-700"> · </span>}
            {song.notes}
          </span>
        </button>
        {song.duration_seconds > 0 && (
          <span className="text-xs text-gray-500 shrink-0 tabular-nums">{formatDuration(song.duration_seconds)}</span>
        )}
        <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full shrink-0 tabular-nums">
          {moments.length}m
        </span>
        <button onClick={() => onEdit(song)}
          className="text-gray-500 hover:text-white p-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-gray-600 hover:text-red-500 p-2.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* Moments list */}
      {expanded && (
        <div className="border-t border-gray-800">
          {moments.length === 0
            ? <p className="px-4 py-3 text-xs text-gray-600 italic">Sense moments</p>
            : (
              <DndContext sensors={momentSensors} collisionDetection={closestCenter} onDragEnd={handleMomentDragEnd}>
                <SortableContext items={moments.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  {moments.map((m, i) => (
                    <SortableMomentRow key={m.id} moment={m} index={i}
                      showId={showId} songId={song.id}
                      onDelete={onDeleteMoment} micAssignments={micAssignments} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          <button onClick={() => onAddMoment(song.id, false)}
            className="flex items-center gap-1.5 w-full px-4 py-3 text-xs text-cyan-600 hover:text-cyan-400 hover:bg-gray-800 transition-colors border-t border-gray-800">
            <Plus size={12} /> Afegir moment
          </button>
          {song.lyrics && (
            <details className="border-t border-gray-800 group">
              <summary className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer list-none flex items-center gap-1.5 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                Lletra
              </summary>
              <pre className="px-4 pb-4 text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">{song.lyrics}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
