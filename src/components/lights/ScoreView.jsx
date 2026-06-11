import { Plus, Pencil } from 'lucide-react'
import { lyricsLines } from '../../lib/lights'
import CueChip from './CueChip'

// Vista "partitura": la lletra de la cançó amb els cues ancorats a línies.
// Tocar el «+» d'una línia crea un cue disparat per aquella lletra.
export default function ScoreView({ song, repSong, cues, selectedCueId, onSelectCue, onCreateCueAtLine, onEditLyrics }) {
  const lines = lyricsLines(repSong?.lyrics)
  const hasLyrics = !!repSong?.lyrics?.trim()
  const anchored = {}
  const unanchored = []
  for (const c of cues) {
    if (c.lyric_line != null && c.lyric_line < lines.length) (anchored[c.lyric_line] ??= []).push(c)
    else unanchored.push(c)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{song.title}</h3>
        <button onClick={onEditLyrics}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800">
          <Pencil size={12} /> {hasLyrics ? 'Edita lletra' : 'Afegeix lletra'}
        </button>
      </div>

      {unanchored.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-600 uppercase tracking-wider">Cues d'acció / estructura</p>
          <div className="flex flex-wrap gap-1.5">
            {unanchored.map(c => (
              <div key={c.id} className="flex flex-col gap-0.5">
                <CueChip cue={c} selected={c.id === selectedCueId} onClick={() => onSelectCue(c)} />
                {c.trigger_text && <span className="text-xs text-gray-600 px-1 max-w-[260px] truncate">{c.trigger_text}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasLyrics ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 space-y-0">
          {lines.map((line, i) => {
            const lineCues = anchored[i] ?? []
            const isSelectedLine = lineCues.some(c => c.id === selectedCueId)
            return (
              <div key={i} className={`group flex items-center gap-1.5 rounded-md px-1.5 -mx-1.5 ${isSelectedLine ? 'bg-cyan-900/20' : ''}`}>
                <button onClick={() => onCreateCueAtLine(i, line)} title="Crear cue en aquesta línia"
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-700 opacity-30 md:opacity-0 md:group-hover:opacity-100 hover:!opacity-100 hover:text-cyan-300 hover:bg-gray-800 transition-all">
                  <Plus size={11} />
                </button>
                <div className="flex-1 min-w-0 py-0.5">
                  {line.trim() === '' ? <div className="h-2" /> : (
                    <span className={`text-xs leading-snug ${lineCues.length ? 'text-white font-medium' : 'text-gray-400'}`}>{line}</span>
                  )}
                </div>
                {lineCues.length > 0 && (
                  <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                    {lineCues.map(c => (
                      <CueChip key={c.id} cue={c} compact selected={c.id === selectedCueId} onClick={() => onSelectCue(c)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
          Aquesta cançó no té lletra al repertori.<br />
          Afegeix-la per poder ancorar-hi els cues de llum.
        </div>
      )}
    </div>
  )
}
