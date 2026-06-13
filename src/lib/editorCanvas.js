import { VOICE_COLORS } from './constants'

// ─── Static constants ─────────────────────────────────────────
export const CELL = 44
export const LABEL_W = 72
export const DIRECTOR_H = 60
export const TOKEN_R = Math.floor(CELL * 0.38)
export const DEFAULT_ROW_LABELS = ['Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra']
export const DEFAULT_COLS = 20
export const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']

export const VOICE_GROUPS = { S: ['soprano1','soprano2'], A: ['alto1','alto2'], T: ['tenor1','tenor2'], B: ['baritone','bass'] }
export const ARRANGEMENT_PATTERNS = ['SATB','ABTS','STBA','SBTA','TASB','TSAB','BAST','BSAT','ATBS','BTAS']

// ─── Rounded hexagon ──────────────────────────────────────────
function roundedHexPath(ctx, cx, cy, r, cr = 4) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  }
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const curr = pts[i], prev = pts[(i + 5) % 6], next = pts[(i + 1) % 6]
    const d1x = curr.x - prev.x, d1y = curr.y - prev.y
    const d2x = next.x - curr.x, d2y = next.y - curr.y
    const len1 = Math.hypot(d1x, d1y), len2 = Math.hypot(d2x, d2y)
    const t = Math.min(cr, len1 / 3, len2 / 3)
    const bx = curr.x - (d1x / len1) * t, by = curr.y - (d1y / len1) * t
    const ax = curr.x + (d2x / len2) * t, ay = curr.y + (d2y / len2) * t
    if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by)
    ctx.quadraticCurveTo(curr.x, curr.y, ax, ay)
  }
  ctx.closePath()
}

// ─── Geometry helpers ─────────────────────────────────────────
function semiGeometry(dims) {
  const { GW, GH, ROWS } = dims
  const cx = LABEL_W + GW / 2
  const cy = GH
  const a_max = (GW / 2) * 0.93
  const b_max = GH * 0.90
  const a_min = ROWS > 1 ? a_max * 0.42 : a_max * 0.75
  const b_min = ROWS > 1 ? b_max * 0.42 : b_max * 0.75
  const arcParams = Array.from({ length: ROWS }, (_, i) => ({
    a: ROWS === 1 ? a_max : a_max - i * (a_max - a_min) / (ROWS - 1),
    b: ROWS === 1 ? b_max : b_max - i * (b_max - b_min) / (ROWS - 1),
  }))
  return { cx, cy, arcParams }
}

export function tokenXY(row, col, mode, dims) {
  if (mode === 'semicircle' && dims) {
    const { cx, cy, arcParams } = semiGeometry(dims)
    const ap = arcParams[row] ?? arcParams[0]
    const phi = -Math.PI / 2 + col * Math.PI / Math.max(1, dims.COLS - 1)
    return { x: cx + ap.a * Math.sin(phi), y: cy - ap.b * Math.cos(phi) }
  }
  const shift = mode === 'alternate' && row % 2 === 1 ? CELL / 2 : 0
  return { x: LABEL_W + col * CELL + CELL / 2 + shift, y: row * CELL + CELL / 2 }
}

export function pixelToCell(px, py, mode, dims) {
  if (mode === 'semicircle' && dims) {
    const { cx, cy, arcParams } = semiGeometry(dims)
    let bestRow = 0, bestDist = Infinity, bestPhi = 0
    arcParams.forEach(({ a, b }, i) => {
      if (!a || !b) return
      const nx = (px - cx) / a, ny = (cy - py) / b
      const d = Math.abs(Math.sqrt(nx * nx + ny * ny) - 1)
      if (d < bestDist) { bestDist = d; bestRow = i; bestPhi = Math.atan2(nx, ny) }
    })
    if (bestDist > 0.45) return null
    if (bestPhi < -Math.PI / 2 || bestPhi > Math.PI / 2) return null
    const col = Math.round((bestPhi + Math.PI / 2) / Math.PI * (dims.COLS - 1))
    if (col < 0 || col >= dims.COLS) return null
    return { row: bestRow, col }
  }
  const row = Math.floor(py / CELL)
  if (row < 0 || row >= dims.ROWS) return null
  const shift = mode === 'alternate' && row % 2 === 1 ? CELL / 2 : 0
  const col = Math.floor((px - LABEL_W - shift) / CELL)
  if (col < 0 || col >= dims.COLS) return null
  return { row, col }
}

