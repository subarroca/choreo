import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, Hexagon, Move } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, VOICE_SHORT } from '../lib/constants'
import Layout from '../components/Layout'

// ─── Static constants ─────────────────────────────────────────
const CELL = 44
const LABEL_W = 72
const DIRECTOR_H = 60
const TOKEN_R = Math.floor(CELL * 0.38)
const DEFAULT_ROW_LABELS = ['Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra']
const DEFAULT_COLS = 14

// ─── Rounded hexagon path ─────────────────────────────────────
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

// ─── Geometry helpers (all take dims) ────────────────────────
function tokenXY(row, col, mode) {
  const shift = mode === 'alternate' && row % 2 === 1 ? CELL / 2 : 0
  return { x: LABEL_W + col * CELL + CELL / 2 + shift, y: row * CELL + CELL / 2 }
}

function pixelToCell(px, py, mode, dims) {
  const { ROWS, COLS } = dims
  const row = Math.floor(py / CELL)
  if (row < 0 || row >= ROWS) return null
  const shift = mode === 'alternate' && row % 2 === 1 ? CELL / 2 : 0
  const col = Math.floor((px - LABEL_W - shift) / CELL)
  if (col < 0 || col >= COLS) return null
  return { row, col }
}

function computeRelCenterX(placements, members, mode, dims) {
  const { ROWS, GW } = dims
  const placed = members.filter(m => m.role !== 'director' && placements[m.id])
  if (!placed.length) return null
  const byRow = {}
  for (const m of placed) {
    const pos = placements[m.id]
    const row = pos.free ? Math.min(ROWS - 1, Math.floor(pos.y * ROWS)) : pos.row
    ;(byRow[row] ??= []).push(m)
  }
  const longest = Object.values(byRow).reduce((best, arr) => arr.length > best.length ? arr : best, [])
  if (!longest.length) return null
  const sum = longest.reduce((s, m) => {
    const pos = placements[m.id]
    if (pos.free) return s + pos.x * GW
    const { x } = tokenXY(pos.row, pos.col, mode)
    return s + (x - LABEL_W)
  }, 0)
  return sum / longest.length
}

function eventToCanvas(e, rotated, dims) {
  const { CW, CH } = dims
  const rect = e.currentTarget.getBoundingClientRect()
  let px = (e.clientX - rect.left) * (CW / rect.width)
  let py = (e.clientY - rect.top) * (CH / rect.height)
  if (rotated) { px = CW - px; py = CH - py }
  return { x: px, y: py }
}

function getMemberPixelPos(pos, mode, dims) {
  if (!pos) return null
  if (pos.free) return { x: LABEL_W + pos.x * dims.GW, y: pos.y * dims.GH }
  return tokenXY(pos.row, pos.col, mode)
}

function fillTextFlipped(ctx, text, x, y, rotated) {
  if (rotated) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI); ctx.fillText(text, 0, 0); ctx.restore()
  } else {
    ctx.fillText(text, x, y)
  }
}

// ─── Arrow drawing ────────────────────────────────────────────
function drawArrow(ctx, x1, y1, x2, y2, color) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
  if (len < TOKEN_R * 3) return
  const nx = dx / len, ny = dy / len
  const gap = TOKEN_R + 4
  const sx = x1 + nx * gap, sy = y1 + ny * gap
  const ex = x2 - nx * gap, ey = y2 - ny * gap
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3])
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([])
  const a = Math.atan2(ey - sy, ex - sx), hl = 7, ha = Math.PI / 5
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(ex, ey)
  ctx.lineTo(ex - hl * Math.cos(a - ha), ey - hl * Math.sin(a - ha))
  ctx.lineTo(ex - hl * Math.cos(a + ha), ey - hl * Math.sin(a + ha))
  ctx.closePath(); ctx.fill()
}

