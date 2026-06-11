import { VOICE_COLORS } from './constants'
import { CELL, LABEL_W, TOKEN_R, tokenXY, getMemberPixelPos } from './editorCanvas'

function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath(); ctx.fill()
}

// Draws a human-proportioned silhouette (head + body path) on a canvas.
// Falls back to circle+rect when the figure is too small to detail.
export function drawSilhouette(ctx, px, yTop, yFloor, figW, headFill, bodyFill, outlineColor) {
  const totalPx = yFloor - yTop
  const headR   = Math.max(2.5, totalPx * 0.115)
  const headCy  = yTop + headR

  // ── Head ──
  ctx.beginPath()
  ctx.arc(px, headCy, headR, 0, Math.PI * 2)
  ctx.fillStyle = headFill
  ctx.fill()
  if (outlineColor) { ctx.strokeStyle = outlineColor; ctx.lineWidth = 1; ctx.stroke() }

  if (totalPx < 14) {
    // Too small for detailed body — simple rounded rect
    const bTop = headCy + headR * 0.9
    const bH   = yFloor - bTop
    const r    = Math.min(2, figW / 2)
    ctx.beginPath()
    ctx.moveTo(px - figW/2 + r, bTop)
    ctx.lineTo(px + figW/2 - r, bTop); ctx.arcTo(px + figW/2, bTop, px + figW/2, bTop + r, r)
    ctx.lineTo(px + figW/2, yFloor - r); ctx.arcTo(px + figW/2, yFloor, px + figW/2 - r, yFloor, r)
    ctx.lineTo(px - figW/2 + r, yFloor); ctx.arcTo(px - figW/2, yFloor, px - figW/2, yFloor - r, r)
    ctx.lineTo(px - figW/2, bTop + r); ctx.arcTo(px - figW/2, bTop, px - figW/2 + r, bTop, r)
    ctx.closePath()
    ctx.fillStyle = bodyFill
    ctx.fill()
    if (outlineColor) { ctx.strokeStyle = outlineColor; ctx.lineWidth = 1; ctx.stroke() }
    return
  }

  // ── Body path — human proportions ──
  const hw      = figW / 2

  // Y landmarks (fractions of totalPx from yTop)
  const neckY   = headCy + headR * 0.85
  const shldrY  = yTop + totalPx * 0.22
  const waistY  = yTop + totalPx * 0.50
  const hipY    = yTop + totalPx * 0.60
  const crotchY = yTop + totalPx * 0.65

  // Half-widths
  const neckHW  = hw * 0.22
  const shldrHW = hw
  const waistHW = hw * 0.58
  const hipHW   = hw * 0.78
  const legHW   = hw * 0.38
  const legGap  = hw * 0.06

  ctx.beginPath()

  // Left neck top → expand to left shoulder (S-curve)
  ctx.moveTo(px - neckHW, neckY)
  ctx.bezierCurveTo(
    px - neckHW,  neckY  + (shldrY - neckY) * 0.3,
    px - shldrHW, shldrY - (shldrY - neckY) * 0.2,
    px - shldrHW, shldrY
  )

  // Left shoulder → taper to waist
  ctx.bezierCurveTo(
    px - shldrHW, waistY - (waistY - shldrY) * 0.3,
    px - waistHW, shldrY + (waistY - shldrY) * 0.6,
    px - waistHW, waistY
  )

  // Left waist → flare to left hip
  ctx.bezierCurveTo(
    px - waistHW, waistY + (hipY - waistY) * 0.5,
    px - hipHW,   hipY   - (hipY - waistY) * 0.1,
    px - hipHW,   hipY
  )

  // Left hip → down outer left leg
  ctx.lineTo(px - legGap - legHW, crotchY)
  ctx.lineTo(px - legGap - legHW, yFloor)

  // Inner left leg
  ctx.lineTo(px - legGap, yFloor)
  ctx.lineTo(px - legGap, crotchY + (yFloor - crotchY) * 0.08)

  // Jump inner gap (crotch curve)
  ctx.lineTo(px + legGap, crotchY + (yFloor - crotchY) * 0.08)

  // Inner right leg
  ctx.lineTo(px + legGap, yFloor)
  ctx.lineTo(px + legGap + legHW, yFloor)

  // Outer right leg up
  ctx.lineTo(px + legGap + legHW, crotchY)
  ctx.lineTo(px + hipHW, hipY)

  // Right hip → waist (mirror)
  ctx.bezierCurveTo(
    px + hipHW,   hipY   - (hipY - waistY) * 0.1,
    px + waistHW, waistY + (hipY - waistY) * 0.5,
    px + waistHW, waistY
  )

  // Right waist → shoulder
  ctx.bezierCurveTo(
    px + waistHW, shldrY + (waistY - shldrY) * 0.6,
    px + shldrHW, waistY - (waistY - shldrY) * 0.3,
    px + shldrHW, shldrY
  )

  // Right shoulder → neck
  ctx.bezierCurveTo(
    px + shldrHW, shldrY - (shldrY - neckY) * 0.2,
    px + neckHW,  neckY  + (shldrY - neckY) * 0.3,
    px + neckHW,  neckY
  )

  ctx.closePath()
  ctx.fillStyle = bodyFill
  ctx.fill()
  if (outlineColor) { ctx.strokeStyle = outlineColor; ctx.lineWidth = 1; ctx.stroke() }
}