export function computeRelCenterX(placements, members, mode, dims) {
  const placed = members.filter(m => m.role !== 'director' && placements[m.id])
  if (!placed.length) return null
  const byRow = {}
  for (const m of placed) {
    const pos = placements[m.id]
    const row = pos.free ? Math.min(dims.ROWS - 1, Math.floor(pos.y * dims.ROWS)) : pos.row
    ;(byRow[row] ??= []).push(m)
  }
  const longest = Object.values(byRow).reduce((best, arr) => arr.length > best.length ? arr : best, [])
  if (!longest.length) return null
  const sum = longest.reduce((s, m) => {
    const pos = placements[m.id]
    if (pos.free) return s + pos.x * dims.GW
    const { x } = tokenXY(pos.row, pos.col, mode, dims)
    return s + (x - LABEL_W)
  }, 0)
  return sum / longest.length
}

export function eventToCanvas(e, rotated, dims) {
  const rect = e.currentTarget.getBoundingClientRect()
  let px = (e.clientX - rect.left) * (dims.CW / rect.width)
  let py = (e.clientY - rect.top) * (dims.CH / rect.height)
  if (rotated) { px = dims.CW - px; py = dims.CH - py }
  return { x: px, y: py }
}

export function getMemberPixelPos(pos, mode, dims) {
  if (!pos) return null
  if (pos.free) return { x: LABEL_W + pos.x * dims.GW, y: pos.y * dims.GH }
  return tokenXY(pos.row, pos.col, mode, dims)
}

function fillTextFlipped(ctx, text, x, y, rotated) {
  if (rotated) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI); ctx.fillText(text, 0, 0); ctx.restore()
  } else {
    ctx.fillText(text, x, y)
  }
}

// ─── Arrow helper ─────────────────────────────────────────────
function drawArrow(ctx, x1, y1, x2, y2, color) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len < TOKEN_R * 3) return
  const nx = dx / len, ny = dy / len, gap = TOKEN_R + 4
  const sx = x1 + nx * gap, sy = y1 + ny * gap, ex = x2 - nx * gap, ey = y2 - ny * gap
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3])
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([])
  const a = Math.atan2(ey - sy, ex - sx), hl = 7, ha = Math.PI / 5
  ctx.fillStyle = color
  ctx.beginPath(); ctx.moveTo(ex, ey)
  ctx.lineTo(ex - hl * Math.cos(a - ha), ey - hl * Math.sin(a - ha))
  ctx.lineTo(ex - hl * Math.cos(a + ha), ey - hl * Math.sin(a + ha))
  ctx.closePath(); ctx.fill()
}

