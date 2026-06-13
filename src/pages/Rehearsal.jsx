import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, List, Crosshair, RotateCcw, BookOpen, ZoomIn, ZoomOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import {
  CELL, LABEL_W, DIRECTOR_H, TOKEN_R, DEFAULT_ROW_LABELS, DEFAULT_COLS,
  VOICE_ORDER, getMemberPixelPos, drawAll,
} from '../lib/editorCanvas'

const LONG_PRESS_MS = 550
const ZOOM_MIN = 0.5, ZOOM_MAX = 3.0

// ── Guide helpers ──────────────────────────────────────────────────────
function colPosition(col, COLS) {
  if (col < COLS / 3) return 'esquerra'
  if (col > 2 * COLS / 3) return 'dreta'
  return 'centre'
}

function computeGuide(memberId, steps, positionsByMoment, members, dims) {
  const result = []
  for (const { song, moment } of steps) {
    const placements = positionsByMoment[moment.id] ?? {}
    const pos = placements[memberId]
    if (!pos || pos.free) {
      result.push({ song, moment, row: null, col: null, posDesc: '—', left: null, right: null, front: [] })
      continue
    }
    const { row, col } = pos
    const posDesc = `${dims.rowLabels[row] ?? `Fila ${row + 1}`} · ${colPosition(col, dims.COLS)}`

    // Neighbours: build map by {row, col}
    const byPos = {}
    for (const m of members) {
      const p = placements[m.id]
      if (p && !p.free && m.id !== memberId) byPos[`${p.row},${p.col}`] = m
    }
    const mode = moment.grid_mode ?? 'alternate'
    const shift = mode === 'alternate' && row % 2 === 1 ? 0.5 : 0
    const prevShift = mode === 'alternate' && (row - 1) % 2 === 1 ? 0.5 : 0

    const leftM = byPos[`${row},${col - 1}`] ?? null
    const rightM = byPos[`${row},${col + 1}`] ?? null
    const frontMembers = []
    if (row > 0) {
      for (let dc = -1; dc <= 1; dc++) {
        const frontCol = col + dc + (prevShift - shift)
        const key1 = `${row - 1},${Math.round(frontCol)}`
        const key2 = `${row - 1},${Math.floor(frontCol)}`
        const fm = byPos[key1] ?? byPos[key2]
        if (fm && !frontMembers.includes(fm)) frontMembers.push(fm)
      }
    }
    result.push({ song, moment, row, col, posDesc, left: leftM, right: rightM, front: frontMembers })
  }
  return result
}

function firstName(m) { return m ? (m.first_name || m.name.split(' ')[0]) : null }

