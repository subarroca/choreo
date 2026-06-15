import { formatCueNumber, cueSummary, sideColorHex, cueEffects, TRIGGER_TYPES } from '../../lib/lights'

// Table view: all cues for the show in number order,
// with separators when the song changes (like the mic grid).
export default function CueTable({ cues, songs, selectedCueId, onSelectCue }) {
  const songMap = Object.fromEntries(songs.map(s => [s.id, s]))

  const rows = []
  let lastSongKey
  for (const cue of cues) {
    const key = cue.song_id ?? '__none__'
    if (key !== lastSongKey) {
      rows.push({ type: 'header', key: `h-${cue.id}`, title: cue.song_id ? (songMap[cue.song_id]?.title ?? '?') : 'Estructura (teló, diàlegs, tracks…)' })
      lastSongKey = key
    }
    rows.push({ type: 'cue', key: cue.id, cue })
  }

  if (!cues.length) {
    return <div className="text-ghost text-sm mt-8 text-center">Encara no hi ha cap cue. Crea el primer des de la vista partitura o amb «+ Cue».</div>
  }

  return (
    <table className="border-collapse text-xs w-full">
      <thead>
        <tr className="text-left text-ghost">
          <th className="px-3 py-2 border-b border-rim font-normal w-16">Cue</th>
          <th className="px-3 py-2 border-b border-rim font-normal w-24">Tipus</th>
          <th className="px-3 py-2 border-b border-rim font-normal">Disparador</th>
          <th className="px-3 py-2 border-b border-rim font-normal">Llums</th>
          <th className="px-3 py-2 border-b border-rim font-normal hidden md:table-cell">Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          if (row.type === 'header') {
            return (
              <tr key={row.key}>
                <td colSpan={5} className="px-3 py-1.5 bg-pane border-b border-rim text-xs text-faint font-medium">
                  {row.title}
                </td>
              </tr>
            )
          }
          const { cue } = row
          const frontHex = sideColorHex(cue, 'front')
          const backHex = sideColorHex(cue, 'back')
          const fosc = cueEffects(cue).includes('fosc')
          const selected = cue.id === selectedCueId
          return (
            <tr key={row.key} onClick={() => onSelectCue(cue)}
              className={`cursor-pointer transition-colors ${selected ? 'bg-cyan-900/20' : 'hover:bg-pane/60'} ${fosc ? 'opacity-70' : ''}`}>
              <td className="px-3 py-2.5 border-b border-rim">
                <span className={`inline-block min-w-[34px] text-center font-bold rounded-md px-1.5 py-1 ${
                  fosc ? 'bg-page text-muted border border-line' : 'bg-raised text-body'}`}>
                  {formatCueNumber(cue.cue_number)}
                </span>
              </td>
              <td className="px-3 py-2.5 border-b border-rim text-faint">
                {TRIGGER_TYPES.find(t => t.value === cue.trigger_type)?.label ?? ''}
              </td>
              <td className={`px-3 py-2.5 border-b border-rim ${cue.trigger_type === 'lyric' ? 'italic text-soft' : 'text-soft'}`}>
                {cue.trigger_type === 'lyric' && cue.trigger_text ? `«${cue.trigger_text}»` : cue.trigger_text}
              </td>
              <td className="px-3 py-2.5 border-b border-rim text-muted">
                <span className="inline-flex items-center gap-1.5">
                  {frontHex && <span className="w-3 h-3 rounded-full shrink-0 border border-wire" style={{ background: frontHex }} />}
                  {backHex && <span className="w-3 h-3 rounded-full shrink-0 border border-wire ring-1 ring-gray-500" style={{ background: backHex }} />}
                  {cueSummary(cue)}
                </span>
              </td>
              <td className="px-3 py-2.5 border-b border-rim text-ghost hidden md:table-cell">{cue.notes}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
