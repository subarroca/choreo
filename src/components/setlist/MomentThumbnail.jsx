import { VOICE_COLORS } from '../../lib/constants'

const W = 52
const H = 30

export default function MomentThumbnail({ positions = [], changedMembers, gridRows = 8, gridCols = 14 }) {
  if (!positions.length) return null

  const cellW = W / gridCols
  const cellH = H / gridRows
  const r = Math.min(cellW, cellH) * 0.38

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 rounded opacity-70 group-hover:opacity-100 transition-opacity">
      <rect width={W} height={H} rx={2} fill="#111827" />
      {positions.map((p, i) => {
        const cx = (p.col + 0.5) * cellW
        const cy = (p.row + 0.5) * cellH
        const moved = changedMembers?.has(p.memberId)
        const color = p.voice ? (VOICE_COLORS[p.voice]?.bg ?? '#6b7280') : '#6b7280'
        return (
          <circle key={i} cx={cx} cy={cy} r={moved ? r * 1.3 : r}
            fill={color}
            stroke={moved ? '#ffffff' : 'none'}
            strokeWidth={moved ? 0.8 : 0}
          />
        )
      })}
    </svg>
  )
}
