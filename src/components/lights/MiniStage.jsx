import { CELL, LABEL_W, DEFAULT_ROW_LABELS, DEFAULT_COLS, getMemberPixelPos, TOKEN_R } from '../../lib/editorCanvas'
import { VOICE_COLORS } from '../../lib/constants'
import { cueEffects, cueFollowspots, cueLevels, lightColor, cueZoneColors, LIGHT_ZONES } from '../../lib/lights'

const FS_X = { esquerra: 0.25, centre: 0.5, dreta: 0.75 }
const ZONE_INDEX = Object.fromEntries(LIGHT_ZONES.map((z, i) => [z.value, i]))
const WARM_HEX = '#fde68a'

// Escenari zenital (SVG): posicions + estat de llum amb gradients per zona i banda.
export default function MiniStage({ show, members, placements = {}, gridMode = 'alternate', cue, className = '' }) {
  const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const GW = COLS * CELL, GH = ROWS * CELL
  const CW = LABEL_W + GW
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW, CH: GH }

  const effects = cueEffects(cue)
  const fosc = effects.includes('fosc')
  const sala = effects.includes('sala')
  const toPublic = effects.includes('public')
  const frontZoneColors = cueZoneColors(cue, 'front')
  const backZoneColors = cueZoneColors(cue, 'back')
  const frontLevels = cueLevels(cue, 'front')
  const backLevels = cueLevels(cue, 'back')
  const followspots = cueFollowspots(cue)
  const zoneW = GW / 3
  const uid = cue?.id ?? 'x'

  const tokens = members
    .filter(m => m.role !== 'director' && placements[m.id])
    .map(m => ({ m, pt: getMemberPixelPos(placements[m.id], gridMode, dims) }))
    .filter(t => t.pt)

  return (
    <svg viewBox={`0 -10 ${CW} ${GH + 26}`} className={className} role="img" aria-label="Escenari en miniatura">
      <defs>
        {LIGHT_ZONES.map(z => {
          const fhex = lightColor(frontZoneColors[z.value])?.hex ?? WARM_HEX
          const bhex = lightColor(backZoneColors[z.value])?.hex ?? WARM_HEX
          return [
            <linearGradient key={`fg-${z.value}`} id={`front-${z.value}-${uid}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={fhex} stopOpacity="1" />
              <stop offset="100%" stopColor={fhex} stopOpacity="0" />
            </linearGradient>,
            <linearGradient key={`bg-${z.value}`} id={`back-${z.value}-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bhex} stopOpacity="1" />
              <stop offset="100%" stopColor={bhex} stopOpacity="0" />
            </linearGradient>,
          ]
        })}
      </defs>

      <rect x={LABEL_W} y={0} width={GW} height={GH} rx={6} fill={fosc ? '#0a0f1a' : '#1e293b'} stroke="#334155" />

      {rowLabels.map((label, r) => (
        <text key={r} x={LABEL_W - 6} y={r * CELL + CELL / 2} textAnchor="end" dominantBaseline="middle"
          fontSize={11} fill="#64748b">{label}</text>
      ))}

      {!fosc && LIGHT_ZONES.map(z => backLevels[z.value] > 0 && (
        <rect key={`b-${z.value}`} x={LABEL_W + ZONE_INDEX[z.value] * zoneW} y={0} width={zoneW} height={GH * 0.6}
          fill={`url(#back-${z.value}-${uid})`} opacity={backLevels[z.value] / 4 * 0.5} />
      ))}
      {!fosc && LIGHT_ZONES.map(z => frontLevels[z.value] > 0 && (
        <rect key={`f-${z.value}`} x={LABEL_W + ZONE_INDEX[z.value] * zoneW} y={GH * 0.4} width={zoneW} height={GH * 0.6}
          fill={`url(#front-${z.value}-${uid})`} opacity={frontLevels[z.value] / 4 * 0.55} />
      ))}

      {tokens.map(({ m, pt }) => {
        const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
        const initials = (m.initials || (m.name ?? '').slice(0, 2)).toUpperCase()
        return (
          <g key={m.id} opacity={fosc ? 0.35 : 1}>
            <circle cx={pt.x} cy={pt.y} r={TOKEN_R * 0.8} fill={c.bg} />
            <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize={9.5}
              fontWeight="bold" fill={c.fg}>{initials}</text>
          </g>
        )
      })}

      {followspots.map((fs, i) => {
        const target = fs.member_id ? tokens.find(t => t.m.id === fs.member_id) : null
        const x = target ? target.pt.x : LABEL_W + GW * (FS_X[fs.position] ?? 0.5)
        const y = target ? target.pt.y : GH * 0.78
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={TOKEN_R * 1.5} fill="#fef3c7" opacity={0.25} />
            <circle cx={x} cy={y} r={TOKEN_R * 1.5} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={x} y={y + TOKEN_R * 1.5 + 11} textAnchor="middle" fontSize={10} fill="#fbbf24">
              {fs.label ?? 'Canó'}
            </text>
          </g>
        )
      })}

      {(sala || toPublic) && (
        <rect x={LABEL_W} y={GH + 2} width={GW} height={16} rx={4}
          fill={toPublic ? '#fbbf24' : '#fef3c7'} opacity={toPublic ? 0.45 : 0.25} />
      )}
      <text x={LABEL_W + GW / 2} y={GH + 14} textAnchor="middle" fontSize={10}
        fill={sala || toPublic ? '#78350f' : '#475569'} fontWeight={sala || toPublic ? 'bold' : 'normal'}>
        PÚBLIC{sala ? ' · sala' : ''}{toPublic ? ' · focus' : ''}
      </text>
    </svg>
  )
}
