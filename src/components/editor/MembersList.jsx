import { ChevronUp, ChevronDown } from 'lucide-react'
import { VOICE_LABELS } from '../../lib/constants'

export default function MembersList({
  voiceGroups, placements, momentSoloists, showMics,
  collapsedVoices, setCollapsedVoices, pendingMemberId, setPendingMemberId,
  onContextMenu, onSoloistMic,
}) {
  return (
    <div className="space-y-1.5">
      {voiceGroups.map(({ voice, color: c, members: grpMembers }) => {
        const collapsed = collapsedVoices.has(voice)
        const unplacedInGroup = grpMembers.filter(m => !placements[m.id]).length
        return (
          <div key={voice}>
            <button
              onClick={() => setCollapsedVoices(prev => { const n = new Set(prev); n.has(voice) ? n.delete(voice) : n.add(voice); return n })}
              className="flex items-center gap-1.5 w-full py-1.5 hover:opacity-80 select-none">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.bg }} />
              <span className="text-xs text-muted font-medium flex-1 text-left">{VOICE_LABELS[voice]}</span>
              {unplacedInGroup > 0 && <span className="text-xs text-ghost">{unplacedInGroup}</span>}
              {collapsed ? <ChevronDown size={12} className="text-gray-700" /> : <ChevronUp size={12} className="text-gray-700" />}
            </button>
            {!collapsed && grpMembers.map(m => {
              const placed = !!placements[m.id]
              const isPending = pendingMemberId === m.id
              return (
                <div key={m.id} draggable={!placed}
                  onDragStart={e => e.dataTransfer.setData('memberId', m.id)}
                  onContextMenu={e => onContextMenu(e, m)}
                  onClick={!placed ? () => setPendingMemberId(prev => prev === m.id ? null : m.id) : undefined}
                  className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded text-xs select-none ml-3 transition-colors ${isPending ? 'bg-cyan-900/40 ring-1 ring-cyan-300' : placed ? 'opacity-40 hover:opacity-100' : 'cursor-pointer hover:bg-fill'}`}>
                  <span className="w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 text-xs"
                    style={{ backgroundColor: c.bg, color: c.fg }}>
                    {(m.initials || m.name.slice(0, 2)).toUpperCase()}
                  </span>
                  <span className="text-soft truncate text-xs flex-1">{m.name}</span>
                  {(() => {
                    const sol = momentSoloists.find(s => s.member_id === m.id)
                    if (!sol) return null
                    return (
                      <select value={sol.mic_number ?? ''}
                        onChange={e => onSoloistMic(m.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        className="bg-amber-900/40 border border-amber-700/60 rounded px-1 text-xs text-amber-300 w-8 focus:outline-none shrink-0 cursor-pointer"
                        title="Micro (solista)">
                        <option value="">—</option>
                        {(showMics.length > 0 ? showMics : [1,2,3,4,5,6,7,8,9,10]).map(n => <option key={n} value={String(n)}>{n}</option>)}
                      </select>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
