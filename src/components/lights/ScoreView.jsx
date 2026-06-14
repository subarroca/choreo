import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { lyricsLines } from '../../lib/lights'
import { repertoireType, isSongType } from '../../lib/repertoireTypes'
import CueChip from './CueChip'

function DraggableCueChip({ cue, onDelete, ...props }) {
  const [dragging, setDragging] = useState(false)

  const dragHandleProps = {
    draggable: true,
    onDragStart: e => {
      e.dataTransfer.setData('cue-id', cue.id)
      e.dataTransfer.effectAllowed = 'move'
      setDragging(true)
    },
    onDragEnd: () => setDragging(false),
  }

  return (
    <div className={dragging ? 'opacity-40' : ''}>
      <CueChip cue={cue} onDelete={onDelete} dragHandleProps={dragHandleProps} {...props} />
    </div>
  )
}

export default function ScoreView({ song, repSong, cues, moments, selectedCueId, onSelectCue, onDuplicateCue, onDeleteCue, onMoveCueToLine, onCreateCueAtLine, onEditLyrics }) {
  const isSong = isSongType(repSong?.type)
  const lines = isSong ? lyricsLines(repSong?.lyrics) : ['Inici', 'Final']
  const hasContent = isSong ? !!repSong?.lyrics?.trim() : true
  const rt = !isSong ? repertoireType(repSong?.type) : null
  const [dropTarget, setDropTarget] = useState(null)
  const momentMap = Object.fromEntries((moments ?? []).map(m => [m.id, m]))

  const anchored = {}
  const unanchored = []
  for (const c of cues) {
    if (c.lyric_line != null && c.lyric_line < lines.length) (anchored[c.lyric_line] ??= []).push(c)
    else unanchored.push(c)
  }

  function handleDrop(e, lineIdx) {
    e.preventDefault()
    setDropTarget(null)
    const cueId = e.dataTransfer.getData('cue-id')
    if (cueId && onMoveCueToLine) {
      onMoveCueToLine(cueId, lineIdx, lines[lineIdx]?.trim() ?? '')
    }
  }

  function handleDropUnanchor(e) {
    e.preventDefault()
    setDropTarget(null)
    const cueId = e.dataTransfer.getData('cue-id')
    if (cueId && onMoveCueToLine) {
      onMoveCueToLine(cueId, null, '')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {rt && (() => { const Icon = rt.icon; return <Icon size={15} className={rt.color} /> })()}
          <h3 className="text-sm font-semibold text-body">{song.title}</h3>
          {rt && <span className={`text-xs ${rt.color}`}>{rt.label}</span>}
        </div>
        {isSong && (
          <button onClick={onEditLyrics}
            className="flex items-center gap-1.5 text-xs text-faint hover:text-cyan-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-fill">
            <Pencil size={12} /> {hasContent ? 'Edita lletra' : 'Afegeix lletra'}
          </button>
        )}
      </div>

      {(unanchored.length > 0 || cues.length > 0) && (
        <div className="space-y-1.5"
          onDragOver={e => { e.preventDefault(); setDropTarget('unanchored') }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={handleDropUnanchor}>
          <p className="text-xs text-ghost uppercase tracking-wider">Cues sense ancorar</p>
          <div className={`flex flex-wrap gap-1.5 min-h-[32px] rounded-lg border border-dashed transition-colors px-1.5 py-1 ${
            dropTarget === 'unanchored' ? 'border-cyan-500 bg-cyan-900/10' : unanchored.length > 0 ? 'border-transparent' : 'border-rim'
          }`}>
            {unanchored.map(c => (
              <div key={c.id} className="flex flex-col gap-0.5">
                <DraggableCueChip cue={c} selected={c.id === selectedCueId} onClick={() => onSelectCue(c)} onDuplicate={onDuplicateCue} onDelete={onDeleteCue} momentName={momentMap[c.moment_id]?.title} />
                {c.trigger_text && <span className="text-xs text-ghost px-1 max-w-[260px] truncate">{c.trigger_text}</span>}
              </div>
            ))}
            {unanchored.length === 0 && <span className="text-xs text-gray-700 py-1">Arrossega aquí per desancorar</span>}
          </div>
        </div>
      )}

      {hasContent ? (
        <div className="bg-pane border border-rim rounded-xl px-3 py-2 space-y-0">
          {lines.map((line, i) => {
            const lineCues = anchored[i] ?? []
            const isSelectedLine = lineCues.some(c => c.id === selectedCueId)
            const isDropLine = dropTarget === i
            return (
              <div key={i}
                onDragOver={e => { e.preventDefault(); setDropTarget(i) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null) }}
                onDrop={e => handleDrop(e, i)}
                className={`group flex items-center gap-1.5 rounded-md px-1.5 -mx-1.5 transition-colors ${
                  isDropLine ? 'bg-cyan-900/30 ring-1 ring-cyan-500/50' : isSelectedLine ? 'bg-cyan-900/20' : ''
                }`}>
                <div className="flex-1 min-w-0 py-0.5">
                  {line.trim() === '' ? <div className="h-2" /> : (
                    <span className={`text-xs leading-snug ${
                      !isSong ? 'text-soft font-medium uppercase tracking-wider' :
                      lineCues.length ? 'text-body font-medium' : 'text-muted'
                    }`}>{line}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 shrink-0 justify-end items-center">
                  <button onClick={() => onCreateCueAtLine(i, line)} title="Crear cue en aquest punt"
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-700 opacity-30 md:opacity-0 md:group-hover:opacity-100 hover:!opacity-100 hover:text-cyan-300 hover:bg-fill transition-all">
                    <Plus size={11} />
                  </button>
                  {lineCues.map(c => (
                    <DraggableCueChip key={c.id} cue={c} compact selected={c.id === selectedCueId} onClick={() => onSelectCue(c)} onDuplicate={onDuplicateCue} onDelete={onDeleteCue} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-ghost text-sm border-2 border-dashed border-rim rounded-xl">
          Aquesta cançó no té lletra al repertori.<br />
          Afegeix-la per poder ancorar-hi els cues de llum.
        </div>
      )}
    </div>
  )
}
