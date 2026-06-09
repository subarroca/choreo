import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Hexagon, Move,
  RotateCcw, Waypoints, GripVertical, Pencil, X,
  ChevronUp, ChevronDown,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Plus, AlignCenter, AlignVerticalJustifyEnd, Target, Mic, LayoutTemplate, Disc,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, VOICE_SHORT } from '../lib/constants' // VOICE_SHORT used in members sidebar
import Layout from '../components/Layout'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Static constants ─────────────────────────────────────────
const CELL = 44
const LABEL_W = 72
const DIRECTOR_H = 60
const TOKEN_R = Math.floor(CELL * 0.38)
const DEFAULT_ROW_LABELS = ['Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra']
const DEFAULT_COLS = 20
const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']

const VOICE_GROUPS = { S: ['soprano1','soprano2'], A: ['alto1','alto2'], T: ['tenor1','tenor2'], B: ['baritone','bass'] }
const ARRANGEMENT_PATTERNS = ['SATB','ABTS','STBA','SBTA','TASB','TSAB','BAST','BSAT','ATBS','BTAS']

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
// Semi-oval: all rows become concentric elliptic arcs spanning full GW × GH.
// Row 0 = outer/back arc, Row ROWS-1 = inner/front arc.
// Token formula: phi = -PI/2 (left) … +PI/2 (right)
//   x = cx + a_row * sin(phi)
//   y = cy - b_row * cos(phi)
// where cy = GH (base at bottom of grid), a/b scale outward per row.

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