// ─── Canvas draw ──────────────────────────────────────────────
export function drawAll(canvas, { placements, members, mode, highlightId, directorAbsX, directorMember,
  drag, selectedIds, rotated, dims, trajectoryConfig, soloistMicMap = {} }) {
  if (!canvas) return
  const { ROWS, COLS, rowLabels, GW, GH, CW, CH } = dims
  const dpr = window.devicePixelRatio || 1
  canvas.width = CW * dpr; canvas.height = CH * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const hasHighlight = !!highlightId

  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, CW, CH)

  if (mode === 'semicircle') {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(LABEL_W, 0, GW, GH)
    const { cx, cy, arcParams } = semiGeometry(dims)
    const NSEG = 80

    // Fill interior of outermost arc
    const ap0 = arcParams[0]
    if (ap0) {
      ctx.fillStyle = '#162032'
      ctx.beginPath()
      for (let j = 0; j <= NSEG; j++) {
        const phi = -Math.PI / 2 + j * Math.PI / NSEG
        const px2 = cx + ap0.a * Math.sin(phi), py2 = cy - ap0.b * Math.cos(phi)
        j === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2)
      }
      ctx.lineTo(cx + ap0.a, cy); ctx.lineTo(cx - ap0.a, cy); ctx.closePath(); ctx.fill()
    }

    // Draw arc lane for each row
    arcParams.forEach(({ a, b }, i) => {
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
      ctx.beginPath()
      for (let j = 0; j <= NSEG; j++) {
        const phi = -Math.PI / 2 + j * Math.PI / NSEG
        const px2 = cx + a * Math.sin(phi), py2 = cy - b * Math.cos(phi)
        j === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2)
      }
      ctx.stroke()
      // Row label above arc top
      ctx.fillStyle = '#475569'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillText(rowLabels[i] ?? `Fila ${i + 1}`, cx, cy - b - 2)
    })

    // Light radial dividers at each column
    const innerAp = arcParams[arcParams.length - 1] ?? ap0
    if (innerAp && ap0) {
      ctx.strokeStyle = '#1e3050'; ctx.lineWidth = 0.5
      for (let c = 0; c < COLS; c++) {
        const phi = -Math.PI / 2 + c * Math.PI / Math.max(1, COLS - 1)
        ctx.beginPath()
        ctx.moveTo(cx + innerAp.a * Math.sin(phi), cy - innerAp.b * Math.cos(phi))
        ctx.lineTo(cx + ap0.a * Math.sin(phi), cy - ap0.b * Math.cos(phi))
        ctx.stroke()
      }
    }
  } else if (mode === 'free') {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(LABEL_W, 0, GW, GH)
    ctx.fillStyle = '#334155'
    for (let r = 0; r <= ROWS; r++)
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.arc(LABEL_W + c * CELL, r * CELL, 1.5, 0, Math.PI * 2); ctx.fill()
      }
  } else {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(LABEL_W, 0, GW, GH)
    if (mode === 'alternate') {
      ctx.fillStyle = '#243044'
      for (let r = 1; r < ROWS; r += 2) ctx.fillRect(LABEL_W, r * CELL, GW, CELL)
    }
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(LABEL_W, r * CELL); ctx.lineTo(LABEL_W + GW, r * CELL); ctx.stroke()
    }
    for (let r = 0; r < ROWS; r++) {
      const shift = mode === 'alternate' && r % 2 === 1 ? CELL / 2 : 0
      for (let c = 0; c <= COLS; c++) {
        const x = LABEL_W + c * CELL + shift
        ctx.beginPath(); ctx.moveTo(x, r * CELL); ctx.lineTo(x, (r + 1) * CELL); ctx.stroke()
      }
    }
    ctx.fillStyle = '#475569'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    for (let c = 0; c < COLS; c += 2)
      fillTextFlipped(ctx, c + 1, LABEL_W + c * CELL + CELL / 2, 3, rotated)
  }

  if (mode !== 'semicircle') {
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textBaseline = 'middle'
    if (rotated) {
      // When CSS-rotated 180°, draw labels at right edge of canvas → they appear on the left on screen
      ctx.textAlign = 'center'
      const lx = CW - LABEL_W / 2
      for (let r = 0; r < ROWS; r++)
        fillTextFlipped(ctx, rowLabels[r] ?? `Fila ${r + 1}`, lx, r * CELL + CELL / 2, rotated)
    } else {
      ctx.textAlign = 'right'
      for (let r = 0; r < ROWS; r++)
        fillTextFlipped(ctx, rowLabels[r] ?? `Fila ${r + 1}`, LABEL_W - 6, r * CELL + CELL / 2, rotated)
    }
  }

  if (mode !== 'free') {
    const relCX = computeRelCenterX(placements, members, mode, dims)
    if (relCX != null) {
      ctx.strokeStyle = '#fbbf2466'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(LABEL_W + relCX, 0); ctx.lineTo(LABEL_W + relCX, GH); ctx.stroke(); ctx.setLineDash([])
    }
  }

  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, GH); ctx.lineTo(CW, GH); ctx.stroke()
  ctx.fillStyle = '#475569'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  const dirLabel = directorMember ? (directorMember.initials || (directorMember.first_name ?? '').slice(0,1) + (directorMember.last_name ?? '').slice(0,1)) : 'DIR'
  if (rotated) {
    ctx.textAlign = 'center'
    fillTextFlipped(ctx, dirLabel.toUpperCase(), CW - LABEL_W / 2, GH + DIRECTOR_H / 2, rotated)
  } else {
    ctx.textAlign = 'right'
    fillTextFlipped(ctx, dirLabel.toUpperCase(), LABEL_W - 6, GH + DIRECTOR_H / 2, rotated)
  }

  if (trajectoryConfig) {
    drawTrajectoryOverlay(ctx, trajectoryConfig, mode, dims, members)
    if (directorAbsX != null) drawDirectorToken(ctx, directorAbsX, GH + DIRECTOR_H / 2, false, rotated, directorMember, false)
    return
  }

  const skipIds = new Set()
  if (drag?.type === 'member') skipIds.add(drag.memberId)
  if (drag?.type === 'group') drag.members.forEach(id => skipIds.add(id))

  for (const m of members) {
    if (m.role === 'director') continue
    const pos = placements[m.id]
    if (!pos || skipIds.has(m.id)) continue
    const { x, y } = getMemberPixelPos(pos, mode, dims)
    drawToken(ctx, x, y, m, highlightId === m.id, selectedIds?.has(m.id) ?? false, hasHighlight, rotated, soloistMicMap[m.id])
  }

  if (drag?.type === 'group' && drag.originalPositions) {
    const dx = drag.currentX - drag.anchorPixelX, dy = drag.currentY - drag.anchorPixelY
    ctx.globalAlpha = 0.6
    for (const id of drag.members) {
      const orig = drag.originalPositions[id], m = members.find(m => m.id === id)
      if (orig && m) drawToken(ctx, orig.x + dx, orig.y + dy, m, false, false, false, rotated)
    }
    ctx.globalAlpha = 1
  }
  if (drag?.type === 'member') {
    const m = members.find(m => m.id === drag.memberId)
    if (m) {
      ctx.globalAlpha = 0.6; drawToken(ctx, drag.x, drag.y, m, false, false, false, rotated); ctx.globalAlpha = 1
      if (mode !== 'free') {
        const cell = pixelToCell(drag.x, drag.y, mode, dims)
        if (cell) {
          const { x, y } = tokenXY(cell.row, cell.col, mode, dims)
          ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
          roundedHexPath(ctx, x, y, TOKEN_R + 3); ctx.stroke(); ctx.setLineDash([])
        }
      }
    }
  }
  if (drag?.type === 'select-rect') {
    const rx = Math.min(drag.startX, drag.currentX), ry = Math.min(drag.startY, drag.currentY)
    const rw = Math.abs(drag.currentX - drag.startX), rh = Math.abs(drag.currentY - drag.startY)
    ctx.fillStyle = '#06b6d418'; ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
    ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([])
  }
  const directorHighlighted = hasHighlight && !!directorMember && highlightId === directorMember.id
  if (directorAbsX != null) drawDirectorToken(ctx, directorAbsX, GH + DIRECTOR_H / 2, directorHighlighted, rotated, directorMember, hasHighlight)
}

