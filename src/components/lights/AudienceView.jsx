import { CELL, LABEL_W, DEFAULT_ROW_LABELS, DEFAULT_COLS, getMemberPixelPos } from '../../lib/editorCanvas'
import { VOICE_COLORS } from '../../lib/constants'
import { cueEffects, cueFollowspots, cueLevels, lightColor, cueZoneColors, LIGHT_ZONES } from '../../lib/lights'

const W = 720, H = 340
const FRAME = 16
const Y_BACK = H * 0.52
const Y_FRONT = H - 52
const ELEV_SCALE = 0.30
const FS_X = { esquerra: 0.25, centre: 0.5, dreta: 0.75 }
const WARM_HEX = '#fde68a'
const SKIN_HEX = '#C8956C'

const lerp = (a, b, t) => a + (b - a) * t
const xScreen = (xNorm, t) => W / 2 + (xNorm - 0.5) * (W - 2 * FRAME - 70) * (0.8 + 0.2 * t)
const zoneOf = (xNorm) => xNorm < 1 / 3 ? 'esquerra' : xNorm < 2 / 3 ? 'centre' : 'dreta'

function tintColor(baseHex, lightHex, t) {
  if (!lightHex || t <= 0) return baseHex
  const [br, bg, bb] = [parseInt(baseHex.slice(1, 3), 16), parseInt(baseHex.slice(3, 5), 16), parseInt(baseHex.slice(5, 7), 16)]
  const [lr, lg, lb] = [parseInt(lightHex.slice(1, 3), 16), parseInt(lightHex.slice(3, 5), 16), parseInt(lightHex.slice(5, 7), 16)]
  const mix = t * 0.45
  return `rgb(${Math.round(br * (1 - mix) + lr * mix)},${Math.round(bg * (1 - mix) + lg * mix)},${Math.round(bb * (1 - mix) + lb * mix)})`
}

function Person({ x, y, h, skinFill, clothesFill }) {
  const headR = h * 0.13
  const bodyW = h * 0.22
  const bodyTop = y - h + headR * 2 + 2
  const bodyH = h * 0.34
  const armW = Math.max(2, h * 0.06)
  const armH = h * 0.26
  const legW = Math.max(2.5, h * 0.08)
  const legTop = bodyTop + bodyH
  const legH = y - legTop
  return (
    <g>
      <circle cx={x} cy={y - h + headR} r={headR} fill={skinFill} />
      <rect x={x - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} rx={bodyW * 0.3} fill={clothesFill} />
      <rect x={x - bodyW / 2 - armW + 0.5} y={bodyTop + 1} width={armW} height={armH} rx={armW / 2} fill={skinFill} />
      <rect x={x + bodyW / 2 - 0.5} y={bodyTop + 1} width={armW} height={armH} rx={armW / 2} fill={skinFill} />
      <rect x={x - legW - 0.5} y={legTop} width={legW} height={legH} rx={legW / 2} fill={clothesFill} />
      <rect x={x + 0.5} y={legTop} width={legW} height={legH} rx={legW / 2} fill={clothesFill} />
    </g>
  )
}