function tokenXY(row, col, mode, dims) {
  if (mode === 'semicircle' && dims) {
    const { cx, cy, arcParams } = semiGeometry(dims)
    const ap = arcParams[row] ?? arcParams[0]
    const phi = -Math.PI / 2 + col * Math.PI / Math.max(1, dims.COLS - 1)
    return { x: cx + ap.a * Math.sin(phi), y: cy - ap.b * Math.cos(phi) }
  }
  const shift = mode === 'alternate' && row % 2 === 1 ? CELL / 2 : 0
  return { x: LABEL_W + col * CELL + CELL / 2 + shift, y: row * CELL + CELL / 2 }
}
function pixelToCell(px, py, mode, dims) {
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
function computeRelCenterX(placements, members, mode, dims) {
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
function eventToCanvas(e, rotated, dims) {
  const rect = e.currentTarget.getBoundingClientRect()
  let px = (e.clientX - rect.left) * (dims.CW / rect.width)
  let py = (e.clientY - rect.top) * (dims.CH / rect.height)
  if (rotated) { px = dims.CW - px; py = dims.CH - py }
  return { x: px, y: py }
}
function getMemberPixelPos(pos, mode, dims) {
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
function drawAll(canvas, { placements, members, mode, highlightId, directorAbsX, directorMember,
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
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
    for (let r = 0; r < ROWS; r++)
      fillTextFlipped(ctx, rowLabels[r] ?? `Fila ${r + 1}`, LABEL_W - 6, r * CELL + CELL / 2, rotated)
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
  fillTextFlipped(ctx, dirLabel.toUpperCase(), LABEL_W - 6, GH + DIRECTOR_H / 2, rotated)

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
    ctx.fillStyle = '#3b82f618'; ctx.fillRect(rx, ry, rw, rh)
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
    ctx.strokeRect(rx, ry, rw, rh); ctx.setLineDash([])
  }
  const directorHighlighted = hasHighlight && !!directorMember && highlightId === directorMember.id
  if (directorAbsX != null) drawDirectorToken(ctx, directorAbsX, GH + DIRECTOR_H / 2, directorHighlighted, rotated, directorMember, hasHighlight)
}

function drawToken(ctx, x, y, member, highlighted, selected, hasHighlight, rotated, soloistMic) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const initials = (member.initials || member.name.slice(0, 2)).toUpperCase()
  if (selected) {
    roundedHexPath(ctx, x, y, TOKEN_R + 5); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.stroke()
  }
  if (hasHighlight && !highlighted) {
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.strokeStyle = c.bg + 'aa'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg + '88'; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    fillTextFlipped(ctx, initials, x, y, rotated)
  } else if (highlighted) {
    // "soc jo": color bg + neutral text — same as normal but stands out among dimmed others
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
// highlighted=true  → "soc jo" is me: dark bg + amber border + amber text
// hasHighlight=true, highlighted=false → someone else is "soc jo": outline only, dimmed
// normal → amber fill + dark text
function drawDirectorToken(ctx, x, y, highlighted, rotated, directorMember, hasHighlight) {
  const c = VOICE_COLORS.director
  const label = directorMember
    ? (directorMember.initials || ((directorMember.first_name ?? '').slice(0,1) + (directorMember.last_name ?? '').slice(0,1))).toUpperCase()
    : 'DIR'
  const r = TOKEN_R * 1.15
  if (highlighted) {
    // "soc jo" = me: inverted
    roundedHexPath(ctx, x, y, r); ctx.fillStyle = '#0f172a'; ctx.fill()
    ctx.strokeStyle = c.bg; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg
  } else if (hasHighlight) {
    // "soc jo" active but I'm not it: stroke + dimmed, like choir members
    roundedHexPath(ctx, x, y, r); ctx.strokeStyle = c.bg + 'aa'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg + '55'
  } else {
    // normal
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

// ─── Height profile ───────────────────────────────────────────
function fillRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath(); ctx.fill()
}

function drawHeightProfile(canvas, { placements, members, mode, dims, rowElevations, hoverMemberId, highlightId, hoverRow }) {
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

    const yFloor   = toY(elev)
    const yTop     = toY(elev + ph)
    const totalPx  = yFloor - yTop

    const headR    = Math.max(3, totalPx * 0.13)
    const headCy   = yTop + headR
    const bodyTop  = headCy + headR * 1.1
    const bodyW    = FIG_W

    hitAreas[m.id] = { px, yTop: yTop - headR, yBot: yFloor, m, row }

    const isHover     = m.id === hoverMemberId
    const isHighlight = highlightId && m.id === highlightId
    const rowDimmed   = hoverRow != null && row !== hoverRow

    // depth: row 0 (back) = 50% opacity, row ROWS-1 (front) = 100%
    const depth    = ROWS <= 1 ? 1 : 0.50 + 0.50 * (row / (ROWS - 1))
    // row-hover dims others gently (30%), not aggressively
    const baseVis  = rowDimmed ? 0.28 : (isHover || isHighlight ? 1 : depth)
    const fadeVis  = rowDimmed ? 0.18 : (isHover || isHighlight ? 0.55 : depth * 0.55)
    const fullAlpha = Math.round(baseVis * 255).toString(16).padStart(2, '0')
    const fadeAlpha = Math.round(fadeVis * 255).toString(16).padStart(2, '0')

    if (isHighlight) {
      // "soc jo": same as zenital — full color fill, no dimming (color head + color gradient body)
      const grad = ctx.createLinearGradient(0, bodyTop, 0, yFloor)
      grad.addColorStop(0, c.bg + 'ff')
      grad.addColorStop(1, c.bg + '88')
      ctx.fillStyle = c.bg
      ctx.beginPath(); ctx.arc(px, headCy, headR, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = grad
      fillRoundRect(ctx, px - bodyW / 2, bodyTop, bodyW, yFloor - bodyTop, 2)
    } else if (highlightId && !isHighlight) {
      // "soc jo" mode, others: stroke outline + neutral fill (dark bg with color ring)
      const strokeAlpha = rowDimmed ? '44' : fullAlpha
      ctx.strokeStyle = c.bg + strokeAlpha; ctx.lineWidth = 1
      ctx.fillStyle = '#0f172a'
      ctx.beginPath(); ctx.arc(px, headCy, headR, 0, Math.PI * 2); ctx.fill()
      ctx.stroke()
      // body: dark fill + color stroke outline
      ctx.fillStyle = '#0f172a'
      fillRoundRect(ctx, px - bodyW / 2, bodyTop, bodyW, yFloor - bodyTop, 2)
      ctx.strokeStyle = c.bg + strokeAlpha; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.rect(px - bodyW / 2, bodyTop, bodyW, yFloor - bodyTop)
      ctx.stroke()
      // row-hover: white head
      if (hoverRow != null && row === hoverRow) {
        ctx.fillStyle = '#ffffffdd'
        ctx.beginPath(); ctx.arc(px, headCy, headR, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      // normal mode: color gradient fill
      const grad = ctx.createLinearGradient(0, bodyTop, 0, yFloor)
      grad.addColorStop(0, c.bg + fullAlpha)
      grad.addColorStop(1, c.bg + fadeAlpha)
      ctx.fillStyle = c.bg + fullAlpha
      ctx.beginPath(); ctx.arc(px, headCy, headR, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = grad
      fillRoundRect(ctx, px - bodyW / 2, bodyTop, bodyW, yFloor - bodyTop, 2)
      // row-hover: white head
      if (hoverRow != null && row === hoverRow) {
        ctx.fillStyle = '#ffffffdd'
        ctx.beginPath(); ctx.arc(px, headCy, headR, 0, Math.PI * 2); ctx.fill()
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

// ─── Sortable row item ────────────────────────────────────────
function SortableRow({ id, label, elevation, onEdit, onEditElevation, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-1">
      <button {...attributes} {...listeners}
        className="text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none px-0.5">
        <GripVertical size={10} />
      </button>
      <input value={label} onChange={e => onEdit(e.target.value)}
        className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-blue-500" />
      <input value={elevation ?? 0} onChange={e => onEditElevation(e.target.value)}
        type="number" min="0" max="300" step="5"
        className="w-12 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-blue-500 tabular-nums"
        title="Alçada de la tarima (cm)" />
      <span className="text-[9px] text-gray-700 shrink-0">cm</span>
      <button onClick={onRemove} className="text-gray-600 hover:text-red-500 shrink-0">
        <X size={10} />
      </button>
    </div>
  )
}

// ─── Sidebar section ──────────────────────────────────────────
function SidebarSection({ title, open, onToggle, children, badge }) {
  return (
    <div>
      <button onClick={onToggle}
        className="flex items-center justify-between w-full text-[10px] text-gray-600 uppercase tracking-wider font-medium hover:text-gray-400 py-0.5 select-none">
        <span className="flex items-center gap-1">{title}{badge && <span className="text-gray-700 font-normal normal-case">{badge}</span>}</span>
        {open ? <ChevronUp size={9} className="text-gray-700" /> : <ChevronDown size={9} className="text-gray-700" />}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────
export default function Editor() {
  const { id: showId, sid: songId, mid: momentId } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [song, setSong] = useState(null)
  const [moment, setMoment] = useState(null)
  const [moments, setMoments] = useState([])
  const [members, setMembers] = useState([])
  const [placements, setPlacements] = useState({})
  const [mode, setMode] = useState('alternate')
  const [rotated, setRotated] = useState(() => localStorage.getItem('rotated') === 'true')
  const [highlightId, setHighlightId] = useState(() => localStorage.getItem('highlightMemberId') || '')
  const [directorManualX, setDirectorManualX] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Sidebar panels
  const [panels, setPanels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('editorPanels') ?? '{}') } catch { return {} }
  })
  const isPanelOpen = (key, def = true) => panels[key] ?? def
  function togglePanel(key, def = true) {
    const next = { ...panels, [key]: !isPanelOpen(key, def) }
    setPanels(next); localStorage.setItem('editorPanels', JSON.stringify(next))
  }

  // Voice subgroup collapse
  const [collapsedVoices, setCollapsedVoices] = useState(new Set())

  // Trajectory
  const [trajectoryMode, setTrajectoryMode] = useState(false)
  const [trajectoryMemberId, setTrajectoryMemberId] = useState('')
  const [allSongPositions, setAllSongPositions] = useState({})

  // Edit moment panel
  const [editingMoment, setEditingMoment] = useState(false)
  const [editMomentTitle, setEditMomentTitle] = useState('')
  const [editMomentSubtitle, setEditMomentSubtitle] = useState('')
  const [momentSoloists, setMomentSoloists] = useState([]) // [{member_id, mic_number}]

  // Arrangement prefill
  const [showArrange, setShowArrange] = useState(false)
  const [arrangeAxis, setArrangeAxis] = useState('cols')
  const [arrangeReplaceAll, setArrangeReplaceAll] = useState(false)

  // Context menu
  const [contextMenu, setContextMenu] = useState(null) // { x, y, member }

  // Add moment panel
  const [addingMoment, setAddingMoment] = useState(false)
  const [newMomentTitle, setNewMomentTitle] = useState('')
  const [cloneFrom, setCloneFrom] = useState('')
  const [otherSongs, setOtherSongs] = useState(null)
  const [otherSongMoments, setOtherSongMoments] = useState({})
  const [selectedOtherSongId, setSelectedOtherSongId] = useState('')
  const [selectedOtherMomentId, setSelectedOtherMomentId] = useState('')

  const [showHeightProfile, setShowHeightProfile] = useState(true)
  const [hoverProfileId, setHoverProfileId] = useState(null)
  const [hoverProfileRow, setHoverProfileRow] = useState(null)
  const [hoverZenithInfo, setHoverZenithInfo] = useState(null) // { member, x, y } relative to canvas element

  const canvasRef = useRef(null)
  const heightCanvasRef = useRef(null)
  const profileHitRef = useRef({})
  const dragRef = useRef(null)
  const dirDragRef = useRef(null)
  const placementsRef = useRef(placements)
  const modeRef = useRef(mode)
  const membersRef = useRef(members)
  const highlightRef = useRef(highlightId)
  const dirManualXRef = useRef(directorManualX)
  const selectedIdsRef = useRef(selectedIds)
  const rotatedRef = useRef(rotated)
  const dimsRef = useRef(null)
  const saveTimerRef = useRef(null)
  const gridSaveTimerRef = useRef(null)
  const shiftSelectedRef = useRef(null)
  const momentsRef = useRef(moments)
  const allSongPositionsRef = useRef(allSongPositions)

  useEffect(() => { placementsRef.current = placements }, [placements])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { highlightRef.current = highlightId }, [highlightId])
  useEffect(() => { dirManualXRef.current = directorManualX }, [directorManualX])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { rotatedRef.current = rotated }, [rotated])
  useEffect(() => { momentsRef.current = moments }, [moments])
  useEffect(() => { allSongPositionsRef.current = allSongPositions }, [allSongPositions])
  // contextMenu closes via backdrop (see JSX)

  // ─── Derived dims ────────────────────────────────────────
  const rowLabels    = show?.grid_rows      ?? DEFAULT_ROW_LABELS
  const rowElevations = show?.row_elevations ?? rowLabels.map((_, i, a) => (a.length - 1 - i) * 40)
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const GW = COLS * CELL
  const GH = ROWS * CELL
  const CW = LABEL_W + GW
  const CH = GH + DIRECTOR_H
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW, CH, rowElevations }
  dimsRef.current = dims

  // ─── Load ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [showRes, songRes, momentRes, momentsRes, membersRes, exclusionsRes, posRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('songs').select('*').eq('id', songId).single(),
        supabase.from('moments').select('*').eq('id', momentId).single(),
        supabase.from('moments').select('*').eq('song_id', songId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('positions').select('*').eq('moment_id', momentId),
      ])
      setShow(showRes.data)
      setSong(songRes.data)
      const m = momentRes.data
      setMoment(m); setMode(m?.grid_mode ?? 'alternate')
      setEditMomentTitle(m?.title ?? ''); setEditMomentSubtitle(m?.subtitle ?? '')
      setMomentSoloists(Array.isArray(m?.soloists) ? m.soloists : (m?.soloists ? JSON.parse(m.soloists) : []))
      setMoments(momentsRes.data ?? [])
      const excludedIds = new Set((exclusionsRes.data ?? []).map(e => e.member_id))
      const mems = (membersRes.data ?? []).filter(m => m.active !== false && !excludedIds.has(m.id))
      setMembers(mems); membersRef.current = mems
      const p = {}
      for (const pos of (posRes.data ?? [])) {
        if (pos.free_x != null && pos.free_y != null)
          p[pos.member_id] = { free: true, x: pos.free_x, y: pos.free_y }
        else if (pos.grid_row != null)
          p[pos.member_id] = { row: pos.grid_row, col: pos.grid_col }
      }
      setPlacements(p); placementsRef.current = p
      setDirectorManualX(null); dirManualXRef.current = null
      setSelectedIds(new Set())
      setTrajectoryMode(false); setTrajectoryMemberId('')
    }
    load()
  }, [momentId])

  // ─── Director X ──────────────────────────────────────────
  const relCX = mode === 'free' ? null : computeRelCenterX(placements, members, mode, dims)
  const directorAbsX = mode === 'free'
    ? LABEL_W + GW / 2
    : directorManualX != null ? LABEL_W + directorManualX
    : relCX != null ? LABEL_W + relCX : null

  function currentDirAbsX() {
    const d = dimsRef.current
    if (modeRef.current === 'free') return LABEL_W + d.GW / 2
    const mX = dirManualXRef.current
    const rCX = computeRelCenterX(placementsRef.current, membersRef.current, modeRef.current, d)
    return mX != null ? LABEL_W + mX : rCX != null ? LABEL_W + rCX : null
  }

  // ─── Draw ────────────────────────────────────────────────
  useEffect(() => {
    const tConfig = trajectoryMode && trajectoryMemberId
      ? { allMoments: moments, allPositions: allSongPositions, memberId: trajectoryMemberId, currentMomentId: momentId }
      : null
    const directorMember = members.find(m => m.role === 'director') ?? null
    const soloistMicMap = Object.fromEntries((momentSoloists ?? []).map(s => [s.member_id, s.mic_number || true]))
    drawAll(canvasRef.current, { placements, members, mode, highlightId, directorAbsX, directorMember,
      drag: null, selectedIds, rotated, dims, trajectoryConfig: tConfig, soloistMicMap })
  }, [placements, members, mode, highlightId, directorAbsX, selectedIds, rotated,
    dims, trajectoryMode, trajectoryMemberId, allSongPositions, momentId, moments, momentSoloists])

  // ─── Height profile draw ─────────────────────────────────
  useEffect(() => {
    if (!showHeightProfile) return
    const canvas = heightCanvasRef.current
    if (!canvas) return
    const result = drawHeightProfile(canvas, { placements, members, mode, dims, rowElevations, hoverMemberId: hoverProfileId, highlightId, hoverRow: hoverProfileRow })
    if (result) profileHitRef.current = result
  }, [placements, members, mode, dims, rowElevations, showHeightProfile, hoverProfileId, highlightId, hoverProfileRow])

  function handleProfileMouseMove(e) {
    const canvas = heightCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { hitAreas = {}, labelHitAreas = {} } = profileHitRef.current ?? {}

    // Check label hit areas first — these activate row highlight mode
    for (const { x, y, w, h, rows } of Object.values(labelHitAreas)) {
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
        setHoverProfileId(null)
        setHoverProfileRow(rows[0] ?? null)
        return
      }
    }

    // Hit-test individual figures
    let foundId = null
    let foundRow = null
    let bestDist = Infinity
    for (const [id, { px, yTop, yBot, row }] of Object.entries(hitAreas)) {
      if (my >= yTop - 2 && my <= yBot + 2) {
        const d = Math.abs(mx - px)
        if (d < bestDist && d < 20) { bestDist = d; foundId = id; foundRow = row }
      }
    }
    setHoverProfileId(foundId)
    setHoverProfileRow(foundId ? null : null)
  }

  function handleProfileMouseLeave() { setHoverProfileId(null); setHoverProfileRow(null) }

  function redrawWithDrag(drag) {
    const dm = membersRef.current.find(m => m.role === 'director') ?? null
    drawAll(canvasRef.current, {
      placements: placementsRef.current, members: membersRef.current, mode: modeRef.current,
      highlightId: highlightRef.current, directorAbsX: currentDirAbsX(), directorMember: dm,
      drag, selectedIds: selectedIdsRef.current, rotated: rotatedRef.current,
      dims: dimsRef.current, trajectoryConfig: null,
    })
  }

  // ─── Save ────────────────────────────────────────────────
  function scheduleSave(p) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const rows = Object.entries(p).map(([memberId, pos]) => ({
        moment_id: momentId, member_id: memberId,
        grid_row: pos.free ? null : pos.row, grid_col: pos.free ? null : pos.col,
        free_x: pos.free ? pos.x : null, free_y: pos.free ? pos.y : null,
      }))
      supabase.from('positions').delete().eq('moment_id', momentId).then(() => {
        if (rows.length) supabase.from('positions').insert(rows)
      })
    }, 800)
  }
  function applyPlacements(next) {
    placementsRef.current = next; setPlacements(next); scheduleSave(next)
  }

  // ─── Grid config ─────────────────────────────────────────
  function scheduleGridSave(gridRows, gridCols, gridElevations) {
    clearTimeout(gridSaveTimerRef.current)
    gridSaveTimerRef.current = setTimeout(() => {
      supabase.from('shows').update({ grid_rows: gridRows, grid_cols: gridCols, row_elevations: gridElevations }).eq('id', showId)
    }, 600)
  }
  function setRowLabels(labels, elevs) {
    const e = elevs ?? rowElevations
    setShow(prev => ({ ...prev, grid_rows: labels, row_elevations: e }))
    scheduleGridSave(labels, COLS, e)
  }
  function addRow() {
    setRowLabels([`Fila ${ROWS + 1}`, ...rowLabels], [0, ...rowElevations])
  }
  function removeRow(i) {
    if (ROWS > 1) setRowLabels(rowLabels.filter((_, idx) => idx !== i), rowElevations.filter((_, idx) => idx !== i))
  }
  function updateRowLabel(i, val) { setRowLabels(rowLabels.map((l, idx) => idx === i ? val : l)) }
  function updateRowElevation(i, val) {
    const e = rowElevations.map((v, idx) => idx === i ? Math.max(0, parseInt(val) || 0) : v)
    setShow(prev => ({ ...prev, row_elevations: e })); scheduleGridSave(rowLabels, COLS, e)
  }
  function reorderRows(newLabels) {
    // reorder elevations the same way
    const newElevs = newLabels.map(label => {
      const i = rowLabels.indexOf(label)
      return i >= 0 ? rowElevations[i] : 0
    })
    setRowLabels(newLabels, newElevs)
  }
  function updateCols(n) {
    const c = Math.max(4, Math.min(30, n))
    setShow(prev => ({ ...prev, grid_cols: c })); scheduleGridSave(rowLabels, c, rowElevations)
  }

  // ─── Compact / pinya ─────────────────────────────────────
  // axis: 'h' = horizontal only (pack within rows, no row change)
  //       'hv' = horizontal + vertical (also pack rows together)
  function compactPositions(axis = 'hv') {
    const d = dimsRef.current
    const placed = []
    for (const [id, pos] of Object.entries(placementsRef.current)) {
      if (!pos || pos.free) continue
      const m = membersRef.current.find(m => m.id === id)
      if (!m || m.role === 'director') continue
      placed.push({ id, row: pos.row, col: pos.col })
    }
    if (!placed.length) return
    placed.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
    const next = { ...placementsRef.current }

    // Group by original row
    const byRow = {}
    for (const p of placed) (byRow[p.row] ??= []).push(p)
    const occupiedRows = Object.keys(byRow).map(Number).sort((a, b) => a - b)

    if (axis === 'h') {
      // Pack each row to center, no gaps
      for (const origRow of occupiedRows) {
        const items = byRow[origRow]
        const n = items.length
        const startCol = Math.max(0, Math.floor((d.COLS - n) / 2))
        items.forEach(({ id }, i) => { next[id] = { row: origRow, col: startCol + i } })
      }
    } else {
      // H+V: compact rows to consecutive, starting from bottom, each row packed to center
      const numRows = occupiedRows.length
      const startRow = Math.max(0, d.ROWS - numRows)
      occupiedRows.forEach((origRow, rowIdx) => {
        const newRow = startRow + rowIdx
        const items = byRow[origRow]
        const n = items.length
        const startCol = Math.max(0, Math.floor((d.COLS - n) / 2))
        items.forEach(({ id }, i) => { next[id] = { row: newRow, col: startCol + i } })
      })
    }

    applyPlacements(next)
  }

  // ─── Auto-place by arrangement ───────────────────────────
  function autoPlaceByArrangement(pattern, axis, replaceAll) {
    const d = dimsRef.current
    const mems = membersRef.current.filter(m => m.role !== 'director')
    const base = replaceAll ? {} : { ...placementsRef.current }

    // Build groups: letter → members of those voices (sorted by VOICE_ORDER within group)
    const groups = pattern.split('').map(letter => {
      const voices = VOICE_GROUPS[letter] ?? []
      return {
        letter,
        voices,
        members: mems.filter(m => voices.includes(m.voice))
          .sort((a, b) => VOICE_ORDER.indexOf(a.voice) - VOICE_ORDER.indexOf(b.voice)),
      }
    }).filter(g => g.members.length > 0)

    const totalMembers = groups.reduce((s, g) => s + g.members.length, 0)
    if (totalMembers === 0) return

    const next = { ...base }

    // Aim for compact square-ish blocks per group.
    // optimalRows: how many rows each group should use (2-3 typically).
    const maxGroupSize = Math.max(...groups.map(g => g.members.length))
    const optimalRows = Math.min(d.ROWS, Math.max(2, Math.round(Math.sqrt(maxGroupSize))))

    if (axis === 'cols') {
      // Each group gets a narrow column slice (cols = ceil(members / optimalRows)).
      // The whole block is centered in the grid.
      const groupSlices = groups.map(g => ({
        ...g,
        sliceWidth: Math.max(1, Math.ceil(g.members.length / optimalRows)),
      }))
      const totalWidth = groupSlices.reduce((s, g) => s + g.sliceWidth, 0)
      let colCursor = Math.max(0, Math.floor((d.COLS - totalWidth) / 2))

      groupSlices.forEach(g => {
        const startCol = colCursor
        colCursor += g.sliceWidth

        g.members.forEach((m, i) => {
          if (!replaceAll && placementsRef.current[m.id]) return
          const row = Math.max(0, d.ROWS - 1 - Math.floor(i / g.sliceWidth))
          const col = startCol + (i % g.sliceWidth)
          next[m.id] = { row, col }
        })
      })
    } else {
      // axis === 'rows': each group gets a band of rows, members centered horizontally.
      // colsPerRow: ceil(maxGroupSize / optimalRows), then centered.
      const colsPerRow = Math.min(d.COLS, Math.max(1, Math.ceil(maxGroupSize / optimalRows)))
      const startCol = Math.max(0, Math.floor((d.COLS - colsPerRow) / 2))
      let rowCursor = d.ROWS - 1

      groups.forEach(g => {
        const rowsNeeded = Math.max(1, Math.ceil(g.members.length / colsPerRow))
        g.members.forEach((m, i) => {
          if (!replaceAll && placementsRef.current[m.id]) return
          const rowOffset = Math.floor(i / colsPerRow)
          const row = Math.max(0, rowCursor - rowOffset)
          // center each row within the block if it's the last partial row
          const inThisRow = Math.min(colsPerRow, g.members.length - rowOffset * colsPerRow)
          const rowStart = startCol + Math.floor((colsPerRow - inThisRow) / 2)
          next[m.id] = { row, col: rowStart + (i % colsPerRow) }
        })
        rowCursor = Math.max(0, rowCursor - rowsNeeded)
      })
    }

    applyPlacements(next)
  }

  // ─── Moment meta ─────────────────────────────────────────
  async function saveMomentMeta() {
    const title = editMomentTitle.trim(); if (!title) return
    const subtitle = editMomentSubtitle.trim()
    await supabase.from('moments').update({ title, subtitle }).eq('id', momentId)
    setMoment(prev => ({ ...prev, title, subtitle }))
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, title, subtitle } : m))
    setEditingMoment(false)
  }

  async function saveSoloists(soloists) {
    setMomentSoloists(soloists)
    await supabase.from('moments').update({ soloists: JSON.stringify(soloists) }).eq('id', momentId)
  }

  function addSoloist() {
    // Pick first placed member not yet a soloist
    const solIds = new Set(momentSoloists.map(s => s.member_id))
    const candidate = members.find(m => m.role !== 'director' && placements[m.id] && !solIds.has(m.id))
    if (!candidate) return
    saveSoloists([...momentSoloists, { member_id: candidate.id, mic_number: '' }])
  }

  function removeSoloist(memberId) {
    saveSoloists(momentSoloists.filter(s => s.member_id !== memberId))
  }

  function updateSoloistMic(memberId, mic) {
    saveSoloists(momentSoloists.map(s => s.member_id === memberId ? { ...s, mic_number: mic } : s))
  }

  function setSoloistMic(memberId, mic) {
    // mic = '' removes soloist, otherwise sets/updates mic number
    if (!mic) {
      saveSoloists(momentSoloists.filter(s => s.member_id !== memberId))
    } else {
      const existing = momentSoloists.find(s => s.member_id === memberId)
      if (existing) saveSoloists(momentSoloists.map(s => s.member_id === memberId ? { ...s, mic_number: mic } : s))
      else saveSoloists([...momentSoloists, { member_id: memberId, mic_number: mic }])
    }
  }

  function toggleSoloist(memberId) {
    const existing = momentSoloists.find(s => s.member_id === memberId)
    if (existing) saveSoloists(momentSoloists.filter(s => s.member_id !== memberId))
    else saveSoloists([...momentSoloists, { member_id: memberId, mic_number: '' }])
  }

  function removePlacement(memberId) {
    const next = { ...placementsRef.current }
    delete next[memberId]
    applyPlacements(next)
  }

  function memberAtPixel(px, py) {
    const d = dimsRef.current
    const mems = membersRef.current
    const pl = placementsRef.current
    const m2 = modeRef.current
    let best = null, bestDist = TOKEN_R * 1.8
    for (const m of mems) {
      if (m.role === 'director') continue
      const pos = pl[m.id]; if (!pos) continue
      const { x, y } = getMemberPixelPos(pos, m2, d)
      const dist = Math.hypot(px - x, py - y)
      if (dist < bestDist) { bestDist = dist; best = m }
    }
    return best
  }

  function openContextMenu(e, member) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, member })
  }

  function handleCanvasContextMenu(e) {
    e.preventDefault()
    const { x, y } = eventToCanvas(e, rotatedRef.current, dimsRef.current)
    // Check director
    const d = dimsRef.current
    const dirMember = membersRef.current.find(m => m.role === 'director')
    const dax = currentDirAbsX()
    if (dirMember && dax != null && Math.hypot(x - dax, y - (d.GH + DIRECTOR_H / 2)) < TOKEN_R * 1.8) {
      setContextMenu({ x: e.clientX, y: e.clientY, member: dirMember }); return
    }
    const member = memberAtPixel(x, y)
    if (member) setContextMenu({ x: e.clientX, y: e.clientY, member })
  }

  function handleProfileContextMenu(e) {
    e.preventDefault()
    const canvas = heightCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const { hitAreas = {} } = profileHitRef.current ?? {}
    for (const [id, ha] of Object.entries(hitAreas)) {
      if (px >= ha.px - TOKEN_R && px <= ha.px + TOKEN_R && py >= ha.yTop && py <= ha.yBot) {
        const member = membersRef.current.find(m => m.id === id)
        if (member) { setContextMenu({ x: e.clientX, y: e.clientY, member }); return }
      }
    }
  }

  async function handleDeleteMoment(mId) {
    if (!confirm('Eliminar aquest moment i totes les seves posicions?')) return
    await supabase.from('moments').delete().eq('id', mId)
    const remaining = moments.filter(m => m.id !== mId)
    setMoments(remaining)
    if (mId === momentId && remaining.length) {
      navigate(`/show/${showId}/song/${songId}/moment/${remaining[remaining.length - 1].id}`)
    } else if (!remaining.length) {
      navigate(`/show/${showId}`)
    }
  }

  // ─── Trajectory ──────────────────────────────────────────
  async function enterTrajectoryMode(memberId) {
    if (!memberId) { setTrajectoryMode(false); setTrajectoryMemberId(''); return }
    setTrajectoryMemberId(memberId); setTrajectoryMode(true)
    const allMoments = momentsRef.current
    if (!allMoments.length) return
    const { data } = await supabase.from('positions').select('*')
      .in('moment_id', allMoments.map(m => m.id))
    const byMoment = {}
    for (const m of allMoments) byMoment[m.id] = {}
    for (const pos of (data ?? [])) {
      if (!byMoment[pos.moment_id]) continue
      if (pos.free_x != null && pos.free_y != null)
        byMoment[pos.moment_id][pos.member_id] = { free: true, x: pos.free_x, y: pos.free_y }
      else if (pos.grid_row != null)
        byMoment[pos.moment_id][pos.member_id] = { row: pos.grid_row, col: pos.grid_col }
    }
    setAllSongPositions(byMoment)
  }

  // ─── Add moment ──────────────────────────────────────────
  function openAddMoment() {
    setNewMomentTitle(`Moment ${moments.length + 1}`)
    setCloneFrom(''); setSelectedOtherSongId(''); setSelectedOtherMomentId('')
    setAddingMoment(true); setEditingMoment(false)
  }

  async function handleCloneFromChange(val) {
    setCloneFrom(val)
    if (val === 'other' && otherSongs === null) {
      const { data: songs } = await supabase.from('songs').select('*').eq('show_id', showId).order('order_index')
      const songIds = (songs ?? []).map(s => s.id)
      const { data: moms } = songIds.length
        ? await supabase.from('moments').select('*').in('song_id', songIds).order('order_index')
        : { data: [] }
      const grouped = {}
      for (const m of (moms ?? [])) (grouped[m.song_id] ??= []).push(m)
      setOtherSongs((songs ?? []).filter(s => s.id !== songId))
      setOtherSongMoments(grouped)
    }
  }

  async function createMoment() {
    const title = newMomentTitle.trim(); if (!title) return
    const { data: newMom, error } = await supabase.from('moments')
      .insert({ song_id: songId, title, subtitle: '', order_index: moments.length, grid_mode: mode })
      .select().single()
    if (error || !newMom) return
    let cloneMomentId = null
    if (cloneFrom.startsWith('moment:')) cloneMomentId = cloneFrom.slice(7)
    else if (cloneFrom === 'other' && selectedOtherMomentId) cloneMomentId = selectedOtherMomentId
    if (cloneMomentId) {
      const { data: srcPos } = await supabase.from('positions').select('*').eq('moment_id', cloneMomentId)
      if (srcPos?.length) {
        await supabase.from('positions').insert(srcPos.map(p => ({
          moment_id: newMom.id, member_id: p.member_id,
          grid_row: p.grid_row, grid_col: p.grid_col, free_x: p.free_x, free_y: p.free_y,
        })))
      }
    }
    setMoments(prev => [...prev, newMom])
    setAddingMoment(false)
    navigate(`/show/${showId}/song/${songId}/moment/${newMom.id}`)
  }

  // ─── Shift selection ──────────────────────────────────────
  function shiftSelected(dr, dc) {
    const toMove = selectedIdsRef.current.size > 0
      ? selectedIdsRef.current
      : new Set(Object.keys(placementsRef.current).filter(id => {
          const m = membersRef.current.find(m => m.id === id); return m && m.role !== 'director'
        }))
    const p = placementsRef.current, d = dimsRef.current
    const wouldCollide = [...toMove].some(id => {
      const pos = p[id]; if (!pos || pos.free) return false
      const nr = pos.row + dr, nc = pos.col + dc
      if (nr < 0 || nr >= d.ROWS || nc < 0 || nc >= d.COLS) return true
      return Object.entries(p).some(([oid, op]) => !toMove.has(oid) && !op.free && op.row === nr && op.col === nc)
    })
    if (wouldCollide) return
    const next = { ...p }
    for (const id of toMove) {
      const pos = next[id]; if (!pos || pos.free) continue
      next[id] = { row: Math.max(0, Math.min(d.ROWS - 1, pos.row + dr)), col: Math.max(0, Math.min(d.COLS - 1, pos.col + dc)) }
    }
    applyPlacements(next)
  }
  shiftSelectedRef.current = shiftSelected

  useEffect(() => {
    const MAP = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape' && trajectoryMode) { setTrajectoryMode(false); setTrajectoryMemberId(''); return }
      const dirs = MAP[e.key]; if (!dirs) return
      e.preventDefault(); shiftSelectedRef.current?.(dirs[0], dirs[1])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [trajectoryMode])

  // ─── Grid drag-sort ──────────────────────────────────────
  const rowSensors = useSensors(useSensor(PointerSensor))
  const rowItems = rowLabels.map((label, i) => ({ id: String(i), label, elevation: rowElevations[i] ?? 0 }))
  function handleRowDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIdx = rowItems.findIndex(r => r.id === active.id)
    const newIdx = rowItems.findIndex(r => r.id === over.id)
    reorderRows(arrayMove(rowLabels, oldIdx, newIdx))
  }

  // ─── Hit tests ────────────────────────────────────────────
  function hitTest(x, y) {
    const dirAbsX = currentDirAbsX()
    if (dirAbsX != null && Math.abs(x - dirAbsX) + Math.abs(y - (dimsRef.current.GH + DIRECTOR_H / 2)) < TOKEN_R * 1.3)
      return { type: 'director' }
    for (const [memberId, pos] of Object.entries(placementsRef.current)) {
      const pt = getMemberPixelPos(pos, modeRef.current, dimsRef.current)
      if (pt && Math.hypot(x - pt.x, y - pt.y) < TOKEN_R + 5) return { type: 'member', memberId }
    }
    return null
  }
  function hitTestTrajectory(x, y) {
    for (const m of momentsRef.current) {
      const pos = allSongPositionsRef.current[m.id]?.[trajectoryMemberId]
      if (!pos) continue
      const pt = getMemberPixelPos(pos, modeRef.current, dimsRef.current)
      if (pt && Math.hypot(x - pt.x, y - pt.y) < TOKEN_R + 6) return m.id
    }
    return null
  }

  // ─── Mouse events ─────────────────────────────────────────
  function handleMouseDown(e) {
    if (e.button !== 0) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)
    if (trajectoryMode) {
      const hitMomentId = hitTestTrajectory(x, y)
      if (hitMomentId) navigate(`/show/${showId}/song/${songId}/moment/${hitMomentId}`)
      return
    }
    const hit = hitTest(x, y)
    if (hit?.type === 'director') { dirDragRef.current = { active: true }; return }
    if (hit?.type === 'member') {
      const { memberId } = hit
      if (e.shiftKey) {
        setSelectedIds(prev => { const n = new Set(prev); n.has(memberId) ? n.delete(memberId) : n.add(memberId); return n }); return
      }
      const inSel = selectedIdsRef.current.has(memberId)
      if (inSel && selectedIdsRef.current.size > 1) {
        const origPositions = {}
        for (const id of selectedIdsRef.current) {
          const pos = placementsRef.current[id]
          const pt = pos ? getMemberPixelPos(pos, modeRef.current, dimsRef.current) : null
          if (pt) origPositions[id] = pt
        }
        const anchor = origPositions[memberId]
        if (anchor) dragRef.current = { type: 'group', anchorId: memberId, anchorPixelX: anchor.x, anchorPixelY: anchor.y, members: new Set(selectedIdsRef.current), originalPositions: origPositions, currentX: x, currentY: y }
      } else {
        setSelectedIds(new Set()); selectedIdsRef.current = new Set()
        dragRef.current = { type: 'member', memberId, x, y }
      }
      return
    }
    if (!e.shiftKey) { setSelectedIds(new Set()); selectedIdsRef.current = new Set() }
    dragRef.current = { type: 'select-rect', startX: x, startY: y, currentX: x, currentY: y }
  }

  function handleMouseMove(e) {
    if (trajectoryMode) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)
    if (dirDragRef.current?.active) {
      const relX = Math.max(0, Math.min(dimsRef.current.GW, x - LABEL_W))
      dirManualXRef.current = relX; setDirectorManualX(relX); return
    }
    if (!dragRef.current) {
      // Hit-test for zenith tooltip
      const d = dimsRef.current
      let found = null
      for (const m of membersRef.current) {
        if (m.role === 'director') continue
        const pos = placementsRef.current[m.id]
        if (!pos) continue
        const pt = getMemberPixelPos(pos, modeRef.current, d)
        if (pt && Math.hypot(x - pt.x, y - pt.y) <= TOKEN_R + 3) { found = m; break }
      }
      if (found) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) setHoverZenithInfo({ member: found, x: e.clientX - rect.left, y: e.clientY - rect.top })
      } else {
        setHoverZenithInfo(null)
      }
      return
    }
    const drag = dragRef.current
    if (drag.type === 'member') { drag.x = x; drag.y = y }
    else if (drag.type === 'group') { drag.currentX = x; drag.currentY = y }
    else if (drag.type === 'select-rect') { drag.currentX = x; drag.currentY = y }
    redrawWithDrag(drag)
  }

  function handleMouseUp(e) {
    if (trajectoryMode) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)
    dirDragRef.current = null
    if (!dragRef.current) return
    const drag = dragRef.current; dragRef.current = null
    if (drag.type === 'member') finalizeSingleDrag(drag.memberId, x, y)
    else if (drag.type === 'group') finalizeGroupDrag(drag, x, y)
    else if (drag.type === 'select-rect') finalizeRectSelect(drag)
  }
  function handleMouseLeave(e) { handleMouseUp(e); setHoverZenithInfo(null) }

  // ─── Finalize drags ───────────────────────────────────────
  function finalizeSingleDrag(memberId, x, y) {
    const next = { ...placementsRef.current }, d = dimsRef.current
    if (modeRef.current === 'free') {
      if (y >= 0 && y <= d.GH)
        next[memberId] = { free: true, x: Math.max(0, Math.min(1, (x - LABEL_W) / d.GW)), y: Math.max(0, Math.min(1, y / d.GH)) }
      else delete next[memberId]
    } else {
      const cell = pixelToCell(x, y, modeRef.current, d)
      if (cell) {
        const occ = Object.entries(next).find(([id, p]) => id !== memberId && !p.free && p.row === cell.row && p.col === cell.col)
        if (occ) { const own = next[memberId]; next[occ[0]] = own && !own.free ? { row: own.row, col: own.col } : null; if (!next[occ[0]]) delete next[occ[0]] }
        next[memberId] = { row: cell.row, col: cell.col }
      } else { delete next[memberId] }
    }
    applyPlacements(next)
  }

  function finalizeGroupDrag(drag, x, y) {
    const dx = x - drag.anchorPixelX, dy = y - drag.anchorPixelY, d = dimsRef.current
    if (modeRef.current === 'free') {
      const next = { ...placementsRef.current }
      for (const id of drag.members) {
        const orig = drag.originalPositions[id]; if (!orig) continue
        next[id] = { free: true, x: Math.max(0, Math.min(1, (orig.x + dx - LABEL_W) / d.GW)), y: Math.max(0, Math.min(1, (orig.y + dy) / d.GH)) }
      }
      applyPlacements(next); return
    }
    const anchorNewCell = pixelToCell(drag.anchorPixelX + dx, drag.anchorPixelY + dy, modeRef.current, d)
    const anchorOldPos = placementsRef.current[drag.anchorId]
    if (!anchorNewCell || !anchorOldPos || anchorOldPos.free) { applyPlacements(placementsRef.current); return }
    const dr = anchorNewCell.row - anchorOldPos.row, dc = anchorNewCell.col - anchorOldPos.col
    if (dr === 0 && dc === 0) { applyPlacements(placementsRef.current); return }
    const p = placementsRef.current
    const wouldCollide = [...drag.members].some(id => {
      const pos = p[id]; if (!pos || pos.free) return false
      const nr = pos.row + dr, nc = pos.col + dc
      if (nr < 0 || nr >= d.ROWS || nc < 0 || nc >= d.COLS) return true
      return Object.entries(p).some(([oid, op]) => !drag.members.has(oid) && !op.free && op.row === nr && op.col === nc)
    })
    if (wouldCollide) { applyPlacements(p); return }
    const next = { ...p }
    for (const id of drag.members) {
      const pos = next[id]; if (!pos || pos.free) continue
      next[id] = { row: Math.max(0, Math.min(d.ROWS - 1, pos.row + dr)), col: Math.max(0, Math.min(d.COLS - 1, pos.col + dc)) }
    }
    applyPlacements(next)
  }

  function finalizeRectSelect(drag) {
    const x1 = Math.min(drag.startX, drag.currentX), x2 = Math.max(drag.startX, drag.currentX)
    const y1 = Math.min(drag.startY, drag.currentY), y2 = Math.max(drag.startY, drag.currentY)
    if (x2 - x1 < 5 && y2 - y1 < 5) return
    const newSel = new Set(selectedIdsRef.current)
    for (const [id, pos] of Object.entries(placementsRef.current)) {
      const pt = getMemberPixelPos(pos, modeRef.current, dimsRef.current)
      if (pt && pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2) newSel.add(id)
    }
    setSelectedIds(newSel); selectedIdsRef.current = newSel
  }

  function handleDoubleClick(e) {
    if (trajectoryMode) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)
    const hit = hitTest(x, y)
    if (hit?.type === 'member') {
      const next = { ...placementsRef.current }; delete next[hit.memberId]
      setSelectedIds(prev => { const n = new Set(prev); n.delete(hit.memberId); return n })
      applyPlacements(next)
    }
  }

  function handleDragOver(e) { e.preventDefault() }
  function handleDrop(e) {
    if (trajectoryMode) return
    e.preventDefault()
    const memberId = e.dataTransfer.getData('memberId'); if (!memberId) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)
    const next = { ...placementsRef.current }, d = dimsRef.current
    if (modeRef.current === 'free') {
      if (y >= 0 && y <= d.GH)
        next[memberId] = { free: true, x: Math.max(0, Math.min(1, (x - LABEL_W) / d.GW)), y: Math.max(0, Math.min(1, y / d.GH)) }
    } else {
      const cell = pixelToCell(x, y, modeRef.current, d)
      if (cell) next[memberId] = { row: cell.row, col: cell.col }
    }
    applyPlacements(next)
  }

  // ─── Mode ─────────────────────────────────────────────────
  async function changeMode(newMode) {
    setMode(newMode); modeRef.current = newMode
    await supabase.from('moments').update({ grid_mode: newMode }).eq('id', momentId)
  }

  // ─── Derived ─────────────────────────────────────────────
  const choirMembers = members.filter(m => m.role !== 'director')
  const visibleMembers = choirMembers
  const unplacedCount = visibleMembers.filter(m => !placements[m.id]).length
  const allVoices = [...new Set(choirMembers.map(m => m.voice))]
    .sort((a, b) => {
      const ia = VOICE_ORDER.indexOf(a), ib = VOICE_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })

  const voiceGroups = allVoices.map(v => ({
    voice: v,
    color: VOICE_COLORS[v] ?? VOICE_COLORS.extra,
    members: visibleMembers.filter(m => m.voice === v),
  })).filter(g => g.members.length > 0)

  const MODES = [
    { id: 'square',     Icon: LayoutGrid, label: 'Quadrat'    },
    { id: 'alternate',  Icon: Hexagon,    label: 'Alternat'   },
    { id: 'free',       Icon: Move,       label: 'Lliure'     },
    { id: 'semicircle', Icon: Disc,       label: 'Semicercle' },
  ]

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500'

  // ─── Render ───────────────────────────────────────────────
  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
          <nav className="flex items-center gap-1 text-sm text-gray-500 flex-1 min-w-0 truncate">
            <Link to="/" className="hover:text-gray-300 shrink-0">{show?.name ?? '…'}</Link>
            <span className="mx-0.5 shrink-0">/</span>
            <Link to={`/show/${showId}`} className="hover:text-gray-300 shrink-0 truncate max-w-[120px]">{song?.title ?? '…'}</Link>
            <span className="mx-0.5 shrink-0">/</span>
            <span className="text-gray-300 truncate">{moment?.title ?? '…'}</span>
          </nav>
          <div className="flex items-center gap-1.5 shrink-0">
            {!trajectoryMode && <>
              <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                {[[ArrowUp,-1,0],[ArrowDown,1,0],[ArrowLeft,0,-1],[ArrowRight,0,1]].map(([Icon,dr,dc]) => (
                  <button key={`${dr}${dc}`} onClick={() => shiftSelected(dr, dc)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-r border-gray-700 last:border-0">
                    <Icon size={11} />
                  </button>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                  {selectedIds.size} sel.
                  <button onClick={() => setSelectedIds(new Set())}><X size={10} /></button>
                </span>
              )}
            </>}

            <button onClick={() => { const n = !rotated; setRotated(n); localStorage.setItem('rotated', n) }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${rotated ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              <RotateCcw size={11} />{rotated ? '180°' : '0°'}
            </button>

            {!trajectoryMode && (
              <select value={highlightId}
                onChange={e => { setHighlightId(e.target.value); localStorage.setItem('highlightMemberId', e.target.value) }}
                className="bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 px-2 py-1 focus:outline-none max-w-[120px]">
                <option value="">Jo soc…</option>
                {members.filter(m => m.role === 'director').map(m => <option key={m.id} value={m.id}>{m.name} (dir.)</option>)}
                {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}

            <button onClick={() => trajectoryMode ? enterTrajectoryMode('') : setTrajectoryMode(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${trajectoryMode ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              <Waypoints size={11} /> Trajectòria
            </button>
            {trajectoryMode && (
              <select value={trajectoryMemberId} onChange={e => enterTrajectoryMode(e.target.value)}
                className="bg-gray-800 border border-violet-700 rounded-lg text-xs text-violet-300 px-2 py-1 focus:outline-none max-w-[130px]">
                <option value="">Tria persona…</option>
                {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}

            {!trajectoryMode && mode !== 'semicircle' && (
              <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                <button onClick={() => compactPositions('h')} title="Pinya horitzontal (compactar dins cada fila)"
                  className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 text-xs transition-colors border-r border-gray-700">
                  <AlignCenter size={11} />H
                </button>
                <button onClick={() => compactPositions('hv')} title="Pinya horitzontal + vertical (compactar tot)"
                  className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 text-xs transition-colors">
                  <AlignVerticalJustifyEnd size={11} />H+V
                </button>
              </div>
            )}

            {!trajectoryMode && (
              <div className="relative">
                <button onClick={() => setShowArrange(v => !v)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors ${showArrange ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                  <LayoutTemplate size={11} /> Disposar…
                </button>
                {showArrange && (
                  <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 w-72"
                    onMouseLeave={() => {}}>
                    <div className="flex gap-1 mb-3">
                      {['cols','rows'].map(ax => (
                        <button key={ax} onClick={() => setArrangeAxis(ax)}
                          className={`flex-1 py-1 rounded-lg text-xs border transition-colors ${arrangeAxis === ax ? 'border-violet-600 text-violet-300 bg-violet-900/30' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                          {ax === 'cols' ? '← Columnes (E→D)' : '↑ Files (D→F)'}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {ARRANGEMENT_PATTERNS.map(pat => {
                        const letters = pat.split('')
                        const groupSizes = letters.map(l => (VOICE_GROUPS[l] ?? []).length)
                        const total = groupSizes.reduce((a, b) => a + b, 0)
                        return (
                          <button key={pat}
                            onClick={() => { autoPlaceByArrangement(pat, arrangeAxis, arrangeReplaceAll); setShowArrange(false) }}
                            className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-gray-700 hover:border-violet-600 hover:bg-violet-900/20 transition-colors">
                            <div className="flex w-full h-5 rounded overflow-hidden gap-px">
                              {letters.map((l, i) => {
                                const voices = VOICE_GROUPS[l] ?? []
                                const pct = total > 0 ? groupSizes[i] / total * 100 : 25
                                const sampleVoice = voices[0]
                                const c = sampleVoice ? (VOICE_COLORS[sampleVoice] ?? VOICE_COLORS.extra) : VOICE_COLORS.extra
                                return <div key={i} style={{ width: pct + '%', background: c.bg }} />
                              })}
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono">{pat}</span>
                          </button>
                        )
                      })}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                      <input type="checkbox" checked={arrangeReplaceAll} onChange={e => setArrangeReplaceAll(e.target.checked)}
                        className="accent-violet-500" />
                      Substituir tot (esborra posicions actuals)
                    </label>
                  </div>
                )}
              </div>
            )}

            {directorManualX != null && !trajectoryMode && (
              <button onClick={() => setDirectorManualX(null)}
                className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 border border-yellow-800 px-2 py-1 rounded-lg transition-colors">
                <Target size={11} /> Auto
              </button>
            )}
          </div>
        </div>

        {/* ── Moment bar (top) ── */}
        <div className="border-b border-gray-800 bg-gray-900 px-3 py-1.5 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {moments.map((m, i) => {
              const isCurrent = m.id === momentId
              return (
                <div key={m.id} className={`shrink-0 flex items-center gap-0.5 rounded-full text-xs transition-colors ${isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  <button onClick={() => navigate(`/show/${showId}/song/${songId}/moment/${m.id}`)}
                    className="px-3 py-1 font-medium hover:opacity-90">
                    {i + 1}. {m.title}
                    {m.subtitle && <span className="ml-1 font-normal opacity-70 text-[10px]">{m.subtitle}</span>}
                  </button>
                  {isCurrent && (
                    <button onClick={() => { setEditMomentTitle(m.title); setEditMomentSubtitle(m.subtitle ?? ''); setEditingMoment(v => !v); setAddingMoment(false) }}
                      className="pr-2 pl-0.5 hover:opacity-70" title="Editar moment">
                      <Pencil size={10} />
                    </button>
                  )}
                </div>
              )
            })}
            <button onClick={openAddMoment}
              className="shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
              <Plus size={10} /> Moment
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar */}
          <div className="w-44 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col overflow-y-auto">
            <div className="p-2.5 space-y-3">

              <SidebarSection title="Mode" open={isPanelOpen('mode')} onToggle={() => togglePanel('mode')}>
                <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                  {MODES.map(({ id, Icon, label }) => (
                    <button key={id} onClick={() => changeMode(id)} title={label}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${mode === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
                      <Icon size={12} /><span className="text-[9px] leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </SidebarSection>

              <SidebarSection title="Graella" open={isPanelOpen('grid', false)} onToggle={() => togglePanel('grid', false)}>
                <div className="space-y-0.5">
                  <DndContext sensors={rowSensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
                    <SortableContext items={rowItems.map(r => r.id)} strategy={verticalListSortingStrategy}>
                      {rowItems.map(({ id, label, elevation }, i) => (
                        <SortableRow key={id} id={id} label={label} elevation={elevation}
                          onEdit={val => updateRowLabel(i, val)}
                          onEditElevation={val => updateRowElevation(i, val)}
                          onRemove={() => removeRow(i)} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <button onClick={addRow} className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 transition-colors mt-0.5">
                    <Plus size={9} /> Fila
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-gray-500">Col.</span>
                  <button onClick={() => updateCols(COLS - 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs">−</button>
                  <span className="text-[10px] text-gray-300 w-5 text-center tabular-nums">{COLS}</span>
                  <button onClick={() => updateCols(COLS + 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs">+</button>
                </div>
              </SidebarSection>

              {!trajectoryMode && (
                <SidebarSection title="Persones" open={isPanelOpen('members')} onToggle={() => togglePanel('members')}
                  badge={unplacedCount > 0 ? ` (${unplacedCount})` : ''}>
                  <div className="space-y-1.5">
                    {voiceGroups.map(({ voice, color: c, members: grpMembers }) => {
                      const collapsed = collapsedVoices.has(voice)
                      const unplacedInGroup = grpMembers.filter(m => !placements[m.id]).length
                      return (
                        <div key={voice}>
                          <button
                            onClick={() => setCollapsedVoices(prev => { const n = new Set(prev); n.has(voice) ? n.delete(voice) : n.add(voice); return n })}
                            className="flex items-center gap-1.5 w-full py-0.5 hover:opacity-80 select-none">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c.bg }} />
                            <span className="text-[10px] text-gray-400 font-medium flex-1 text-left">{VOICE_LABELS[voice]}</span>
                            {unplacedInGroup > 0 && <span className="text-[9px] text-gray-600">{unplacedInGroup}</span>}
                            {collapsed ? <ChevronDown size={8} className="text-gray-700" /> : <ChevronUp size={8} className="text-gray-700" />}
                          </button>
                          {!collapsed && grpMembers.map(m => {
                            const placed = !!placements[m.id]
                            return (
                              <div key={m.id} draggable={!placed}
                                onDragStart={e => e.dataTransfer.setData('memberId', m.id)}
                                onContextMenu={e => openContextMenu(e, m)}
                                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs select-none ml-3 ${placed ? 'opacity-40 hover:opacity-100' : 'cursor-grab active:cursor-grabbing hover:bg-gray-800'}`}>
                                <span className="w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 text-[9px]"
                                  style={{ backgroundColor: c.bg, color: c.fg }}>
                                  {(m.initials || m.name.slice(0, 2)).toUpperCase()}
                                </span>
                                <span className="text-gray-300 truncate text-[11px] flex-1">{m.name}</span>
                                {(() => {
                                  const sol = momentSoloists.find(s => s.member_id === m.id)
                                  if (!sol) return null
                                  return (
                                    <select value={sol.mic_number ?? ''}
                                      onChange={e => setSoloistMic(m.id, e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      onMouseDown={e => e.stopPropagation()}
                                      className="bg-amber-900/40 border border-amber-700/60 rounded px-1 text-[9px] text-amber-300 w-8 focus:outline-none shrink-0 cursor-pointer"
                                      title="Micro (solista)">
                                      <option value="">—</option>
                                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{n}</option>)}
                                    </select>
                                  )
                                })()}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </SidebarSection>
              )}

            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-[#0f172a] flex flex-col pr-8">
            <div className="relative w-full">
              <canvas ref={canvasRef}
                style={{ width: '100%', aspectRatio: `${CW} / ${CH}`, transform: rotated ? 'rotate(180deg)' : undefined, display: 'block', cursor: trajectoryMode ? 'pointer' : 'default' }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onContextMenu={handleCanvasContextMenu}
                onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
                onDragOver={handleDragOver} onDrop={handleDrop} />
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
            </div>
            <p className="text-[10px] text-gray-700 text-center select-none py-1">
              {trajectoryMode
                ? 'Clica qualsevol punt per anar a aquell moment · Esc per sortir'
                : 'Arrossega · Shift+clic o quadre per seleccionar · flechas mouen selecció · Doble clic per treure'}
            </p>

            {/* Height profile accordion */}
            <div className="shrink-0 border-t border-gray-800">
              <button
                onClick={() => setShowHeightProfile(v => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors select-none">
                <span className="uppercase tracking-wider font-medium">Perfil d'alçades</span>
                <span className="text-gray-600">{showHeightProfile ? '▲' : '▼'}</span>
              </button>
              {showHeightProfile && (
                <canvas ref={heightCanvasRef}
                  style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
                  onMouseMove={handleProfileMouseMove}
                  onMouseLeave={handleProfileMouseLeave}
                  onContextMenu={handleProfileContextMenu} />
              )}
            </div>
          </div>
        </div>

        {/* ── Edit moment panel ── */}
        {editingMoment && (
          <div className="border-t border-gray-700 bg-gray-900 px-3 py-2 shrink-0">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-0.5">
                <label className="text-[10px] text-gray-500">Títol</label>
                <input value={editMomentTitle} onChange={e => setEditMomentTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMomentMeta(); if (e.key === 'Escape') setEditingMoment(false) }}
                  autoFocus className={inputCls + ' w-36'} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-gray-500">Subtítol / referència</label>
                <input value={editMomentSubtitle} onChange={e => setEditMomentSubtitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveMomentMeta(); if (e.key === 'Escape') setEditingMoment(false) }}
                  placeholder="ex. Entrada, pont…" className={inputCls + ' w-52'} />
              </div>
              <div className="flex gap-1.5 self-end">
                <button onClick={saveMomentMeta}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Guardar</button>
                <button onClick={() => handleDeleteMoment(momentId)}
                  className="bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg transition-colors">Eliminar</button>
                <button onClick={() => setEditingMoment(false)}
                  className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-colors">Cancel·lar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add moment panel ── */}
        {addingMoment && (
          <div className="border-t border-gray-700 bg-gray-900 px-3 py-2 shrink-0">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-0.5">
                <label className="text-[10px] text-gray-500">Títol</label>
                <input value={newMomentTitle} onChange={e => setNewMomentTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createMoment(); if (e.key === 'Escape') setAddingMoment(false) }}
                  autoFocus className={inputCls + ' w-36'} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-gray-500">Font</label>
                <select value={cloneFrom} onChange={e => handleCloneFromChange(e.target.value)}
                  className={inputCls}>
                  <option value="">Des de 0</option>
                  <option value={`moment:${momentId}`}>Clonar actual</option>
                  {moments.filter(m => m.id !== momentId).map(m => (
                    <option key={m.id} value={`moment:${m.id}`}>Clonar: {m.title}</option>
                  ))}
                  <option value="other">D'altra cançó…</option>
                </select>
              </div>
              {cloneFrom === 'other' && otherSongs !== null && (
                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500">Cançó</label>
                  <select value={selectedOtherSongId}
                    onChange={e => { setSelectedOtherSongId(e.target.value); setSelectedOtherMomentId('') }}
                    className={inputCls}>
                    <option value="">Tria…</option>
                    {otherSongs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              )}
              {cloneFrom === 'other' && selectedOtherSongId && (
                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500">Moment</label>
                  <select value={selectedOtherMomentId} onChange={e => setSelectedOtherMomentId(e.target.value)}
                    className={inputCls}>
                    <option value="">Tria…</option>
                    {(otherSongMoments[selectedOtherSongId] ?? []).map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              )}
              {cloneFrom === 'other' && otherSongs === null && (
                <span className="text-xs text-gray-500 self-end pb-1">Carregant…</span>
              )}
              <div className="flex gap-1.5 self-end">
                <button onClick={createMoment}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Crear</button>
                <button onClick={() => setAddingMoment(false)}
                  className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-colors">Cancel·lar</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Context menu backdrop + panel ── */}
      {contextMenu && (
        <>
          {/* Invisible backdrop — closes the menu on any click outside */}
          <div className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={e => { e.preventDefault(); setContextMenu(null) }} />

          {/* Menu panel */}
          <div className="fixed z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-1.5 min-w-[190px]"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 210), top: Math.min(contextMenu.y, window.innerHeight - 270) }}
            onContextMenu={e => e.preventDefault()}>

            {/* Member header */}
            {(() => {
              const m = contextMenu.member
              const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
              const isMe = highlightId === m.id
              const isSoloist = !!momentSoloists.find(s => s.member_id === m.id)
              const soloistEntry = momentSoloists.find(s => s.member_id === m.id)
              const isPlaced = !!placements[m.id]
              const itemCls = 'w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-800 transition-colors text-left'
              return (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-800 mb-1">
                    <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: c.bg }} />
                    <span className="text-xs text-white font-medium truncate">{m.name}</span>
                  </div>

                  {/* Soc jo */}
                  <button className={itemCls + (isMe ? ' text-blue-400' : ' text-gray-300')}
                    onClick={() => { const v = isMe ? '' : m.id; setHighlightId(v); localStorage.setItem('highlightMemberId', v); setContextMenu(null) }}>
                    <Target size={11} /> {isMe ? '✓ Soc jo' : 'Soc jo'}
                  </button>

                  {/* Solista */}
                  <button className={itemCls + (isSoloist ? ' text-amber-400' : ' text-gray-300')}
                    onClick={() => toggleSoloist(m.id)}>
                    <Mic size={11} /> {isSoloist ? '✓ Solista' : 'Marcar com solista'}
                  </button>

                  {/* Mic select — only when soloist */}
                  {isSoloist && (
                    <div className="flex items-center gap-2 px-3 py-1 text-xs text-gray-400">
                      <span className="w-2.5" />
                      <span>Micro:</span>
                      <select value={soloistEntry?.mic_number ?? ''}
                        onChange={e => updateSoloistMic(m.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded px-1 text-xs text-white flex-1 focus:outline-none focus:border-amber-500">
                        <option value="">—</option>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{n}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Trajectòria */}
                  {m.role !== 'director' && (
                    <button className={itemCls + ' text-gray-300'}
                      onClick={() => { enterTrajectoryMode(m.id); setContextMenu(null) }}>
                      <Waypoints size={11} /> Trajectòria
                    </button>
                  )}

                  {/* Eliminar posició */}
                  {isPlaced && <>
                    <div className="border-t border-gray-800 my-1" />
                    <button className={itemCls + ' text-red-400'}
                      onClick={() => { removePlacement(m.id); setContextMenu(null) }}>
                      <X size={11} /> Eliminar posició
                    </button>
                  </>}
                </>
              )
            })()}
          </div>
        </>
      )}
    </Layout>
  )
}
