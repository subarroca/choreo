import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical, Pencil, X, ChevronDown, ChevronRight, Plus, MessageSquare, Info, Clipboard } from 'lucide-react'
import SortableMomentRow from './SortableMomentRow'
import { formatDuration } from './SongForm'
import { repertoireType, isSongType } from '../../lib/repertoireTypes'

function TextItem({ song, members, onEdit, onDelete, listeners, attributes, style }) {
  const speakerIds = song.speakers ? JSON.parse(song.speakers) : []
  const speakerNames = speakerIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean)
    .map(m => m.first_name || m.name.split(' ')[0])
  return (
    <div style={style} className="bg-pane border border-emerald-900/50 rounded-xl overflow-hidden">
      <div className="flex items-start gap-1.5 px-2 py-2.5 min-h-[48px]">
        <button {...attributes} {...listeners}
          className="text-ghost hover:text-muted cursor-grab active:cursor-grabbing p-2 touch-none shrink-0 mt-0.5">
          <GripVertical size={14} />
        </button>
        <MessageSquare size={14} className="text-emerald-500 shrink-0 mt-1" />
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-sm font-medium text-body leading-snug">{song.title}</p>
          {speakerNames.length > 0 && (
            <p className="text-xs text-emerald-400 mt-0.5">{speakerNames.join(', ')}</p>
          )}
          {song.body && (
            <p className="text-xs text-faint mt-1 line-clamp-2 whitespace-pre-line">{song.body}</p>
          )}
        </div>
        <button onClick={() => onEdit(song)}
          className="text-faint hover:text-body p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function IndicationItem({ song, onEdit, onDelete, listeners, attributes, style }) {
  return (
    <div style={style} className="bg-pane border border-amber-900/50 rounded-xl overflow-hidden">
      <div className="flex items-start gap-1.5 px-2 py-2.5 min-h-[48px]">
        <button {...attributes} {...listeners}
          className="text-ghost hover:text-muted cursor-grab active:cursor-grabbing p-2 touch-none shrink-0 mt-0.5">
          <GripVertical size={14} />
        </button>
        <Info size={14} className="text-amber-500 shrink-0 mt-1" />
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-sm font-medium text-body leading-snug">{song.title}</p>
          {song.body && (
            <p className="text-xs text-faint mt-1 line-clamp-2 whitespace-pre-line">{song.body}</p>
          )}
        </div>
        <button onClick={() => onEdit(song)}
          className="text-faint hover:text-body p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function SortableSong({
  song, moments, expanded, onToggle, onEdit, onDelete, onAddMoment,
  onDeleteMoment, onReorderMoments, showId, activeDragId, repSong, micAssignments, members,
  copiedMoment, onCopyMoment, onPasteMoment, positionsByMoment, diffByMoment, gridRows, gridCols,
}) {
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

  const type = song.type ?? 'song'

  if (type === 'text') {
    return (
      <div ref={setNodeRef}>
        <TextItem song={song} members={members ?? []} onEdit={onEdit} onDelete={onDelete}
          listeners={listeners} attributes={attributes} style={style} />
      </div>
    )
  }

  if (type === 'indication') {
    return (
      <div ref={setNodeRef}>
        <IndicationItem song={song} onEdit={onEdit} onDelete={onDelete}
          listeners={listeners} attributes={attributes} style={style} />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-pane border border-rim rounded-xl overflow-hidden">
      {/* Song header */}
      <div className="flex items-center gap-1.5 px-2 min-h-[52px]">
        <button {...attributes} {...listeners}
          className="text-ghost hover:text-muted cursor-grab active:cursor-grabbing p-2 touch-none shrink-0">
          <GripVertical size={15} />
        </button>
        <button onClick={onToggle} className="text-faint hover:text-body p-2 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {repSong && !isSongType(repSong.type) && (() => {
          const rt = repertoireType(repSong.type)
          const Icon = rt.icon
          return <Icon size={14} className={`${rt.color} shrink-0`} />
        })()}
        <button onClick={onToggle} className="flex-1 text-left min-w-0 py-2">
          <span className="text-sm font-medium text-body block truncate">
            {repSong ? repSong.title : song.title}
          </span>
          <span className="text-xs text-faint block truncate">
            {repSong?.composer && <span className="text-ghost">{repSong.composer}</span>}
            {repSong?.composer && song.notes && <span className="text-gray-700"> · </span>}
            {song.notes}
          </span>
        </button>
        {song.duration_seconds > 0 && (
          <span className="text-xs text-faint shrink-0 tabular-nums">{formatDuration(song.duration_seconds)}</span>
        )}
        <span className="text-xs text-faint bg-fill px-2.5 py-1 rounded-full shrink-0 tabular-nums">
          {moments.length}m
        </span>
        <button onClick={() => onEdit(song)}
          className="text-faint hover:text-body p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* Moments list */}
      {expanded && (
        <div className="border-t border-rim">
          {moments.length === 0
            ? <p className="px-4 py-3 text-xs text-ghost italic">Sense moments</p>
            : (
              <DndContext sensors={momentSensors} collisionDetection={closestCenter} onDragEnd={handleMomentDragEnd}>
                <SortableContext items={moments.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  {moments.map((m, i) => (
                    <SortableMomentRow key={m.id} moment={m} index={i}
                      showId={showId} songId={song.id}
                      onDelete={onDeleteMoment} onCopy={onCopyMoment}
                      micAssignments={micAssignments}
                      positions={positionsByMoment?.[m.id]}
                      changedMembers={diffByMoment?.[m.id]}
                      gridRows={gridRows} gridCols={gridCols} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          <div className="flex border-t border-rim">
            <button onClick={() => onAddMoment(song.id, false)}
              className="flex items-center gap-1.5 flex-1 px-4 py-3 text-xs text-cyan-600 hover:text-cyan-400 hover:bg-fill transition-colors">
              <Plus size={12} /> Afegir moment
            </button>
            {copiedMoment && onPasteMoment && (
              <button onClick={() => onPasteMoment(song.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-xs text-violet-500 hover:text-violet-300 hover:bg-fill transition-colors border-l border-rim"
                title={`Enganxar "${copiedMoment.title}"`}>
                <Clipboard size={12} /> Enganxar
              </button>
            )}
          </div>
          {song.lyrics && (
            <details className="border-t border-rim group">
              <summary className="px-4 py-2.5 text-xs text-faint hover:text-soft cursor-pointer list-none flex items-center gap-1.5 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                Lletra
              </summary>
              <pre className="px-4 pb-4 text-xs text-muted whitespace-pre-wrap font-sans leading-relaxed">{song.lyrics}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