export function drawToken(ctx, x, y, member, highlighted, selected, hasHighlight, rotated, soloistMic) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const initials = (member.initials || member.name.slice(0, 2)).toUpperCase()
  if (selected) {
    roundedHexPath(ctx, x, y, TOKEN_R + 5); ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.stroke()
  }
  if (hasHighlight && !highlighted) {
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.strokeStyle = c.bg + 'aa'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg + '88'; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    fillTextFlipped(ctx, initials, x, y, rotated)
  } else if (highlighted) {
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.fillStyle = c.bg; ctx.fill()
    ctx.fillStyle = c.fg; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    fillTextFlipped(ctx, initials, x, y, rotated)
  } else {
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.fillStyle = c.bg; ctx.fill()
    ctx.fillStyle = c.fg; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    fillTextFlipped(ctx, initials, x, y, rotated)
  }
  // Soloist badge: white circle top-right with mic label
  if (soloistMic != null) {
    const bx = x + TOKEN_R * 0.65, by = y - TOKEN_R * 0.65
    ctx.beginPath(); ctx.arc(bx, by, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()
    ctx.fillStyle = '#111'; ctx.font = 'bold 7px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(soloistMic === true ? '●' : String(soloistMic), bx, by)
  }
}

// Director hexagon
export function drawDirectorToken(ctx, x, y, highlighted, rotated, directorMember, hasHighlight) {
  const c = VOICE_COLORS.director
  const label = directorMember
    ? (directorMember.initials || ((directorMember.first_name ?? '').slice(0,1) + (directorMember.last_name ?? '').slice(0,1))).toUpperCase()
    : 'DIR'
  const r = TOKEN_R * 1.15
  if (highlighted) {
    roundedHexPath(ctx, x, y, r); ctx.fillStyle = '#0f172a'; ctx.fill()
    ctx.strokeStyle = c.bg; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg
  } else if (hasHighlight) {
    roundedHexPath(ctx, x, y, r); ctx.strokeStyle = c.bg + 'aa'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg + '55'
  } else {
    roundedHexPath(ctx, x, y, r); ctx.fillStyle = c.bg; ctx.fill()
    ctx.fillStyle = c.fg
  }
  ctx.font = 'bold 9px system-ui'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  fillTextFlipped(ctx, label, x, y, rotated)
}

