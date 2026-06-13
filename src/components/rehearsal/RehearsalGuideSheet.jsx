import { X } from 'lucide-react'
import { VOICE_COLORS } from '../../lib/constants'
import { firstName } from '../../lib/rehearsalGuide'

export default function RehearsalGuideSheet({ highlightedMember, guideData, currentIdx, onNavigate, onClose }) {
  if (!highlightedMember) return null
  const color = (VOICE_COLORS[highlightedMember.voice] ?? VOICE_COLORS.extra).bg
  const initials = highlightedMember.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  let lastSongId = null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl max-h-[75dvh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: color }}>
              {initials}
            </span>
            <span className="text-sm font-semibold text-white">
              {firstName(highlightedMember)} — posicions
            </span>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-6">
          {guideData.map((entry, i) => {
            const showSong = entry.song.id !== lastSongId
            lastSongId = entry.song.id
            return (
              <div key={entry.moment.id}>
                {showSong && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-4 mb-1">
                    {entry.song.title}
                  </p>
                )}
                <button onClick={() => { onNavigate(i); onClose() }}
                  className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-colors ${
                    i === currentIdx ? 'bg-cyan-900/40 border border-cyan-700/50' : 'hover:bg-gray-800/60'
                  }`}>
                  <p className="text-xs font-semibold text-white mb-0.5">{entry.moment.title}</p>
                  {entry.row == null
                    ? <p className="text-[11px] text-gray-600">Sense posició assignada</p>
                    : <>
                        <p className="text-[11px] text-cyan-400 font-medium">{entry.posDesc}</p>
                        <div className="flex flex-wrap gap-x-4 mt-0.5">
                          {entry.left && <span className="text-[11px] text-gray-400">← {firstName(entry.left)}</span>}
                          {entry.right && <span className="text-[11px] text-gray-400">{firstName(entry.right)} →</span>}
                          {entry.front.length > 0 && (
                            <span className="text-[11px] text-gray-500">
                              davant: {entry.front.map(m => firstName(m)).join(', ')}
                            </span>
                          )}
                        </div>
                      </>
                  }
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
