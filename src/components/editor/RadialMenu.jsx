import { useEffect, useState } from 'react'

const ACTIVE_CLASSES = {
  cyan:   'border-cyan-500 text-cyan-300 bg-cyan-900/80',
  amber:  'border-amber-500 text-amber-300 bg-amber-900/80',
  violet: 'border-violet-500 text-violet-300 bg-violet-900/80',
}

// Generic radial (sunburst) menu for touch: big round buttons evenly
// distributed around the press point, clamped to the viewport.
export default function RadialMenu({ x, y, items, hub, onClose }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const R = 92, BTN = 62
  const margin = R + BTN / 2 + 10
  const cx = Math.max(margin, Math.min(window.innerWidth - margin, x))
  const cy = Math.max(margin, Math.min(window.innerHeight - margin - 28, y))
  const n = items.length

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}
      onContextMenu={e => { e.preventDefault(); onClose() }}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity duration-150 ${mounted ? 'opacity-100' : 'opacity-0'}`} />

      {/* Hub: who this menu is about */}
      <div className="absolute w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/25 shadow-xl"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)', background: hub?.bg ?? '#1e293b', color: hub?.fg ?? '#fff' }}>
        {hub?.initials ?? ''}
      </div>
      {hub?.label && (
        <div className="absolute text-xs text-body bg-pane/95 border border-line rounded-full px-3 py-1.5 whitespace-nowrap"
          style={{ left: cx, top: cy + R + BTN / 2 + 12, transform: 'translateX(-50%)' }}>
          {hub.label}
        </div>
      )}

      {items.map((it, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
        const f = mounted ? 1 : 0.3
        const ix = cx + R * Math.cos(ang) * f
        const iy = cy + R * Math.sin(ang) * f
        const cls = it.active
          ? (ACTIVE_CLASSES[it.color] ?? ACTIVE_CLASSES.cyan)
          : it.color === 'red'
            ? 'border-line text-red-400 bg-pane/95'
            : 'border-wire text-gray-200 bg-pane/95'
        return (
          <button key={it.id}
            onClick={e => { e.stopPropagation(); it.onSelect() }}
            className={`absolute flex flex-col items-center justify-center gap-1 rounded-full border shadow-xl transition-all duration-150 ${cls} ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: ix, top: iy, width: BTN, height: BTN, transform: 'translate(-50%, -50%)' }}>
            <it.Icon size={20} />
            <span className="text-[9px] leading-none">{it.label}</span>
          </button>
        )
      })}
    </div>
  )
}
