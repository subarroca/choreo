import { X, Crosshair, MicVocal, UserRound, Waypoints } from 'lucide-react'

export default function EditorContextMenu({
  contextMenu, members, highlightId, momentSoloists,
  placements, showMics, onClose, onSetHighlight, onToggleSoloist, onUpdateSoloistMic,
  onRemovePlacement, onSetProfile, onEnterTrajectory,
  VOICE_COLORS, VOICE_LABELS,
}) {
  if (!contextMenu) return null

  const m = contextMenu.member
  const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
  const isMe = highlightId === m.id
  const isSoloist = !!momentSoloists.find(s => s.member_id === m.id)
  const soloistEntry = momentSoloists.find(s => s.member_id === m.id)
  const isPlaced = !!placements[m.id]
  const isMobile = window.innerWidth < 768

  const menuItems = (itemCls) => (
    <>
      <button className={itemCls + (isMe ? ' text-cyan-400' : ' text-gray-300')}
        onClick={() => { const v = isMe ? '' : m.id; onSetHighlight(v); localStorage.setItem('highlightMemberId', v); onClose() }}>
        <Crosshair size={13} /> {isMe ? '✓ Focus' : 'Focus'}
      </button>
      <button className={itemCls + (isSoloist ? ' text-amber-400' : ' text-gray-300')}
        onClick={() => onToggleSoloist(m.id)}>
        <MicVocal size={13} /> {isSoloist ? '✓ Solista' : 'Marcar com solista'}
      </button>
      {isSoloist && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
          <span>Micro:</span>
          <select value={soloistEntry?.mic_number ?? ''}
            onChange={e => onUpdateSoloistMic(m.id, e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-1 text-xs text-white flex-1 focus:outline-none focus:border-amber-500">
            <option value="">—</option>
            {(showMics.length > 0 ? showMics : [1,2,3,4,5,6,7,8,9,10]).map(n => <option key={n} value={String(n)}>{n}</option>)}
          </select>
        </div>
      )}
      <button className={itemCls + ' text-gray-300'}
        onClick={() => { onSetProfile(m); onClose() }}>
        <UserRound size={13} /> Veure perfil
      </button>
      {m.role !== 'director' && (
        <button className={itemCls + ' text-gray-300'}
          onClick={() => { onEnterTrajectory(m.id); onClose() }}>
          <Waypoints size={13} /> Trajectòria
        </button>
      )}
      {isPlaced && <>
        <div className="border-t border-gray-800 my-1" />
        <button className={itemCls + ' text-red-400'}
          onClick={() => { onRemovePlacement(m.id); onClose() }}>
          <X size={13} /> Eliminar posició
        </button>
      </>}
    </>
  )

  return (
    <>
      <div className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={e => { e.preventDefault(); onClose() }} />

      {isMobile ? (
        /* Bottom sheet — mobile only */
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl pb-safe"
          onContextMenu={e => e.preventDefault()}>
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-700" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <span className="w-5 h-5 rounded shrink-0" style={{ background: c.bg }} />
            <span className="text-sm text-white font-semibold">{m.name}</span>
            <span className="text-xs text-gray-500 ml-auto">{VOICE_LABELS[m.voice] ?? m.voice}</span>
          </div>
          {menuItems('w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-gray-800 transition-colors text-left min-h-[52px]')}
          <div className="h-4" />
        </div>
      ) : (
        /* Floating menu — tablet and desktop */
        <div className="fixed z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 min-w-[190px]"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 210), top: Math.min(contextMenu.y, window.innerHeight - 270) }}
          onContextMenu={e => e.preventDefault()}>
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-800 mb-1">
            <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: c.bg }} />
            <span className="text-xs text-white font-medium truncate">{m.name}</span>
          </div>
          {menuItems('w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-800 transition-colors text-left')}
        </div>
      )}
    </>
  )
}
