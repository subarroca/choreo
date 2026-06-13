import { X } from 'lucide-react'

export default function RehearsalNavMenu({ steps, currentIdx, onNavigate, onClose }) {
  const uniqueSongIds = [...new Set(steps.map(s => s.song.id))]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Navegar</h3>
            <button onClick={onClose}
              className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
              <X size={16} />
            </button>
          </div>
          {uniqueSongIds.map(songId => {
            const songSteps = steps.filter(s => s.song.id === songId)
            const song = songSteps[0].song
            return (
              <div key={songId} className="mb-4">
                <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">{song.title}</p>
                {songSteps.map((step, i) => {
                  const stepIdx = steps.indexOf(step)
                  return (
                    <button key={step.moment.id}
                      onClick={() => { onNavigate(stepIdx); onClose() }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs mb-0.5 transition-colors ${
                        stepIdx === currentIdx
                          ? 'bg-cyan-700/40 text-cyan-300'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}>
                      <span className="text-gray-500 tabular-nums mr-2">{i + 1}.</span>
                      {step.moment.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
