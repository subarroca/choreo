import { formatCueNumber, cueSummary, sideColorHex, cueEffects } from '../../lib/lights'

export default function CueChip({ cue, selected, onClick, compact = false }) {
  const frontHex = sideColorHex(cue, 'front')
  const backHex = sideColorHex(cue, 'back')
  const fosc = cueEffects(cue).includes('fosc')
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors min-h-[40px] ${
        selected ? 'border-cyan-300 bg-cyan-900/30' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
      }`}>
      <span className={`shrink-0 min-w-[34px] text-center text-xs font-bold rounded-md px-1.5 py-1 ${
        fosc ? 'bg-gray-950 text-gray-400 border border-gray-700' : 'bg-gray-700 text-white'
      }`}>
        {formatCueNumber(cue.cue_number)}
      </span>
      {frontHex && <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-gray-600" style={{ background: frontHex }} />}
      {backHex && <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-gray-600 ring-1 ring-gray-500" style={{ background: backHex }} title="contra" />}
      {!compact && <span className="text-xs text-gray-400 truncate max-w-[220px]">{cueSummary(cue)}</span>}
    </button>
  )
}