// Vista frontal des del centre de platea: ciclorama il·luminat per contra,
// cons de llum frontal des del pont impactant al cor, canons de seguiment.
export default function AudienceView({ show, members, placements = {}, gridMode = 'alternate', cue, showLights = true, className = '' }) {
  const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const rowElev = show?.row_elevations ?? rowLabels.map(() => 0)
  const GW = COLS * CELL, GH = ROWS * CELL
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW: LABEL_W + GW, CH: GH }

  const effects = showLights ? cueEffects(cue) : []
  const fosc = effects.includes('fosc')
  const sala = showLights && effects.includes('sala')
  const toPublic = showLights && effects.includes('public')
  const frontZoneColors = cueZoneColors(cue, 'front')
  const backZoneColors = cueZoneColors(cue, 'back')
  const frontLevels = cueLevels(cue, 'front')
  const backLevels = cueLevels(cue, 'back')
  const followspots = showLights ? cueFollowspots(cue) : []
  const uid = cue?.id ?? 'x'

  const tokens = members
    .filter(m => m.role !== 'director' && placements[m.id])
    .map(m => {
      const pos = placements[m.id]
      const pt = getMemberPixelPos(pos, gridMode, dims)
      if (!pt) return null
      const xNorm = (pt.x - LABEL_W) / GW
      const t = Math.max(0, Math.min(1, pt.y / GH))
      const elev = (!pos.free && pos.row != null ? (rowElev[pos.row] ?? 0) : 0) * ELEV_SCALE
      const h = (30 + 24 * t) * Math.max(0.85, Math.min(1.15, (m.height ?? 170) / 170))
      return { m, x: xScreen(xNorm, t), y: lerp(Y_BACK, Y_FRONT, t) - elev, t, h, zone: zoneOf(xNorm) }
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t)

  const platforms = gridMode !== 'free' ? rowLabels.map((_, r) => {
    const elev = (rowElev[r] ?? 0) * ELEV_SCALE
    if (elev <= 0) return null
    const t = ROWS > 1 ? (r + 0.5) / ROWS : 0.5
    const halfW = (W - 2 * FRAME - 70) * (0.8 + 0.2 * t) / 2
    return { y: lerp(Y_BACK, Y_FRONT, t), halfW, key: r }
  }).filter(Boolean) : []

  const zoneThirdX = (i) => FRAME + ((W - 2 * FRAME) / 3) * i

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Vista de l'espectador">
      <defs>
        {LIGHT_ZONES.map(z => {
          const bhex = lightColor(backZoneColors[z.value])?.hex ?? WARM_HEX
          return (
            <linearGradient key={z.value} id={`av-back-${z.value}-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bhex} stopOpacity="1" />
              <stop offset="100%" stopColor={bhex} stopOpacity="0" />
            </linearGradient>
          )
        })}
        {LIGHT_ZONES.map(z => {
          const fhex = lightColor(frontZoneColors[z.value])?.hex ?? WARM_HEX
          const opa = frontLevels[z.value] / 4 * 0.25
          return opa > 0 ? (
            <linearGradient key={`f-${z.value}`} id={`av-front-${z.value}-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fhex} stopOpacity={opa * 0.3} />
              <stop offset="55%" stopColor={fhex} stopOpacity={opa} />
              <stop offset="100%" stopColor={fhex} stopOpacity={0} />
            </linearGradient>
          ) : null
        })}
      </defs>

      {/* Caixa escènica */}
      <rect x={0} y={0} width={W} height={H} rx={8} fill="#05080f" />
      <rect x={FRAME} y={FRAME} width={W - 2 * FRAME} height={H - FRAME - 30} fill="#0c1424" />

      {/* Ciclorama: contra il·lumina el fons per franges */}
      <rect x={FRAME} y={FRAME} width={W - 2 * FRAME} height={Y_BACK - FRAME + 16} fill="#101b30" />
      {!fosc && LIGHT_ZONES.map((z, i) => backLevels[z.value] > 0 && (
        <rect key={`b-${z.value}`} x={zoneThirdX(i)} y={FRAME} width={(W - 2 * FRAME) / 3} height={Y_BACK - FRAME + 16}
          fill={`url(#av-back-${z.value}-${uid})`} opacity={backLevels[z.value] / 4 * 0.75} />
      ))}

      {/* Terra de l'escenari */}
      <polygon points={`${FRAME},${H - 30} ${W - FRAME},${H - 30} ${W - FRAME - 26},${Y_BACK + 14} ${FRAME + 26},${Y_BACK + 14}`}
        fill="#0e1626" />

      {/* Tarimes */}
      {platforms.map(p => (
        <rect key={p.key} x={W / 2 - p.halfW} y={p.y - 3} width={p.halfW * 2} height={4} rx={2} fill="#1c2940" />
      ))}

      {/* Bany frontal: focus des del pont cap als cantaires */}
      {!fosc && LIGHT_ZONES.map((z, i) => {
        const lvl = frontLevels[z.value]
        if (lvl === 0) return null
        const x0 = zoneThirdX(i)
        const x1 = zoneThirdX(i + 1)
        const inset = (x1 - x0) * 0.15
        const spread = (x1 - x0) * 0.05
        return (
          <polygon key={`f-${z.value}`}
            points={`${x0 + inset},${FRAME} ${x1 - inset},${FRAME} ${x1 + spread},${Y_FRONT + 6} ${x0 - spread},${Y_FRONT + 6}`}
            fill={`url(#av-front-${z.value}-${uid})`} />
        )
      })}

      {/* Cor: il·luminació frontal afecta color i visibilitat */}
      {tokens.map(({ m, x, y, h, zone }) => {
        const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
        if (!showLights) return <Person key={m.id} x={x} y={y} h={h} skinFill={SKIN_HEX} clothesFill={c.bg} />
        const lit = fosc ? 0 : frontLevels[zone] / 4
        const backLit = fosc ? 0 : backLevels[zone] / 4
        const isBacklit = lit === 0 && backLit > 0
        const fHex = lightColor(frontZoneColors[zone])?.hex ?? WARM_HEX
        const bHex = lightColor(backZoneColors[zone])?.hex ?? WARM_HEX
        return (
          <g key={m.id}>
            {isBacklit && (
              <ellipse cx={x} cy={y - h * 0.45} rx={h * 0.18} ry={h * 0.4}
                fill="none" stroke={bHex} strokeWidth={1.5} opacity={backLit * 0.4} />
            )}
            <g opacity={fosc ? 0.05 : isBacklit ? 1 : (0.18 + 0.82 * lit)}>
              <Person x={x} y={y} h={h}
                skinFill={isBacklit ? '#0a0a0a' : tintColor(SKIN_HEX, fHex, lit)}
                clothesFill={isBacklit ? '#080808' : tintColor(c.bg, fHex, lit)} />
            </g>
          </g>
        )
      })}

      {/* Canons de seguiment: con des del pont */}
      {followspots.map((fs, i) => {
        const target = fs.member_id ? tokens.find(t => t.m.id === fs.member_id) : null
        const tx = target ? target.x : xScreen(FS_X[fs.position] ?? 0.5, 0.85)
        const ty = target ? target.y : Y_FRONT - 6
        const apexX = W / 2 + (i - (followspots.length - 1) / 2) * 90
        return (
          <g key={i}>
            <polygon points={`${apexX - 7},${FRAME} ${apexX + 7},${FRAME} ${tx + 26},${ty + 4} ${tx - 26},${ty + 4}`}
              fill="#fef3c7" opacity={0.16} />
            <ellipse cx={tx} cy={ty + 4} rx={28} ry={7} fill="#fef3c7" opacity={0.35} />
            {target && <Person x={target.x} y={target.y} h={target.h}
              skinFill={SKIN_HEX} clothesFill={(VOICE_COLORS[target.m.voice] ?? VOICE_COLORS.extra).bg} />}
          </g>
        )
      })}

      {/* Fosc general */}
      {fosc && <rect x={FRAME} y={FRAME} width={W - 2 * FRAME} height={H - FRAME - 30} fill="#020617" opacity={0.85} />}

      {/* Focus a públic: cons cap a platea */}
      {toPublic && [0.3, 0.5, 0.7].map(p => (
        <polygon key={p} points={`${W * p - 6},${FRAME} ${W * p + 6},${FRAME} ${W * p + 60},${H} ${W * p - 60},${H}`}
          fill="#fbbf24" opacity={0.18} />
      ))}

      {/* Platea */}
      <rect x={0} y={H - 30} width={W} height={30} fill={sala ? '#241a0c' : '#05080f'} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 36 + i * ((W - 72) / 11) + (i % 2 ? 9 : -6)
        const r = 13 + (i % 3) * 2.5
        return <circle key={i} cx={x} cy={H - 8 + (i % 2) * 3} r={r} fill={sala ? '#3a2d18' : '#0a0f1a'} />
      })}
      {sala && <rect x={0} y={H - 34} width={W} height={34} fill="#fbbf24" opacity={0.10} />}

      {/* Marc del prosceni */}
      <rect x={0} y={0} width={W} height={H} rx={8} fill="none" stroke="#1e293b" strokeWidth={2} />
    </svg>
  )
}
