import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from 'react-router-dom'
import { GripVertical, Pencil, X, ChevronDown, ChevronRight, Plus, MessageSquare, Info, Clipboard } from '../../lib/icons'
import { formatDuration } from './SongForm'
import { parseJsonArray } from '../../lib/parseJson'
import { repertoireType, isSongType } from '../../lib/repertoireTypes'
import { VOICE_COLORS } from '../../lib/constants'

function MomentThumbnailLarge({ positions = [], changedMembers, gridRows = 8, gridCols = 14 }) {
  if (!positions.length) return null
  const W = 88, H = 50
  const cellW = W / gridCols
  const cellH = H / gridRows
  const r = Math.min(cellW, cellH) * 0.38
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {positions.map((p, i) => {
        const cx = (p.col + 0.5) * cellW
        const cy = (p.row + 0.5) * cellH
        const moved = changedMembers?.has(p.memberId)
        const color = p.voice ? (VOICE_COLORS[p.voice]?.bg ?? '#6b7280') : '#6b7280'
        return <circle key={i} cx={cx} cy={cy} r={moved ? r * 1.3 : r} fill={color} stroke={moved ? '#fff' : 'none'} strokeWidth={moved ? 0.8 : 0} />
      })}
    </svg>
  )
}

function TextItem({ song, members, onEdit, onDelete, listeners, attributes, style }) {
  const speakerIds = parseJsonArray(song.speakers)
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
          aria-label="Editar"
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          aria-label="Eliminar"
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
          aria-label="Editar"
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          aria-label="Eliminar"
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function SortableSong({
  song, moments, expanded, onToggle, onEdit, onDelete, onAddMoment,
  onDeleteMoment, onReorderMoments, showId, activeDragId, repSong, micAssignments, members,
  copiedMoment, onCopyMoment, onPasteMoment, positionsByMoment, diffByMoment, soloistsByMoment, allMembers, gridRows, gridCols,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  const isOtherDragging = activeDragId && activeDragId !== song.id
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : isOtherDragging ? 0.4 : 1,
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
          aria-label="Editar"
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors shrink-0">
          aria-label="Eliminar"
          <X size={15} />
        </button>
      </div>

      {/* Moments list */}
      {expanded && (
        <div className="border-t border-rim px-3 py-3">
          {moments.length === 0 ? (
            <p className="text-xs text-ghost italic py-2">Sense moments</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {moments.map((m, i) => {
                const positions = positionsByMoment?.[m.id] ?? []
                const changedMembers = diffByMoment?.[m.id]
                return (
                  <Link
                    key={m.id}
                    to={`/show/${showId}/song/${song.id}/moment/${m.id}`}
                    className="shrink-0 group flex flex-col items-center gap-1.5 w-24"
                  >
                    <div className="relative w-24 h-14 rounded-lg border border-rim bg-slate-900 dark:bg-slate-950 flex items-center justify-center overflow-hidden group-hover:border-cyan-600 transition-colors">
                      {positions.length > 0 ? (
                        <MomentThumbnailLarge positions={positions} changedMembers={changedMembers} gridRows={gridRows} gridCols={gridCols} />
                      ) : (
                        <span className="text-ghost text-xs">buit</span>
                      )}
                      {changedMembers?.size > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/80 text-white leading-none"
                          title={`${changedMembers.size} canvis`}>
                          {changedMembers.size}↕
                        </span>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p className="text-xs text-soft font-medium truncate">{i + 1}. {m.title}</p>
                      {m.subtitle && <p className="text-xs text-ghost truncate">{m.subtitle}</p>}
                    </div>
                  </Link>
                )
              })}
              <button onClick={() => onAddMoment(song.id)}
                className="shrink-0 flex flex-col items-center gap-1.5 w-24 group">
                <div className="w-24 h-14 rounded-lg border-2 border-dashed border-line flex items-center justify-center group-hover:border-cyan-600 transition-colors">
                  <Plus size={18} className="text-faint group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-xs text-ghost">Nou</p>
              </button>
            </div>
          )}
          {copiedMoment && onPasteMoment && (
            <button onClick={() => onPasteMoment(song.id)}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs text-violet-500 hover:text-violet-300 hover:bg-fill transition-colors rounded-lg border border-violet-800"
              title={`Enganxar "${copiedMoment.title}"`}>
              <Clipboard size={12} /> Enganxar
            </button>
          )}
          {song.lyrics && (
            <details className="mt-2 group">
              <summary className="py-1.5 text-xs text-faint hover:text-soft cursor-pointer list-none flex items-center gap-1.5 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                Lletra
              </summary>
              <pre className="pt-2 text-xs text-muted whitespace-pre-wrap font-sans leading-relaxed">{song.lyrics}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
