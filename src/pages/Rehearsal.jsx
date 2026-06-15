import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, List, Crosshair, RotateCcw, BookOpen, ZoomIn, ZoomOut, Play, Pause } from '../lib/icons'
import { supabase } from '../lib/supabase'
import {
  CELL, LABEL_W, DIRECTOR_H, TOKEN_R, DEFAULT_ROW_LABELS, DEFAULT_COLS,
  VOICE_ORDER, getMemberPixelPos, drawAll,
} from '../lib/editorCanvas'
import { computeGuide } from '../lib/rehearsalGuide'
import RehearsalFocusPicker from '../components/rehearsal/RehearsalFocusPicker'
import RehearsalGuideSheet from '../components/rehearsal/RehearsalGuideSheet'
import RehearsalNavMenu from '../components/rehearsal/RehearsalNavMenu'
import ShowToolbar from '../components/ShowToolbar'

const LONG_PRESS_MS = 550
const ZOOM_MIN = 0.5, ZOOM_MAX = 3.0
const RUN_SPEEDS = [3, 5, 8, 12]

export default function Rehearsal() {
  const { id: showId } = useParams()
  const canvasRef = useRef(null)
  const canvasWrapRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const lastPinchDistRef = useRef(null)
  const swipeStartRef = useRef(null)
  const runTimerRef = useRef(null)

  const [show, setShow] = useState(null)
  const [members, setMembers] = useState([])
  const [steps, setSteps] = useState([])
  const [positionsByMoment, setPositionsByMoment] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusOpen, setFocusOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [highlightId, setHighlightId] = useState(() => localStorage.getItem('rehearsalHighlight') || '')
  const [rotated, setRotated] = useState(() => localStorage.getItem('rotated') === 'true')
  const [zoom, setZoom] = useState(1.0)
  const [pressIndicator, setPressIndicator] = useState(null)
  const [running, setRunning] = useState(false)
  const [runSpeed, setRunSpeed] = useState(5)

  useEffect(() => {
    async function load() {
      const [showRes, songsRes, membersRes, exclusionsRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
      ])
      const showData = showRes.data
      setShow(showData)
      const excludedIds = new Set((exclusionsRes.data ?? []).map(e => e.member_id))
      const mems = (membersRes.data ?? []).filter(m => m.active !== false && !excludedIds.has(m.id))
      setMembers(mems)

      const songList = (songsRes.data ?? []).filter(s => !s.type || s.type === 'song')
      if (!songList.length) { setLoading(false); return }

      const { data: moms } = await supabase.from('moments').select('*')
        .in('song_id', songList.map(s => s.id)).order('order_index')

      const stepList = []
      for (const song of songList)
        for (const moment of (moms ?? []).filter(m => m.song_id === song.id))
          stepList.push({ song, moment })
      setSteps(stepList)

      if (stepList.length) {
        const momentIds = stepList.map(s => s.moment.id)
        const { data: positions } = await supabase.from('positions').select('*').in('moment_id', momentIds)
        const byMoment = {}
        for (const pos of (positions ?? [])) {
          if (!byMoment[pos.moment_id]) byMoment[pos.moment_id] = {}
          if (pos.free_x != null && pos.free_y != null)
            byMoment[pos.moment_id][pos.member_id] = { free: true, x: pos.free_x, y: pos.free_y }
          else if (pos.grid_row != null)
            byMoment[pos.moment_id][pos.member_id] = { row: pos.grid_row, col: pos.grid_col }
        }
        setPositionsByMoment(byMoment)
      }
      setLoading(false)
    }
    load()
  }, [showId])

  const current = steps[currentIdx] ?? null
  const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
  const rowElevations = show?.row_elevations ?? rowLabels.map((_, i, a) => (a.length - 1 - i) * 40)
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const GW = COLS * CELL, GH = ROWS * CELL
  const CW = LABEL_W + GW, CH = GH + DIRECTOR_H
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW, CH, rowElevations }

  const currentRef = useRef(current)
  const membersRef = useRef(members)
  const positionsByMomentRef = useRef(positionsByMoment)
  const rotatedRef = useRef(rotated)
  const highlightIdRef = useRef(highlightId)
  const dimsRef = useRef(dims)
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { positionsByMomentRef.current = positionsByMoment }, [positionsByMoment])
  useEffect(() => { rotatedRef.current = rotated }, [rotated])
  useEffect(() => { highlightIdRef.current = highlightId }, [highlightId])
  useEffect(() => { dimsRef.current = dims }, [dims])

  useEffect(() => {
    if (!canvasRef.current || !current || !show) return
    const placements = positionsByMoment[current.moment.id] ?? {}
    const prevPlacements = currentIdx > 0
      ? (positionsByMoment[steps[currentIdx - 1]?.moment.id] ?? {})
      : {}
    const changedIds = new Set(
      members
        .filter(m => m.role !== 'director')
        .filter(m => {
          const cur = placements[m.id]
          const prev = prevPlacements[m.id]
          if (!cur || !prev) return false
          if (cur.free) return cur.x !== prev.x || cur.y !== prev.y
          return cur.row !== prev.row || cur.col !== prev.col
        })
        .map(m => m.id)
    )
    const mode = current.moment.grid_mode ?? 'alternate'
    const directorMember = members.find(m => m.role === 'director') ?? null
    drawAll(canvasRef.current, {
      placements, members, mode, highlightId,
      directorAbsX: LABEL_W + GW / 2, directorMember, drag: null,
      selectedIds: new Set(), rotated, dims,
      trajectoryConfig: null, soloistMicMap: {},
      transparent: true, changedIds,
    })
  }, [positionsByMoment, members, current, show, dims, highlightId, rotated, currentIdx])

  const prev = useCallback(() => { if (currentIdx > 0) setCurrentIdx(i => i - 1) }, [currentIdx])
  const next = useCallback(() => { if (currentIdx < steps.length - 1) setCurrentIdx(i => i + 1) }, [currentIdx, steps.length])

  // ── Auto run-through ──────────────────────────────────────────
  useEffect(() => {
    if (!running) { clearInterval(runTimerRef.current); return }
    runTimerRef.current = setInterval(() => {
      setCurrentIdx(i => {
        if (i >= steps.length - 1) { setRunning(false); return i }
        return i + 1
      })
    }, runSpeed * 1000)
    return () => clearInterval(runTimerRef.current)
  }, [running, runSpeed, steps.length])

  useEffect(() => {
    function onKey(e) {
      if (focusOpen || menuOpen || guideOpen) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next() }
      if (e.key === ' ') { e.preventDefault(); setRunning(v => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIdx, steps.length, focusOpen, menuOpen, guideOpen, prev, next])

  function setHighlight(id) {
    setHighlightId(id)
    if (id) localStorage.setItem('rehearsalHighlight', id)
    else localStorage.removeItem('rehearsalHighlight')
    setFocusOpen(false)
  }

  function toggleRotated() {
    const next = !rotated
    setRotated(next)
    localStorage.setItem('rotated', next)
  }

  // ── Long-press ───────────────────────────────────────────────
  function hitTestMember(visualX, visualY) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = CW / rect.width, scaleY = CH / rect.height
    let cx = visualX * scaleX, cy = visualY * scaleY
    if (rotatedRef.current) { cx = CW - cx; cy = CH - cy }
    const cur = currentRef.current
    if (!cur) return null
    const placements = positionsByMomentRef.current[cur.moment.id] ?? {}
    const mode = cur.moment.grid_mode ?? 'alternate'
    const d = dimsRef.current
    let best = null, bestDist = TOKEN_R * 2.5
    for (const m of membersRef.current) {
      if (m.role === 'director') continue
      const pos = placements[m.id]; if (!pos) continue
      const pt = getMemberPixelPos(pos, mode, d)
      const dist = Math.hypot(cx - pt.x, cy - pt.y)
      if (dist < bestDist) { bestDist = dist; best = m }
    }
    return best
  }

  function handlePointerDown(e) {
    if (e.button !== 0 && e.pointerType !== 'touch' && e.button !== undefined) return
    clearTimeout(longPressTimerRef.current)
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const vx = e.clientX - rect.left, vy = e.clientY - rect.top
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
    setPressIndicator({ x: vx, y: vy })
    longPressTimerRef.current = setTimeout(() => {
      const m = hitTestMember(vx, vy)
      setPressIndicator(null)
      if (m) setHighlight(highlightIdRef.current === m.id ? '' : m.id)
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    clearTimeout(longPressTimerRef.current)
    setPressIndicator(null)
  }

  function handlePointerMove(e) {
    if (!pressIndicator) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const dx = (e.clientX - rect.left) - pressIndicator.x
    const dy = (e.clientY - rect.top) - pressIndicator.y
    if (Math.hypot(dx, dy) > 12) cancelLongPress()
  }

  // ── Swipe to navigate ─────────────────────────────────────────
  function handlePointerUp(e) {
    cancelLongPress()
    const start = swipeStartRef.current
    if (!start || focusOpen || menuOpen || guideOpen) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else prev()
    }
    swipeStartRef.current = null
  }

  // ── Pinch-to-zoom ────────────────────────────────────────────
  useEffect(() => {
    const wrap = canvasWrapRef.current
    if (!wrap) return
    function onTouchStart(e) {
      if (e.touches.length === 2)
        lastPinchDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
    }
    function onTouchMove(e) {
      if (e.touches.length === 2 && lastPinchDistRef.current != null) {
        e.preventDefault()
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (d / lastPinchDistRef.current))))
        lastPinchDistRef.current = d
      }
    }
    function onTouchEnd() { lastPinchDistRef.current = null }
    wrap.addEventListener('touchstart', onTouchStart, { passive: true })
    wrap.addEventListener('touchmove', onTouchMove, { passive: false })
    wrap.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      wrap.removeEventListener('touchstart', onTouchStart)
      wrap.removeEventListener('touchmove', onTouchMove)
      wrap.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const highlightedMember = highlightId ? members.find(m => m.id === highlightId) : null
  const guideData = highlightId && steps.length
    ? computeGuide(highlightId, steps, positionsByMoment, members, dims)
    : []

  const canvasTransform = [
    zoom !== 1 ? `scale(${zoom})` : '',
    rotated ? 'rotate(180deg)' : '',
  ].filter(Boolean).join(' ') || undefined

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <span className="text-faint text-sm">Carregant…</span>
    </div>
  )

  if (!steps.length) return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center gap-4">
      <p className="text-faint text-sm">No hi ha moments a aquest espectacle.</p>
      <Link to={`/show/${showId}`} className="text-cyan-400 text-sm hover:underline">Tornar a l'escaleta</Link>
    </div>
  )

  return (
    <div className="bg-page flex flex-col overflow-hidden select-none" style={{ height: '100dvh' }}>
      <ShowToolbar showId={showId} showName={show?.name} />

      {/* Canvas area */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-1 relative"
        ref={canvasWrapRef}>
        <canvas ref={canvasRef} width={CW} height={CH}
          style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', touchAction: 'none', transform: canvasTransform }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={cancelLongPress}
        />

        {pressIndicator && (
          <div key={`${pressIndicator.x}-${pressIndicator.y}`}
            style={{ position: 'absolute', left: pressIndicator.x, top: pressIndicator.y,
              transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%',
              border: '3px solid rgba(34, 211, 238, 0.9)',
              animation: `rehearsal-ring ${LONG_PRESS_MS}ms linear forwards` }} />
          </div>
        )}

        {/* Run-through speed selector (only when running) */}
        {running && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-fill/90 border border-amber-600/60 rounded-lg px-2 py-1">
            <span className="text-[10px] text-amber-400">Auto</span>
            <select value={runSpeed} onChange={e => setRunSpeed(Number(e.target.value))}
              onClick={e => e.stopPropagation()}
              className="bg-transparent text-[10px] text-amber-300 focus:outline-none">
              {RUN_SPEEDS.map(s => <option key={s} value={s}>{s}s</option>)}
            </select>
          </div>
        )}

        {/* Zoom buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, +(z + 0.25).toFixed(2)))}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-fill/80 border border-line text-muted hover:text-body active:bg-raised transition-colors">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, +(z - 0.25).toFixed(2)))}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-fill/80 border border-line text-muted hover:text-body active:bg-raised transition-colors">
            <ZoomOut size={16} />
          </button>
          {zoom !== 1.0 && (
            <button onClick={() => setZoom(1.0)}
              className="w-9 h-7 flex items-center justify-center rounded-lg bg-fill/80 border border-line text-faint text-[10px] hover:text-body transition-colors">
              1:1
            </button>
          )}
        </div>
      </div>

      {/* Bottom sheets */}
      {focusOpen && (
        <RehearsalFocusPicker
          members={members} highlightId={highlightId}
          onSelect={setHighlight} onClose={() => setFocusOpen(false)} />
      )}
      {guideOpen && highlightedMember && (
        <RehearsalGuideSheet
          highlightedMember={highlightedMember} guideData={guideData}
          currentIdx={currentIdx} onNavigate={setCurrentIdx} onClose={() => setGuideOpen(false)} />
      )}
      {menuOpen && (
        <RehearsalNavMenu
          steps={steps} currentIdx={currentIdx}
          onNavigate={setCurrentIdx} onClose={() => setMenuOpen(false)} />
      )}

      {/* Bottom bar */}
      <div className="flex items-center border-t border-rim bg-pane shrink-0">
        <button onClick={prev} disabled={currentIdx === 0}
          className="w-16 h-16 flex items-center justify-center text-body disabled:opacity-25 active:bg-fill transition-colors shrink-0">
          <ChevronLeft size={30} />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-1 py-1 px-1">
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[11px] text-faint leading-none truncate">{current?.song.title}</p>
            <p className="text-sm font-semibold text-body leading-tight truncate">{current?.moment.title}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => { setFocusOpen(v => !v); setMenuOpen(false); setGuideOpen(false) }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                highlightId ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-faint hover:text-body'
              }`}>
              <Crosshair size={15} />
            </button>
            {highlightId && (
              <button onClick={() => { setGuideOpen(v => !v); setFocusOpen(false); setMenuOpen(false) }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                  guideOpen ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-faint hover:text-body'
                }`}>
                <BookOpen size={15} />
              </button>
            )}
            {/* Run-through toggle */}
            <button onClick={() => setRunning(v => !v)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                running ? 'border-amber-600 text-amber-400 bg-amber-900/20' : 'border-line text-faint hover:text-body'
              }`}
              title="Mode run-through (espai per pausar)">
              {running ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button onClick={toggleRotated}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                rotated ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-faint hover:text-body'
              }`}>
              <RotateCcw size={15} />
            </button>
            <button onClick={() => { setMenuOpen(v => !v); setFocusOpen(false); setGuideOpen(false) }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                menuOpen ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-faint hover:text-body'
              }`}>
              <List size={15} />
            </button>
            <Link to={`/show/${showId}`}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-line text-faint hover:text-body transition-colors">
              <X size={15} />
            </Link>
          </div>
        </div>

        <button onClick={next} disabled={currentIdx >= steps.length - 1}
          className="w-16 h-16 flex items-center justify-center text-body disabled:opacity-25 active:bg-fill transition-colors shrink-0">
          <ChevronRight size={30} />
        </button>
      </div>

      <style>{`
        @keyframes rehearsal-ring {
          from { transform: scale(0.3); opacity: 1; }
          to   { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </div>
  )
}