// ─── Main canvas draw ─────────────────────────────────────────
function drawAll(canvas, { placements, members, mode, highlightId, directorAbsX,
  drag, selectedIds, rotated, dims, trajectoryConfig }) {
  if (!canvas) return
  const { ROWS, COLS, rowLabels, GW, GH, CW, CH } = dims
  const dpr = window.devicePixelRatio || 1
  canvas.width = CW * dpr; canvas.height = CH * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const hasHighlight = !!highlightId

  // Background
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, CW, CH)

  if (mode === 'free') {
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

  // Row labels
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  for (let r = 0; r < ROWS; r++)
    fillTextFlipped(ctx, rowLabels[r] ?? `Fila ${r + 1}`, LABEL_W - 6, r * CELL + CELL / 2, rotated)

  // Center-of-mass line (not in free mode — director is fixed)
  if (mode !== 'free') {
    const relCX = computeRelCenterX(placements, members, mode, dims)
    if (relCX != null) {
      const absX = LABEL_W + relCX
      ctx.strokeStyle = '#fbbf2466'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(absX, 0); ctx.lineTo(absX, GH); ctx.stroke(); ctx.setLineDash([])
    }
  }

  // Director zone
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, GH); ctx.lineTo(CW, GH); ctx.stroke()
  ctx.fillStyle = '#475569'; ctx.font = '9px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  fillTextFlipped(ctx, 'DIR', LABEL_W - 6, GH + DIRECTOR_H / 2, rotated)

  // Trajectory overlay (draws on top of grid, replaces token rendering)
  if (trajectoryConfig) {
    drawTrajectoryOverlay(ctx, trajectoryConfig, mode, dims, members)
    if (directorAbsX != null) drawDirectorDiamond(ctx, directorAbsX, GH + DIRECTOR_H / 2)
    return
  }

  // Skip tokens being dragged
  const skipIds = new Set()
  if (drag?.type === 'member') skipIds.add(drag.memberId)
  if (drag?.type === 'group') drag.members.forEach(id => skipIds.add(id))

  for (const m of members) {
    if (m.role === 'director') continue
    const pos = placements[m.id]
    if (!pos || skipIds.has(m.id)) continue
    const { x, y } = getMemberPixelPos(pos, mode, dims)
    drawToken(ctx, x, y, m, highlightId === m.id, selectedIds?.has(m.id) ?? false, hasHighlight)
  }

  if (drag?.type === 'group' && drag.originalPositions) {
    const dx = drag.currentX - drag.anchorPixelX, dy = drag.currentY - drag.anchorPixelY
    ctx.globalAlpha = 0.6
    for (const id of drag.members) {
      const orig = drag.originalPositions[id], m = members.find(m => m.id === id)
      if (orig && m) drawToken(ctx, orig.x + dx, orig.y + dy, m, false, false, false)
    }
    ctx.globalAlpha = 1
  }

  if (drag?.type === 'member') {
    const m = members.find(m => m.id === drag.memberId)
    if (m) {
      ctx.globalAlpha = 0.6; drawToken(ctx, drag.x, drag.y, m, false, false, false); ctx.globalAlpha = 1
      if (mode !== 'free') {
        const cell = pixelToCell(drag.x, drag.y, mode, dims)
        if (cell) {
          const { x, y } = tokenXY(cell.row, cell.col, mode)
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

  if (directorAbsX != null) drawDirectorDiamond(ctx, directorAbsX, GH + DIRECTOR_H / 2)
}

function drawToken(ctx, x, y, member, highlighted, selected, hasHighlight) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const initials = (member.initials || member.name.slice(0, 2)).toUpperCase()

  if (selected) {
    roundedHexPath(ctx, x, y, TOKEN_R + 5)
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.stroke()
  }

  if (hasHighlight && !highlighted) {
    roundedHexPath(ctx, x, y, TOKEN_R)
    ctx.strokeStyle = c.bg + 'aa'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = c.bg + '88'; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials, x, y)
  } else if (highlighted) {
    ctx.save(); ctx.shadowColor = c.bg; ctx.shadowBlur = 14
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.fillStyle = c.bg; ctx.fill(); ctx.restore()
    ctx.fillStyle = c.fg; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials, x, y)
  } else {
    roundedHexPath(ctx, x, y, TOKEN_R); ctx.fillStyle = c.bg; ctx.fill()
    ctx.fillStyle = c.fg; ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials, x, y)
  }
}

