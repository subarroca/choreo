import { VOICE_COLORS } from '../../lib/constants'

export default function EditorCanvas({
  canvasRef, canvasContainerRef, heightCanvasRef,
  CW, CH, rotated, pendingMemberId, trajectoryMode, canvasScale,
  members, hoverZenithInfo, showHeightProfile,
  onSetPendingMemberId, onSetCanvasScale, canvasScaleRef,
  onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  onContextMenu, onDoubleClick, onDragOver, onDrop,
  onProfileMouseMove, onProfileMouseLeave, onProfileContextMenu,
  onToggleHeightProfile,
}) {
  return (
    <div ref={canvasContainerRef} className="flex-1 overflow-auto bg-[#0f172a] flex flex-col pr-8">
      <div className="relative" style={{ width: canvasScale !== 1 ? `${canvasScale * 100}%` : '100%' }}>
        {pendingMemberId && (() => {
          const pm = members.find(m => m.id === pendingMemberId)
          return (
            <div className="absolute inset-x-0 top-2 flex justify-center z-10 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-cyan-950/90 border border-cyan-700 text-cyan-200 text-xs px-3 py-1.5 rounded-full shadow-lg">
                <span>Toca el canvas per col·locar <strong>{pm?.name}</strong></span>
                <button onClick={() => onSetPendingMemberId(null)} className="text-cyan-400 hover:text-body ml-1">✕</button>
              </div>
            </div>
          )
        })()}
        <canvas ref={canvasRef}
          style={{ width: '100%', aspectRatio: `${CW} / ${CH}`, transform: rotated ? 'rotate(180deg)' : undefined, display: 'block', cursor: pendingMemberId ? 'crosshair' : trajectoryMode ? 'pointer' : 'default', touchAction: 'none' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
          onContextMenu={onContextMenu}
          onDoubleClick={onDoubleClick}
          onDragOver={onDragOver} onDrop={onDrop} />
        {hoverZenithInfo && (() => {
          const m = hoverZenithInfo.member
          const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
          const label = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.name || ''
          return (
            <div style={{ position: 'absolute', left: hoverZenithInfo.x + 10, top: hoverZenithInfo.y - 24, pointerEvents: 'none', color: c.bg, borderColor: c.bg + '55', borderWidth: 1, borderStyle: 'solid', backgroundColor: '#1e293b', borderRadius: 4, padding: '2px 7px', fontSize: 10, whiteSpace: 'nowrap', zIndex: 10 }}>
              {label}
            </div>
          )
        })()}
        <div className="border-t border-rim">
          <button
            onClick={onToggleHeightProfile}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-faint hover:text-soft hover:bg-fill/40 transition-colors select-none">
            <span className="uppercase tracking-wider font-medium">Perfil d'alçades</span>
            <span className="text-ghost">{showHeightProfile ? '▲' : '▼'}</span>
          </button>
          {showHeightProfile && (
            <canvas ref={heightCanvasRef}
              style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
              onMouseMove={onProfileMouseMove}
              onMouseLeave={onProfileMouseLeave}
              onContextMenu={onProfileContextMenu} />
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-1 shrink-0">
        <p className="text-xs text-gray-700 text-center select-none">
          {trajectoryMode
            ? 'Toca/clica qualsevol punt per anar a aquell moment · Esc per sortir'
            : 'Arrossega · Shift+clic per seleccionar · fletxes mouen selecció · Doble tap per treure · Mantén premut per menú'}
        </p>
        {canvasScale !== 1 && (
          <button onClick={() => { canvasScaleRef.current = 1; onSetCanvasScale(1) }}
            className="shrink-0 text-xs text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full hover:bg-cyan-900/30 transition-colors">
            {Math.round(canvasScale * 100)}% · Reset
          </button>
        )}
      </div>
    </div>
  )
}