function drawTrajectoryOverlay(ctx, { allMoments, allPositions, memberId, currentMomentId }, mode, dims, members) {
  const member = members.find(m => m.id === memberId)
  if (!member) return
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const traj = []
  for (const m of allMoments) {
    const pos = allPositions[m.id]?.[memberId]
    if (pos) {
      const pt = getMemberPixelPos(pos, mode, dims)
      if (pt) traj.push({ momentId: m.id, pt, n: traj.length + 1 })
    }
  }
  ctx.globalAlpha = 0.18
  const currentPlacements = allPositions[currentMomentId] ?? {}
  for (const [mId, pos] of Object.entries(currentPlacements)) {
    if (mId === memberId) continue
    const m = members.find(m => m.id === mId)
    if (!m || m.role === 'director') continue
    const pt = getMemberPixelPos(pos, mode, dims)
    if (pt) drawToken(ctx, pt.x, pt.y, m, false, false, false)
  }
  ctx.globalAlpha = 1
  for (let i = 0; i < traj.length - 1; i++)
    drawArrow(ctx, traj[i].pt.x, traj[i].pt.y, traj[i + 1].pt.x, traj[i + 1].pt.y, c.bg + 'cc')
  for (const { pt, n, momentId } of traj) {
    const isCurrent = momentId === currentMomentId
    ctx.beginPath(); ctx.arc(pt.x, pt.y, TOKEN_R + (isCurrent ? 3 : 0), 0, Math.PI * 2)
    ctx.fillStyle = isCurrent ? c.bg : c.bg + 'bb'; ctx.fill()
    if (isCurrent) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke() }
    ctx.fillStyle = c.fg; ctx.font = `bold ${TOKEN_R > 14 ? 11 : 9}px system-ui`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), pt.x, pt.y)
  }
}