function drawDirectorDiamond(ctx, x, y) {
  const s = TOKEN_R * 1.1
  ctx.beginPath()
  ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y)
  ctx.closePath()
  ctx.fillStyle = VOICE_COLORS.director.bg; ctx.fill()
  ctx.fillStyle = VOICE_COLORS.director.fg
  ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('DIR', x, y)
}

function drawTrajectoryOverlay(ctx, { allMoments, allPositions, memberId, currentMomentId }, mode, dims, members) {
  const member = members.find(m => m.id === memberId)
  if (!member) return
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra

  // Collect trajectory points in moment order
  const traj = []
  for (const m of allMoments) {
    const pos = allPositions[m.id]?.[memberId]
    if (pos) {
      const pt = getMemberPixelPos(pos, mode, dims)
      if (pt) traj.push({ momentId: m.id, momentTitle: m.title, pt, n: traj.length + 1 })
    }
  }

  // Draw ghost distribution for current moment
  ctx.globalAlpha = 0.2
  const currentPlacements = allPositions[currentMomentId] ?? {}
  for (const [mId, pos] of Object.entries(currentPlacements)) {
    if (mId === memberId) continue
    const m = members.find(m => m.id === mId)
    if (!m || m.role === 'director') continue
    const pt = getMemberPixelPos(pos, mode, dims)
    if (pt) drawToken(ctx, pt.x, pt.y, m, false, false, false)
  }
  ctx.globalAlpha = 1

  // Draw arrows
  for (let i = 0; i < traj.length - 1; i++)
    drawArrow(ctx, traj[i].pt.x, traj[i].pt.y, traj[i + 1].pt.x, traj[i + 1].pt.y, c.bg + 'cc')

  // Draw numbered dots
  for (const { pt, n, momentId } of traj) {
    const isCurrent = momentId === currentMomentId
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, TOKEN_R + (isCurrent ? 3 : 0), 0, Math.PI * 2)
    ctx.fillStyle = isCurrent ? c.bg : c.bg + 'bb'
    ctx.fill()
    if (isCurrent) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke() }
    ctx.fillStyle = c.fg; ctx.font = `bold ${TOKEN_R > 14 ? 11 : 9}px system-ui`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(String(n), pt.x, pt.y)
  }
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
  const [hiddenVoices, setHiddenVoices] = useState(new Set())
  const [highlightId, setHighlightId] = useState(() => localStorage.getItem('highlightMemberId') || '')
  const [directorManualX, setDirectorManualX] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Trajectory mode
  const [trajectoryMode, setTrajectoryMode] = useState(false)
  const [trajectoryMemberId, setTrajectoryMemberId] = useState('')
  const [allSongPositions, setAllSongPositions] = useState({}) // { [momentId]: { [memberId]: pos } }

  const canvasRef = useRef(null)
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
  const shiftSelectedRef = useRef(null)
  const gridSaveTimerRef = useRef(null)
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

  // ─── Derived dims (dynamic from show config) ──────────────
  const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const GW = COLS * CELL
  const GH = ROWS * CELL
  const CW = LABEL_W + GW
  const CH = GH + DIRECTOR_H
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW, CH }
  dimsRef.current = dims

  // ─── Load ─────────────────────────────────────────────────
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
      setMoments(momentsRes.data ?? [])
      const excludedIds = new Set((exclusionsRes.data ?? []).map(e => e.member_id))
      const mems = (membersRes.data ?? []).filter(m => !excludedIds.has(m.id))
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

  // ─── Director X ───────────────────────────────────────────
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

  // ─── Draw ─────────────────────────────────────────────────
  useEffect(() => {
    const tConfig = trajectoryMode && trajectoryMemberId
      ? { allMoments: moments, allPositions: allSongPositions, memberId: trajectoryMemberId, currentMomentId: momentId }
      : null
    drawAll(canvasRef.current, { placements, members, mode, highlightId, directorAbsX,
      drag: null, selectedIds, rotated, dims,
      trajectoryConfig: tConfig })
  }, [placements, members, mode, highlightId, directorAbsX, selectedIds, rotated, dims,
    trajectoryMode, trajectoryMemberId, allSongPositions, momentId, moments])

  function redrawWithDrag(drag) {
    drawAll(canvasRef.current, {
      placements: placementsRef.current, members: membersRef.current, mode: modeRef.current,
      highlightId: highlightRef.current, directorAbsX: currentDirAbsX(),
      drag, selectedIds: selectedIdsRef.current, rotated: rotatedRef.current,
      dims: dimsRef.current, trajectoryConfig: null,
    })
  }

  // ─── Save positions ────────────────────────────────────────
  function scheduleSave(p) {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => savePositions(p), 800)
  }

  async function savePositions(p) {
    const rows = Object.entries(p).map(([memberId, pos]) => ({
      moment_id: momentId, member_id: memberId,
      grid_row: pos.free ? null : pos.row, grid_col: pos.free ? null : pos.col,
      free_x: pos.free ? pos.x : null, free_y: pos.free ? pos.y : null,
    }))
    await supabase.from('positions').delete().eq('moment_id', momentId)
    if (rows.length) await supabase.from('positions').insert(rows)
  }

  function applyPlacements(next) {
    placementsRef.current = next; setPlacements(next); scheduleSave(next)
  }

  // ─── Grid config ──────────────────────────────────────────
  function scheduleGridSave(gridRows, gridCols) {
    clearTimeout(gridSaveTimerRef.current)
    gridSaveTimerRef.current = setTimeout(() => {
      supabase.from('shows').update({ grid_rows: gridRows, grid_cols: gridCols }).eq('id', showId)
    }, 600)
  }

  function addRow() {
    const newLabels = [...rowLabels, `Fila ${ROWS + 1}`]
    setShow(prev => ({ ...prev, grid_rows: newLabels }))
    scheduleGridSave(newLabels, COLS)
  }

  function removeRow(i) {
    if (ROWS <= 1) return
    const newLabels = rowLabels.filter((_, idx) => idx !== i)
    setShow(prev => ({ ...prev, grid_rows: newLabels }))
    scheduleGridSave(newLabels, COLS)
  }

  function updateRowLabel(i, val) {
    const newLabels = rowLabels.map((l, idx) => idx === i ? val : l)
    setShow(prev => ({ ...prev, grid_rows: newLabels }))
    scheduleGridSave(newLabels, COLS)
  }

  function updateCols(n) {
    const newCols = Math.max(4, Math.min(30, n))
    setShow(prev => ({ ...prev, grid_cols: newCols }))
    scheduleGridSave(rowLabels, newCols)
  }

  // ─── Trajectory mode ──────────────────────────────────────
  async function enterTrajectoryMode(memberId) {
    if (!memberId) { setTrajectoryMode(false); setTrajectoryMemberId(''); return }
    setTrajectoryMemberId(memberId)
    setTrajectoryMode(true)
    // Load all positions for all moments in this song
    const allMoments = momentsRef.current
    if (!allMoments.length) return
    const { data } = await supabase.from('positions').select('*').in('moment_id', allMoments.map(m => m.id))
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

  // ─── Shift selected ───────────────────────────────────────
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

  // ─── Hit test ─────────────────────────────────────────────
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
        setSelectedIds(prev => { const n = new Set(prev); n.has(memberId) ? n.delete(memberId) : n.add(memberId); return n })
        return
      }
      const inSelection = selectedIdsRef.current.has(memberId)
      if (inSelection && selectedIdsRef.current.size > 1) {
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
    if (!dragRef.current) return
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
  function handleMouseLeave(e) { handleMouseUp(e) }

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
        const occupant = Object.entries(next).find(([id, p]) => id !== memberId && !p.free && p.row === cell.row && p.col === cell.col)
        if (occupant) {
          const own = next[memberId]
          next[occupant[0]] = own && !own.free ? { row: own.row, col: own.col } : null
          if (!next[occupant[0]]) delete next[occupant[0]]
        }
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
    const newSelected = new Set(selectedIdsRef.current)
    for (const [id, pos] of Object.entries(placementsRef.current)) {
      const pt = getMemberPixelPos(pos, modeRef.current, dimsRef.current)
      if (pt && pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2) newSelected.add(id)
    }
    setSelectedIds(newSelected); selectedIdsRef.current = newSelected
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

  // ─── Toolbar actions ──────────────────────────────────────
  async function changeMode(newMode) {
    setMode(newMode); modeRef.current = newMode
    await supabase.from('moments').update({ grid_mode: newMode }).eq('id', momentId)
  }

  async function addMoment() {
    const title = prompt('Nom del nou moment:'); if (!title?.trim()) return
    const { data } = await supabase.from('moments')
      .insert({ song_id: songId, title: title.trim(), order_index: moments.length, grid_mode: mode })
      .select().single()
    if (!data) return
    const rows = Object.entries(placements).map(([memberId, pos]) => ({
      moment_id: data.id, member_id: memberId,
      grid_row: pos.free ? null : pos.row, grid_col: pos.free ? null : pos.col,
      free_x: pos.free ? pos.x : null, free_y: pos.free ? pos.y : null,
    }))
    if (rows.length) await supabase.from('positions').insert(rows)
    setMoments(prev => [...prev, data])
    navigate(`/show/${showId}/song/${songId}/moment/${data.id}`)
  }

  // ─── Derived ──────────────────────────────────────────────
  const choirMembers = members.filter(m => m.role !== 'director')
  const allVoices = [...new Set(choirMembers.map(m => m.voice))]
  const visibleMembers = choirMembers.filter(m => !hiddenVoices.has(m.voice))

  const MODES = [
    { id: 'square',    Icon: LayoutGrid, label: 'Quadrat'  },
    { id: 'alternate', Icon: Hexagon,    label: 'Alternat' },
    { id: 'free',      Icon: Move,       label: 'Lliure'   },
  ]

  // ─── Render ───────────────────────────────────────────────
  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
          <nav className="flex items-center gap-1 text-sm text-gray-500 flex-1 min-w-0 truncate">
            <Link to="/" className="hover:text-gray-300 shrink-0">{show?.name ?? '…'}</Link>
            <span className="mx-0.5 shrink-0">›</span>
            <Link to={`/show/${showId}`} className="hover:text-gray-300 shrink-0 truncate max-w-[120px]">{song?.title ?? '…'}</Link>
            <span className="mx-0.5 shrink-0">›</span>
            <span className="text-gray-300 truncate">{moment?.title ?? '…'}</span>
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            {!trajectoryMode && <>
              <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                {[['↑',-1,0],['↓',1,0],['←',0,-1],['→',0,1]].map(([a,dr,dc]) => (
                  <button key={a} onClick={() => shiftSelected(dr, dc)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 text-xs transition-colors border-r border-gray-700 last:border-0">
                    {a}
                  </button>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <span className="flex items-center gap-1 text-xs text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                  {selectedIds.size} sel.
                  <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-white leading-none">×</button>
                </span>
              )}
            </>}

            <button onClick={() => { const n = !rotated; setRotated(n); localStorage.setItem('rotated', n) }}
              className={`px-2 py-1 rounded-lg text-xs border transition-colors ${rotated ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              ↺ {rotated ? '180°' : '0°'}
            </button>

            {!trajectoryMode && (
              <select value={highlightId}
                onChange={e => { setHighlightId(e.target.value); localStorage.setItem('highlightMemberId', e.target.value) }}
                className="bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 px-2 py-1 focus:outline-none max-w-[120px]">
                <option value="">Jo soc…</option>
                {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}

            {/* Trajectory toggle */}
            <button
              onClick={() => trajectoryMode ? enterTrajectoryMode('') : setTrajectoryMode(true)}
              className={`px-2 py-1 rounded-lg text-xs border transition-colors ${trajectoryMode ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              ↝ Trajectòria
            </button>

            {trajectoryMode && (
              <select value={trajectoryMemberId} onChange={e => enterTrajectoryMode(e.target.value)}
                className="bg-gray-800 border border-violet-700 rounded-lg text-xs text-violet-300 px-2 py-1 focus:outline-none max-w-[130px]">
                <option value="">Tria persona…</option>
                {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}

            {directorManualX != null && !trajectoryMode && (
              <button onClick={() => setDirectorManualX(null)}
                className="text-xs text-yellow-500 hover:text-yellow-400 border border-yellow-800 px-2 py-1 rounded-lg transition-colors">
                ⬦ Auto
              </button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar */}
          <div className="w-40 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col overflow-y-auto">
            <div className="p-2.5 space-y-3">

              {/* Mode toggle */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Mode</p>
                <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                  {MODES.map(({ id, Icon, label }) => (
                    <button key={id} onClick={() => changeMode(id)} title={label}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${mode === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
                      <Icon size={12} /><span className="text-[9px] leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice filter */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Cordes</p>
                <div className="flex flex-wrap gap-1">
                  {allVoices.map(v => {
                    const c = VOICE_COLORS[v]
                    return (
                      <button key={v}
                        onClick={() => setHiddenVoices(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })}
                        className="h-6 px-1.5 rounded flex items-center justify-center text-[10px] font-bold transition-opacity"
                        style={{ backgroundColor: c.bg, color: c.fg, opacity: hiddenVoices.has(v) ? 0.2 : 1 }}
                        title={VOICE_LABELS[v]}>{VOICE_SHORT[v] ?? v[0].toUpperCase()}</button>
                    )
                  })}
                </div>
              </div>

              {/* Grid config */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Graella</p>
                <div className="space-y-0.5">
                  {rowLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input value={label} onChange={e => updateRowLabel(i, e.target.value)}
                        className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-blue-500" />
                      <button onClick={() => removeRow(i)} className="text-gray-600 hover:text-red-500 text-xs shrink-0">×</button>
                    </div>
                  ))}
                  <button onClick={addRow} className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors">+ Fila</button>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-500">Col.</span>
                  <button onClick={() => updateCols(COLS - 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs leading-none">−</button>
                  <span className="text-[10px] text-gray-300 w-5 text-center tabular-nums">{COLS}</span>
                  <button onClick={() => updateCols(COLS + 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs leading-none">+</button>
                </div>
              </div>

              {/* Unplaced members (hidden in trajectory mode) */}
              {!trajectoryMode && (
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                    No col·locats ({visibleMembers.filter(m => !placements[m.id]).length})
                  </p>
                  <div className="space-y-0.5">
                    {visibleMembers.map(m => {
                      const placed = !!placements[m.id]
                      const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                      return (
                        <div key={m.id} draggable={!placed} onDragStart={e => e.dataTransfer.setData('memberId', m.id)}
                          className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-xs select-none transition-opacity ${placed ? 'opacity-20' : 'cursor-grab active:cursor-grabbing hover:bg-gray-800'}`}>
                          <span className="w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 text-[9px]"
                            style={{ backgroundColor: c.bg, color: c.fg }}>
                            {(m.initials || m.name.slice(0, 2)).toUpperCase()}
                          </span>
                          <span className="text-gray-300 truncate text-[11px]">{m.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-950 flex flex-col">
            <canvas ref={canvasRef}
              style={{ width: '100%', aspectRatio: `${CW} / ${CH}`, transform: rotated ? 'rotate(180deg)' : undefined, display: 'block', cursor: trajectoryMode ? 'pointer' : 'default' }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
              onDoubleClick={handleDoubleClick}
              onDragOver={handleDragOver} onDrop={handleDrop} />
            <p className="text-[10px] text-gray-700 text-center select-none py-1">
              {trajectoryMode
                ? 'Clica qualsevol punt de la trajectòria per anar a aquell moment · Esc per sortir'
                : 'Arrossega · Shift+clic o quadre per seleccionar · ↑↓←→ mouen selecció · Doble clic per treure'}
            </p>
          </div>
        </div>

        {/* ── Moment bar ── */}
        <div className="border-t border-gray-800 bg-gray-900 px-3 py-1.5 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {moments.map((m, i) => (
              <button key={m.id}
                onClick={() => navigate(`/show/${showId}/song/${songId}/moment/${m.id}`)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${m.id === momentId ? 'bg-blue-600 text-white font-medium' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                {i + 1}. {m.title}
              </button>
            ))}
            <button onClick={addMoment}
              className="shrink-0 px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700 transition-colors">
              + Moment
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