export function drawHeightProfile(canvas, { placements, members, mode, dims, rowElevations, hoverMemberId, highlightId, hoverRow }) {
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth || 800
  const H = 200
  canvas.width  = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  const placed = members.filter(m => m.role !== 'director' && placements[m.id])
  if (!placed.length) return {}

  const { ROWS, CW, GW } = dims
  const scaleX = W / CW
  const AXIS_X = LABEL_W * scaleX
  const PAD_R  = 2
  const PAD_T  = 8
  const PAD_B  = 20   // room for tooltip below feet
  const drawH  = H - PAD_T - PAD_B

  let maxH = 0
  for (const m of placed) {
    const pos = placements[m.id]
    const row = pos.free ? Math.min(ROWS - 1, Math.floor(pos.y * ROWS)) : pos.row
    maxH = Math.max(maxH, (rowElevations?.[row] ?? 0) + (m.height ?? 170))
  }
  maxH = Math.ceil(maxH / 50) * 50 || 250

  function toY(cm) { return PAD_T + drawH * (1 - cm / maxH) }

  // floor line
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(AXIS_X, toY(0)); ctx.lineTo(W - PAD_R, toY(0)); ctx.stroke()

  // dashed platform / ground-level lines + clickable labels
  const uniqueElevs = [...new Set((rowElevations ?? []).filter(e => e > 0))].sort((a, b) => a - b)
  // also include 0 (terra) in the label set
  const allLevels = [0, ...uniqueElevs]
  // find which rows share each elevation
  const elevToRows = {}
  ;(rowElevations ?? []).forEach((e, i) => { (elevToRows[e] ??= []).push(i) })

  const labelHitAreas = {}   // elev → { x, y, w, h } for mouse hit testing
  ctx.font = '8px system-ui'; ctx.textBaseline = 'middle'

  ctx.setLineDash([4, 4]); ctx.lineWidth = 0.8
  for (const elev of uniqueElevs) {
    ctx.strokeStyle = '#2d3f55'
    ctx.beginPath(); ctx.moveTo(AXIS_X, toY(elev)); ctx.lineTo(W - PAD_R, toY(elev)); ctx.stroke()
  }
  ctx.setLineDash([])

  // labels left of AXIS_X, one per elevation level
  for (const elev of allLevels) {
    const y = toY(elev)
    const rowsAtLevel = elevToRows[elev] ?? []
    const rowName = rowsAtLevel.length && dims.rowLabels
      ? dims.rowLabels[rowsAtLevel[rowsAtLevel.length - 1]] ?? `Fila ${rowsAtLevel[0] + 1}`
      : elev === 0 ? 'Terra' : `${elev} cm`
    const isActive = hoverRow != null && rowsAtLevel.includes(hoverRow)
    ctx.fillStyle = isActive ? '#e2e8f0' : '#475569'
    ctx.textAlign = 'right'
    ctx.fillText(rowName, AXIS_X - 3, y)
    // hit area
    const tw = ctx.measureText(rowName).width
    labelHitAreas[elev] = { x: AXIS_X - 3 - tw, y: y - 6, w: tw + 3, h: 12, rows: rowsAtLevel, elev }
  }

  // sort back-to-front so front rows paint over back rows
  const sorted = [...placed].sort((a, b) => {
    const ra = placements[a.id].free ? Math.min(ROWS-1, Math.floor(placements[a.id].y * ROWS)) : placements[a.id].row
    const rb = placements[b.id].free ? Math.min(ROWS-1, Math.floor(placements[b.id].y * ROWS)) : placements[b.id].row
    return ra - rb  // row 0 = back, drawn first
  })

  const scaledCell = CELL * scaleX
  const FIG_W = Math.max(7, scaledCell * 0.38)
  const hitAreas = {}
  let hoverDraw = null  // draw hover tooltip last (on top)

  for (const m of sorted) {
    const pos = placements[m.id]
    const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra

    const px = pos.free
      ? (LABEL_W + pos.x * GW) * scaleX
      : tokenXY(pos.row, pos.col, mode, dims).x * scaleX

    const row  = pos.free ? Math.min(ROWS - 1, Math.floor(pos.y * ROWS)) : pos.row
    const elev = rowElevations?.[row] ?? 0
    const ph   = m.height ?? 170

    const yFloor  = toY(elev)
    const yTop    = toY(elev + ph)
    const totalPx = yFloor - yTop

    hitAreas[m.id] = { px, yTop, yBot: yFloor, m, row }

    const isHover     = m.id === hoverMemberId
    const isHighlight = highlightId && m.id === highlightId
    const rowDimmed   = hoverRow != null && row !== hoverRow

    // depth: row 0 (back) = 50% opacity, row ROWS-1 (front) = 100%
    const depth     = ROWS <= 1 ? 1 : 0.50 + 0.50 * (row / (ROWS - 1))
    const baseVis   = rowDimmed ? 0.28 : (isHover || isHighlight ? 1 : depth)
    const fadeVis   = rowDimmed ? 0.18 : (isHover || isHighlight ? 0.55 : depth * 0.55)
    const fullAlpha = Math.round(baseVis * 255).toString(16).padStart(2, '0')
    const fadeAlpha = Math.round(fadeVis * 255).toString(16).padStart(2, '0')

    // body gradient uses the full body range for the new silhouette
    const bodyY = yTop + totalPx * 0.22  // approx shoulder top for gradient start

    if (isHighlight) {
      const grad = ctx.createLinearGradient(0, bodyY, 0, yFloor)
      grad.addColorStop(0, c.bg + 'ff')
      grad.addColorStop(1, c.bg + '88')
      drawSilhouette(ctx, px, yTop, yFloor, FIG_W, c.bg, grad)
    } else if (highlightId && !isHighlight) {
      const strokeAlpha = rowDimmed ? '44' : fullAlpha
      drawSilhouette(ctx, px, yTop, yFloor, FIG_W, '#0f172a', '#0f172a', c.bg + strokeAlpha)
      // row-hover: white head override
      if (hoverRow != null && row === hoverRow) {
        const headR = Math.max(2.5, totalPx * 0.115)
        ctx.fillStyle = '#ffffffdd'
        ctx.beginPath(); ctx.arc(px, yTop + headR, headR, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      const grad = ctx.createLinearGradient(0, bodyY, 0, yFloor)
      grad.addColorStop(0, c.bg + fullAlpha)
      grad.addColorStop(1, c.bg + fadeAlpha)
      drawSilhouette(ctx, px, yTop, yFloor, FIG_W, c.bg + fullAlpha, grad)
      // row-hover: white head override
      if (hoverRow != null && row === hoverRow) {
        const headR = Math.max(2.5, totalPx * 0.115)
        ctx.fillStyle = '#ffffffdd'
        ctx.beginPath(); ctx.arc(px, yTop + headR, headR, 0, Math.PI * 2); ctx.fill()
      }
    }

    if (isHover) hoverDraw = { px, yFloor, m, c }
  }

  // hover tooltip — drawn after all figures, anchored below the feet
  if (hoverDraw) {
    const { px, yFloor, m, c } = hoverDraw
    const label = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.name || m.initials || ''
    ctx.font = 'bold 10px system-ui'
    const tw = ctx.measureText(label).width
    const bw = tw + 10, bh = 15
    const bx = Math.min(Math.max(px - bw / 2, AXIS_X + 2), W - PAD_R - bw - 2)
    const by = Math.min(yFloor + 3, H - bh - 2)
    ctx.fillStyle = '#1e293b'
    fillRoundRect(ctx, bx, by, bw, bh, 3)
    ctx.strokeStyle = c.bg + '77'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = c.bg
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(label, bx + bw / 2, by + bh / 2)
  }

  return { hitAreas, labelHitAreas }
}
