import { useState, useEffect, useRef } from 'react'
import { Spotlight, Copy, Trash2 } from 'lucide-react'
import { formatCueNumber, cueSummaryCompact, sideColorHexes, cueEffects, cueFollowspots } from '../../lib/lights'

export default function CueChip({ cue, selected, onClick, onDuplicate, onDelete, compact = false }) {
  const frontHexes = sideColorHexes(cue, 'front')
  const backHexes = sideColorHexes(cue, 'back')
  const fosc = cueEffects(cue).includes('fosc')
  const followspots = cueFollowspots(cue)
  const summary = cueSummaryCompact(cue)
  const [menu, setMenu] = useState(null) // { x, y }
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menu])

  function handleContextMenu(e) {
    if (!onDuplicate && !onDelete) return
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors min-h-[40px] ${
        selected ? 'border-cyan-300 bg-cyan-900/30' : 'border-line bg-pane hover:border-gray-500'
      }`}>
      <span className={`shrink-0 min-w-[34px] text-center text-xs font-bold rounded-md px-1.5 py-1 ${
        fosc ? 'bg-page text-muted border border-line' : 'bg-raised text-body'
      }`}>
        {formatCueNumber(cue.cue_number)}
      </span>
      {frontHexes.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[9px] font-bold text-faint mr-0.5">F</span>
          {frontHexes.map((hex, i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full border border-wire" style={{ background: hex }} />
          ))}
        </div>
      )}
      {backHexes.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[9px] font-bold text-faint mr-0.5">C</span>
          {backHexes.map((hex, i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full border border-wire ring-1 ring-gray-500" style={{ background: hex }} />
          ))}
        </div>
      )}
      {followspots.length > 0 && (
        <div className="flex items-center gap-0.5 shrink-0 text-muted">
          <Spotlight size={12} />
          {followspots.map((fs, i) => {
            const pos = fs.position ?? 'centre'
            const initial = pos === 'esquerra' ? 'E' : pos === 'dreta' ? 'D' : 'C'
            return <span key={i} className="text-[9px] font-bold">{initial}</span>
          })}
        </div>
      )}
      {!compact && summary && <span className="text-xs text-muted truncate max-w-[220px]">{summary}</span>}
    </button>
    {menu && (
      <div ref={menuRef} className="fixed z-[200] min-w-[140px] bg-pane border border-line rounded-xl shadow-2xl py-1 text-sm"
        style={{ top: menu.y, left: menu.x }}>
        {onDuplicate && (
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-soft hover:text-body hover:bg-fill transition-colors"
            onClick={e => { e.stopPropagation(); setMenu(null); onDuplicate(cue) }}>
            <Copy size={14} /> Duplicar
          </button>
        )}
        {onDelete && (
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-fill transition-colors"
            onClick={e => { e.stopPropagation(); setMenu(null); onDelete(cue) }}>
            <Trash2 size={14} /> Eliminar
          </button>
        )}
      </div>
    )}
    </>
  )
}
