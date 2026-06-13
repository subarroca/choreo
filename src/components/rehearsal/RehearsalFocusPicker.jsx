import { X } from 'lucide-react'
import { VOICE_COLORS } from '../../lib/constants'
import { VOICE_ORDER } from '../../lib/editorCanvas'

export default function RehearsalFocusPicker({ members, highlightId, onSelect, onClose }) {
  const choirMembers = members.filter(m => m.role !== 'director' && m.role !== 'musician')
  const allVoices = [...new Set(choirMembers.map(m => m.voice))]
    .sort((a, b) => {
      const ia = VOICE_ORDER.indexOf(a), ib = VOICE_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  const voiceGroups = allVoices.map(v => ({
    voice: v,
    color: (VOICE_COLORS[v] ?? VOICE_COLORS.extra).bg,
    members: choirMembers.filter(m => m.voice === v),
  }))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl max-h-[65dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
          <span className="text-sm font-semibold text-white">Focus persona</span>
          <div className="flex items-center gap-2">
            {highlightId && (
              <button onClick={() => onSelect('')}
                className="text-xs text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded-lg">
                Treure focus
              </button>
            )}
            <button onClick={onClose}
              className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-600 px-4 pb-2 shrink-0">
          O mantén premut sobre una persona al canvas.
        </p>
        <div className="overflow-y-auto px-4 pb-6 space-y-3">
          {voiceGroups.map(({ voice, color, members: vMembers }) => (
            <div key={voice}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{voice}</p>
              </div>
              <div className="flex flex-wrap gap-2 pl-4">
                {vMembers.map(m => {
                  const initials = m.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                  const fn = m.first_name || m.name.split(' ')[0]
                  const active = highlightId === m.id
                  return (
                    <button key={m.id} onClick={() => onSelect(m.id)}
                      style={active ? { borderColor: color } : {}}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-colors min-h-[44px] ${
                        active ? 'bg-gray-800' : 'border-gray-700 hover:bg-gray-800'
                      }`}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                        style={{ background: color }}>
                        {initials}
                      </span>
                      <span className={active ? 'text-white' : 'text-gray-300'}>{fn}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