export default function Rehearsal() {
  const { id: showId } = useParams()
  const canvasRef = useRef(null)
  const canvasWrapRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const lastPinchDistRef = useRef(null)

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

  // Refs to avoid stale closures
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
    const mode = current.moment.grid_mode ?? 'alternate'
    const directorMember = members.find(m => m.role === 'director') ?? null
    drawAll(canvasRef.current, {
      placements, members, mode, highlightId,
      directorAbsX: null, directorMember, drag: null,
      selectedIds: new Set(), rotated, dims,
      trajectoryConfig: null, soloistMicMap: {},
    })
  }, [positionsByMoment, members, current, show, dims, highlightId, rotated])

  function prev() { if (currentIdx > 0) setCurrentIdx(i => i - 1) }
  function next() { if (currentIdx < steps.length - 1) setCurrentIdx(i => i + 1) }

  useEffect(() => {
    function onKey(e) {
      if (focusOpen || menuOpen || guideOpen) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIdx, steps.length, focusOpen, menuOpen, guideOpen])

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

  // ── Long-press to set focus ──────────────────────────────────────────
  function hitTestMember(visualX, visualY) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = CW / rect.width
    const scaleY = CH / rect.height
    let cx = visualX * scaleX
    let cy = visualY * scaleY
    if (rotatedRef.current) { cx = CW - cx; cy = CH - cy }
    const cur = currentRef.current
    if (!cur) return null
    const placements = positionsByMomentRef.current[cur.moment.id] ?? {}
    const mode = cur.moment.grid_mode ?? 'alternate'
    const d = dimsRef.current
    let best = null, bestDist = TOKEN_R * 2.5
    for (const m of membersRef.current) {
      if (m.role === 'director') continue
      const pos = placements[m.id]
      if (!pos) continue
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
    const vx = e.clientX - rect.left
    const vy = e.clientY - rect.top
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

  // ── Pinch-to-zoom ────────────────────────────────────────────────────
  useEffect(() => {
    const wrap = canvasWrapRef.current
    if (!wrap) return
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        lastPinchDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
      }
    }
    function onTouchMove(e) {
      if (e.touches.length === 2 && lastPinchDistRef.current != null) {
        e.preventDefault()
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        const ratio = d / lastPinchDistRef.current
        setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * ratio)))
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

  // ── Voice groups for focus picker ────────────────────────────────────
  const choirMembers = members.filter(m => m.role !== 'director' && m.role !== 'musician')
  const allVoices = [...new Set(choirMembers.map(m => m.voice))]
    .sort((a, b) => {
      const ia = VOICE_ORDER.indexOf(a), ib = VOICE_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  const voiceGroups = allVoices.map(v => ({
    voice: v, label: VOICE_LABELS[v] ?? v,
    color: (VOICE_COLORS[v] ?? VOICE_COLORS.extra).bg,
    members: choirMembers.filter(m => m.voice === v),
  }))

  const highlightedMember = highlightId ? members.find(m => m.id === highlightId) : null
  const uniqueSongIds = [...new Set(steps.map(s => s.song.id))]
  const currentSongSteps = current ? steps.filter(s => s.song.id === current.song.id) : []

  // ── Guide data ────────────────────────────────────────────────────────
  const guideData = highlightId && steps.length
    ? computeGuide(highlightId, steps, positionsByMoment, members, dims)
    : []

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <span className="text-gray-500 text-sm">Carregant…</span>
    </div>
  )

  if (!steps.length) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-sm">No hi ha moments a aquest espectacle.</p>
      <Link to={`/show/${showId}`} className="text-cyan-400 text-sm hover:underline">Tornar a l'escaleta</Link>
    </div>
  )

  const canvasTransform = [
    zoom !== 1 ? `scale(${zoom})` : '',
    rotated ? 'rotate(180deg)' : '',
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className="bg-gray-950 flex flex-col overflow-hidden select-none" style={{ height: '100dvh' }}>

      {/* ── Canvas area ── */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-1 relative"
        ref={canvasWrapRef}>
        <canvas ref={canvasRef} width={CW} height={CH}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block',
            touchAction: 'none',
            transform: canvasTransform,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
        />

        {/* Long-press ring indicator */}
        {pressIndicator && (
          <div key={`${pressIndicator.x}-${pressIndicator.y}`}
            style={{ position: 'absolute', left: pressIndicator.x, top: pressIndicator.y,
              transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '3px solid rgba(34, 211, 238, 0.9)',
              animation: `rehearsal-ring ${LONG_PRESS_MS}ms linear forwards`,
            }} />
          </div>
        )}

        {/* Zoom buttons — top-right overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, +(z + 0.25).toFixed(2)))}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 hover:text-white active:bg-gray-700 transition-colors">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, +(z - 0.25).toFixed(2)))}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 hover:text-white active:bg-gray-700 transition-colors">
            <ZoomOut size={16} />
          </button>
          {zoom !== 1.0 && (
            <button onClick={() => setZoom(1.0)}
              className="w-9 h-7 flex items-center justify-center rounded-lg bg-gray-800/80 border border-gray-700 text-gray-500 text-[10px] hover:text-white transition-colors">
              1:1
            </button>
          )}
        </div>
      </div>

      {/* ── Focus picker bottom sheet ── */}
      {focusOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setFocusOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl max-h-[65dvh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
              <span className="text-sm font-semibold text-white">Focus persona</span>
              <div className="flex items-center gap-2">
                {highlightId && (
                  <button onClick={() => setHighlight('')}
                    className="text-xs text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded-lg">
                    Treure focus
                  </button>
                )}
                <button onClick={() => setFocusOpen(false)}
                  className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 px-4 pb-2 shrink-0">
              O mantén premut sobre una persona al canvas.
            </p>
            <div className="overflow-y-auto px-4 pb-6 space-y-3">
              {voiceGroups.map(({ voice, label, color, members: vMembers }) => (
                <div key={voice}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-4">
                    {vMembers.map(m => {
                      const initials = m.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                      const fn = m.first_name || m.name.split(' ')[0]
                      const active = highlightId === m.id
                      return (
                        <button key={m.id} onClick={() => setHighlight(m.id)}
                          style={active ? { borderColor: color } : {}}
                          className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-colors min-h-[44px] ${
                            active ? 'bg-gray-800' : 'border-gray-700 hover:bg-gray-800'
                          }`}>
                          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                            style={{ background: color }}>
                            {initials}
                          </span>
                          <span className={active ? 'text-white' : 'text-gray-300'}>{fn}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Guide mode bottom sheet ── */}
      {guideOpen && highlightedMember && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setGuideOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl max-h-[75dvh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: (VOICE_COLORS[highlightedMember.voice] ?? VOICE_COLORS.extra).bg }}>
                  {highlightedMember.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-white">
                  {firstName(highlightedMember)} — posicions
                </span>
              </div>
              <button onClick={() => setGuideOpen(false)}
                className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-6">
              {(() => {
                let lastSongId = null
                return guideData.map((entry, i) => {
                  const showSong = entry.song.id !== lastSongId
                  lastSongId = entry.song.id
                  return (
                    <div key={`${entry.moment.id}`}>
                      {showSong && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-4 mb-1">
                          {entry.song.title}
                        </p>
                      )}
                      <button onClick={() => { setCurrentIdx(i); setGuideOpen(false) }}
                        className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-colors ${
                          i === currentIdx ? 'bg-cyan-900/40 border border-cyan-700/50' : 'hover:bg-gray-800/60'
                        }`}>
                        <p className="text-xs font-semibold text-white mb-0.5">{entry.moment.title}</p>
                        {entry.row == null
                          ? <p className="text-[11px] text-gray-600">Sense posició assignada</p>
                          : <>
                              <p className="text-[11px] text-cyan-400 font-medium">{entry.posDesc}</p>
                              <div className="flex flex-wrap gap-x-4 mt-0.5">
                                {entry.left && <span className="text-[11px] text-gray-400">← {firstName(entry.left)}</span>}
                                {entry.right && <span className="text-[11px] text-gray-400">{firstName(entry.right)} →</span>}
                                {entry.front.length > 0 && (
                                  <span className="text-[11px] text-gray-500">
                                    davant: {entry.front.map(m => firstName(m)).join(', ')}
                                  </span>
                                )}
                              </div>
                            </>
                        }
                      </button>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </>
      )}

      {/* ── Navigation menu drawer ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Navegar</h3>
                <button onClick={() => setMenuOpen(false)}
                  className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                  <X size={16} />
                </button>
              </div>
              {uniqueSongIds.map(songId => {
                const songSteps = steps.filter(s => s.song.id === songId)
                const song = songSteps[0].song
                return (
                  <div key={songId} className="mb-4">
                    <p className="text-xs font-medium text-gray-400 mb-1.5 px-1">{song.title}</p>
                    {songSteps.map((step, i) => {
                      const stepIdx = steps.indexOf(step)
                      return (
                        <button key={step.moment.id}
                          onClick={() => { setCurrentIdx(stepIdx); setMenuOpen(false) }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs mb-0.5 transition-colors ${
                            stepIdx === currentIdx
                              ? 'bg-cyan-700/40 text-cyan-300'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}>
                          <span className="text-gray-500 tabular-nums mr-2">{i + 1}.</span>
                          {step.moment.title}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Single bottom bar ── */}
      <div className="flex items-center border-t border-gray-800 bg-gray-900 shrink-0">
        <button onClick={prev} disabled={currentIdx === 0}
          className="w-16 h-16 flex items-center justify-center text-white disabled:opacity-25 active:bg-gray-800 transition-colors shrink-0">
          <ChevronLeft size={30} />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-1 py-1 px-1">
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[11px] text-gray-500 leading-none truncate">{current?.song.title}</p>
            <p className="text-sm font-semibold text-white leading-tight truncate">{current?.moment.title}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Focus button — standard active style */}
            <button onClick={() => { setFocusOpen(v => !v); setMenuOpen(false); setGuideOpen(false) }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                highlightId
                  ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20'
                  : 'border-gray-700 text-gray-500 hover:text-white'
              }`}
              title={highlightedMember ? highlightedMember.name : 'Focus'}>
              <Crosshair size={15} />
            </button>
            {/* Guide button — only visible when someone is focused */}
            {highlightId && (
              <button onClick={() => { setGuideOpen(v => !v); setFocusOpen(false); setMenuOpen(false) }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                  guideOpen
                    ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20'
                    : 'border-gray-700 text-gray-500 hover:text-white'
                }`}
                title="Mode guia">
                <BookOpen size={15} />
              </button>
            )}
            <button onClick={toggleRotated}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                rotated ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-500 hover:text-white'
              }`}>
              <RotateCcw size={15} />
            </button>
            <button onClick={() => { setMenuOpen(v => !v); setFocusOpen(false); setGuideOpen(false) }}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                menuOpen ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-500 hover:text-white'
              }`}>
              <List size={15} />
            </button>
            <Link to={`/show/${showId}`}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700 text-gray-500 hover:text-white transition-colors">
              <X size={15} />
            </Link>
          </div>
        </div>

        <button onClick={next} disabled={currentIdx >= steps.length - 1}
          className="w-16 h-16 flex items-center justify-center text-white disabled:opacity-25 active:bg-gray-800 transition-colors shrink-0">
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
