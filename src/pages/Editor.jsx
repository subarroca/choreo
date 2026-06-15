import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LayoutGrid, Hexagon, Move, Disc } from '../lib/icons'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import PersonProfileOverlay from '../components/PersonProfileOverlay'
import { supabase } from '../lib/supabase'
import {
  LABEL_W, TOKEN_R, VOICE_ORDER, VOICE_GROUPS, ARRANGEMENT_PATTERNS,
  computeRelCenterX, eventToCanvas, getMemberPixelPos, drawAll,
} from '../lib/editorCanvas'
import { drawHeightProfile } from '../lib/editorHeightProfile'
import { autoPlaceByArrangement as _autoPlace } from '../lib/editorArrange'
import EditorSidebar from '../components/editor/EditorSidebar'
import EditorCanvas from '../components/editor/EditorCanvas'
import EditorToolbar from '../components/editor/EditorToolbar'
import EditorContextMenu from '../components/editor/EditorContextMenu'
import EditorRadialMenu from '../components/editor/EditorRadialMenu'
import { isTouchUI } from '../lib/touch'
import EditMomentPanel from '../components/editor/EditMomentPanel'
import AddMomentPanel from '../components/editor/AddMomentPanel'
import ShortcutsModal from '../components/ShortcutsModal'
import { useEditorDrag } from '../hooks/useEditorDrag'
import { useEditorData } from '../hooks/useEditorData'
import { useEditorHistory } from '../hooks/useEditorHistory'
import { useGridConfig } from '../hooks/useGridConfig'
import { useTrajectoryMode } from '../hooks/useTrajectoryMode'
import { useAddMomentForm } from '../hooks/useAddMomentForm'

// ─── Component ────────────────────────────────────────────────
export default function Editor() {
  const { id: showId, sid: songId, mid: momentId } = useParams()
  const navigate = useNavigate()

  // ─── Data hook ───────────────────────────────────────────
  const {
    show, setShow, song, moment, moments, setMoments, allShowSongs,
    members, setMembers, placements, placementsRef, membersRef, momentsRef,
    momentSoloists, setMomentSoloists,
    editMomentTitle, setEditMomentTitle, editMomentSubtitle, setEditMomentSubtitle,
    applyPlacements: _applyPlacements, handleMemberUpdate, handleMemberSetActive, handleMemberDelete,
    saveMomentMeta: _saveMomentMeta, saveSoloists, handleDeleteMoment, navigateToSong, createMoment: _createMoment,
  } = useEditorData({ showId, songId, momentId, navigate })

  const { applyWithHistory, undo, redo, canUndo, canRedo } = useEditorHistory(_applyPlacements)

  function applyPlacements(next) {
    applyWithHistory(next, placementsRef.current)
  }

  // ─── Grid config hook ────────────────────────────────────
  const {
    rowLabels, rowElevations, ROWS, COLS, GW, GH, CW, CH, dims,
    addRow, removeRow, updateRowLabel, updateRowElevation, updateCols,
    rowSensors, rowItems, handleRowDragEnd,
  } = useGridConfig({ show, setShow, showId })

  // ─── Trajectory hook ─────────────────────────────────────
  const {
    trajectoryMode, setTrajectoryMode,
    trajectoryMemberId, setTrajectoryMemberId,
    allSongPositions, allSongPositionsRef,
    enterTrajectoryMode,
  } = useTrajectoryMode({ momentsRef })

  const [mode, setMode] = useState('alternate')
  const [rotated, setRotated] = useState(() => localStorage.getItem('rotated') === 'true')
  const [highlightId, setHighlightId] = useState(() => localStorage.getItem('highlightMemberId') || '')
  const [directorManualX, setDirectorManualX] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [panels, setPanels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('editorPanels') ?? '{}') } catch { return {} }
  })
  const isPanelOpen = (key, def = true) => panels[key] ?? def
  function togglePanel(key, def = true) {
    const next = { ...panels, [key]: !isPanelOpen(key, def) }
    setPanels(next); localStorage.setItem('editorPanels', JSON.stringify(next))
  }
  const [collapsedVoices, setCollapsedVoices] = useState(new Set())
  const [editingMoment, setEditingMoment] = useState(false)
  const [showArrange, setShowArrange] = useState(false)
  const [showFocusPicker, setShowFocusPicker] = useState(false)
  const [arrangeAxis, setArrangeAxis] = useState('cols')
  const [arrangeReplaceAll, setArrangeReplaceAll] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectMode] = useState(false)
  const [pendingMemberId, setPendingMemberId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [profileMember, setProfileMember] = useState(null)
  const [showHeightProfile, setShowHeightProfile] = useState(true)
  const [hoverProfileId, setHoverProfileId] = useState(null)
  const [hoverProfileRow, setHoverProfileRow] = useState(null)
  const [hoverZenithInfo, setHoverZenithInfo] = useState(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const canvasRef = useRef(null)
  const heightCanvasRef = useRef(null)
  const profileHitRef = useRef({})
  const dragRef = useRef(null)
  const dirDragRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const longPressStartRef = useRef(null)
  const lastTapRef = useRef(null)
  const activePointersRef = useRef(new Map())
  const pinchStateRef = useRef(null)
  const canvasScaleRef = useRef(1)
  const canvasContainerRef = useRef(null)
  const modeRef = useRef(mode)
  const highlightRef = useRef(highlightId)
  const dirManualXRef = useRef(directorManualX)
  const selectedIdsRef = useRef(selectedIds)
  const rotatedRef = useRef(rotated)
  const dimsRef = useRef(null)
  const shiftSelectedRef = useRef(null)
  const removeSelectedRef = useRef(null)
  const undoRef = useRef(null)
  const redoRef = useRef(null)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { highlightRef.current = highlightId }, [highlightId])
  useEffect(() => { dirManualXRef.current = directorManualX }, [directorManualX])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { rotatedRef.current = rotated }, [rotated])

  dimsRef.current = dims

  // On momentId change: reset local state
  useEffect(() => {
    setDirectorManualX(null); dirManualXRef.current = null
    setSelectedIds(new Set()); setTrajectoryMode(false); setTrajectoryMemberId('')
  }, [momentId])

  // Sync mode from loaded moment
  useEffect(() => {
    if (moment?.grid_mode) { setMode(moment.grid_mode); modeRef.current = moment.grid_mode }
  }, [moment?.id])

  // ─── Add moment hook ─────────────────────────────────────
  const {
    addingMoment, setAddingMoment,
    newMomentTitle, setNewMomentTitle,
    cloneFrom, otherSongs, otherSongMoments,
    selectedOtherSongId, setSelectedOtherSongId,
    selectedOtherMomentId, setSelectedOtherMomentId,
    selectedTemplate, setSelectedTemplate,
    openAddMoment: _openAddMoment, handleCloneFromChange, createMoment,
  } = useAddMomentForm({ moments, songId, showId, mode, createMoment: _createMoment, navigate })

  function openAddMoment() { _openAddMoment(); setEditingMoment(false) }

  // ─── Director X ──────────────────────────────────────────
  const relCX = mode === 'free' ? null : computeRelCenterX(placements, members, mode, dims)
  const directorAbsX = mode === 'free' ? LABEL_W + GW / 2
    : directorManualX != null ? LABEL_W + directorManualX
    : relCX != null ? LABEL_W + relCX : null

  function currentDirAbsX() {
    const d = dimsRef.current
    if (modeRef.current === 'free') return LABEL_W + d.GW / 2
    const mX = dirManualXRef.current
    const rCX = computeRelCenterX(placementsRef.current, membersRef.current, modeRef.current, d)
    return mX != null ? LABEL_W + mX : rCX != null ? LABEL_W + rCX : null
  }

  function redrawWithDrag(drag) {
    const dm = membersRef.current.find(m => m.role === 'director') ?? null
    drawAll(canvasRef.current, {
      placements: placementsRef.current, members: membersRef.current, mode: modeRef.current,
      highlightId: highlightRef.current, directorAbsX: currentDirAbsX(), directorMember: dm,
      drag, selectedIds: selectedIdsRef.current, rotated: rotatedRef.current,
      dims: dimsRef.current, trajectoryConfig: null,
    })
  }

  // ─── Draw ────────────────────────────────────────────────
  useEffect(() => {
    const tConfig = trajectoryMode && trajectoryMemberId
      ? { allMoments: moments, allPositions: allSongPositions, memberId: trajectoryMemberId, currentMomentId: momentId }
      : null
    const directorMember = members.find(m => m.role === 'director') ?? null
    const soloistMicMap = Object.fromEntries((momentSoloists ?? []).map(s => [s.member_id, s.mic_number || true]))
    function redraw() {
      drawAll(canvasRef.current, { placements, members, mode, highlightId, directorAbsX, directorMember,
        drag: null, selectedIds, rotated, dims, trajectoryConfig: tConfig, soloistMicMap })
    }
    redraw()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', redraw)
    const obs = new MutationObserver(redraw)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => { mq.removeEventListener('change', redraw); obs.disconnect() }
  }, [placements, members, mode, highlightId, directorAbsX, selectedIds, rotated,
    dims, trajectoryMode, trajectoryMemberId, allSongPositions, momentId, moments, momentSoloists])

  useEffect(() => {
    if (!showHeightProfile) return
    const canvas = heightCanvasRef.current; if (!canvas) return
    const result = drawHeightProfile(canvas, { placements, members, mode, dims, rowElevations, hoverMemberId: hoverProfileId, highlightId, hoverRow: hoverProfileRow })
    if (result) profileHitRef.current = result
  }, [placements, members, mode, dims, rowElevations, showHeightProfile, hoverProfileId, highlightId, hoverProfileRow])

  // ─── Soloists ────────────────────────────────────────────
  const toggleSoloist = (memberId) => {
    const existing = momentSoloists.find(s => s.member_id === memberId)
    if (existing) saveSoloists(momentSoloists.filter(s => s.member_id !== memberId))
    else saveSoloists([...momentSoloists, { member_id: memberId, mic_number: '' }])
  }
  const updateSoloistMic = (memberId, mic) =>
    saveSoloists(momentSoloists.map(s => s.member_id === memberId ? { ...s, mic_number: mic } : s))
  function setSoloistMic(memberId, mic) {
    if (!mic) { saveSoloists(momentSoloists.filter(s => s.member_id !== memberId)); return }
    const existing = momentSoloists.find(s => s.member_id === memberId)
    if (existing) saveSoloists(momentSoloists.map(s => s.member_id === memberId ? { ...s, mic_number: mic } : s))
    else saveSoloists([...momentSoloists, { member_id: memberId, mic_number: mic }])
  }

  const removePlacement = (memberId) => { const next = { ...placementsRef.current }; delete next[memberId]; applyPlacements(next) }

  // ─── Context menus ───────────────────────────────────────
  const openContextMenu = (e, member) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, member }) }

  function handleCanvasContextMenu(e) {
    e.preventDefault()
    const { x, y } = eventToCanvas(e, rotatedRef.current, dimsRef.current)
    const d = dimsRef.current, dax = currentDirAbsX()
    const dirMember = membersRef.current.find(m => m.role === 'director')
    if (dirMember && dax != null && Math.hypot(x - dax, y - (d.GH + (d.CH - d.GH) / 2)) < TOKEN_R * 1.8) {
      setContextMenu({ x: e.clientX, y: e.clientY, member: dirMember }); return
    }
    let best = null, bestDist = TOKEN_R * 1.8
    for (const m of membersRef.current) {
      if (m.role === 'director') continue
      const pos = placementsRef.current[m.id]; if (!pos) continue
      const pt = getMemberPixelPos(pos, modeRef.current, d)
      const dist = Math.hypot(x - pt.x, y - pt.y)
      if (dist < bestDist) { bestDist = dist; best = m }
    }
    if (best) setContextMenu({ x: e.clientX, y: e.clientY, member: best })
  }

  function handleProfileContextMenu(e) {
    e.preventDefault()
    const canvas = heightCanvasRef.current; if (!canvas) return
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

  function handleProfileMouseMove(e) {
    const canvas = heightCanvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const { hitAreas = {}, labelHitAreas = {} } = profileHitRef.current ?? {}
    for (const { x, y, w, h, rows } of Object.values(labelHitAreas)) {
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) { setHoverProfileId(null); setHoverProfileRow(rows[0] ?? null); return }
    }
    let foundId = null, bestDist = Infinity
    for (const [id, { px, yTop, yBot }] of Object.entries(hitAreas)) {
      if (my >= yTop - 2 && my <= yBot + 2) { const d = Math.abs(mx - px); if (d < bestDist && d < 20) { bestDist = d; foundId = id } }
    }
    setHoverProfileId(foundId); setHoverProfileRow(null)
  }

  // ─── Moment meta save ────────────────────────────────────
  async function saveMomentMeta() {
    await _saveMomentMeta(editMomentTitle, editMomentSubtitle)
    setEditingMoment(false)
  }

  // ─── Shift selection + keyboard ──────────────────────────
  function shiftSelected(dr, dc) {
    const toMove = selectedIdsRef.current.size > 0 ? selectedIdsRef.current
      : new Set(Object.keys(placementsRef.current).filter(id => { const m = membersRef.current.find(m => m.id === id); return m && m.role !== 'director' }))
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
  removeSelectedRef.current = function removeSelected() {
    if (selectedIdsRef.current.size === 0) return
    const next = { ...placementsRef.current }
    for (const id of selectedIdsRef.current) delete next[id]
    applyPlacements(next)
    setSelectedIds(new Set())
  }
  undoRef.current = () => undo(placementsRef.current)
  redoRef.current = () => redo(placementsRef.current)

  useEffect(() => {
    const MAP = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape' && trajectoryMode) { setTrajectoryMode(false); setTrajectoryMemberId(''); return }
      if (e.key === '?') { setShowShortcuts(v => !v); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault(); removeSelectedRef.current?.(); return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); undoRef.current?.(); return
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); redoRef.current?.(); return
      }
      const dirs = MAP[e.key]; if (!dirs) return
      e.preventDefault(); shiftSelectedRef.current?.(dirs[0], dirs[1])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [trajectoryMode])

  // ─── Mode ─────────────────────────────────────────────────
  async function changeMode(newMode) {
    setMode(newMode); modeRef.current = newMode
    await supabase.from('moments').update({ grid_mode: newMode }).eq('id', momentId)
  }

  // ─── Drag handlers via hook ───────────────────────────────
  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel,
          handleDoubleClick, handleDragOver, handleDrop } = useEditorDrag({
    refs: { canvasRef, dragRef, dirDragRef, longPressTimerRef, longPressStartRef, lastTapRef,
            activePointersRef, pinchStateRef, canvasScaleRef, canvasContainerRef,
            placementsRef, modeRef, membersRef, highlightRef, dirManualXRef,
            selectedIdsRef, rotatedRef, dimsRef, allSongPositionsRef, momentsRef },
    state: { pendingMemberId, trajectoryMode, rotated, selectMode },
    setters: { setSelectedIds, setDirectorManualX, setCanvasScale, setHoverZenithInfo, setPendingMemberId, setContextMenu },
    callbacks: { applyPlacements, currentDirAbsX, redrawWithDrag, navigate },
    params: { showId, songId, trajectoryMemberId },
  })

  // ─── Derived ─────────────────────────────────────────────
  const choirMembers = members.filter(m => m.role !== 'director')
  const showMics = Array.isArray(show?.mics) ? show.mics : (show?.mics ? JSON.parse(show.mics) : [])
  const unplacedCount = choirMembers.filter(m => !placements[m.id]).length
  const allVoices = [...new Set(choirMembers.map(m => m.voice))]
    .sort((a, b) => { const ia = VOICE_ORDER.indexOf(a), ib = VOICE_ORDER.indexOf(b); return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) })
  const voiceGroups = allVoices.map(v => ({
    voice: v, color: VOICE_COLORS[v] ?? VOICE_COLORS.extra, members: choirMembers.filter(m => m.voice === v),
  })).filter(g => g.members.length > 0)
  const MODES = [
    { id: 'square', Icon: LayoutGrid, label: 'Quadrat' }, { id: 'alternate', Icon: Hexagon, label: 'Alternat' },
    { id: 'free', Icon: Move, label: 'Lliure' }, { id: 'semicircle', Icon: Disc, label: 'Semicercle' },
  ]

  // ─── Render ───────────────────────────────────────────────
  return (
    <Layout fullWidth>
      <div className="flex flex-col h-full">

        <EditorToolbar
          moments={moments} momentId={momentId} show={show} song={song}
          allShowSongs={allShowSongs} showId={showId} songId={songId}
          selectedIds={selectedIds} trajectoryMode={trajectoryMode}
          trajectoryMemberId={trajectoryMemberId} members={members}
          choirMembers={choirMembers} highlightId={highlightId} rotated={rotated}
          directorManualX={directorManualX} editingMoment={editingMoment}
          addingMoment={addingMoment} showArrange={showArrange}
          showFocusPicker={showFocusPicker} arrangeAxis={arrangeAxis}
          arrangeReplaceAll={arrangeReplaceAll} mode={mode} sidebarOpen={sidebarOpen}
          onNavigateToSong={navigateToSong} onSetHighlightId={setHighlightId}
          onEnterTrajectoryMode={enterTrajectoryMode} onShiftSelected={shiftSelected}
          onSetRotated={setRotated} onSetSidebarOpen={setSidebarOpen}
          onSetEditingMoment={(curMoment) => { setEditMomentTitle(curMoment.title); setEditMomentSubtitle(curMoment.subtitle ?? ''); setEditingMoment(v => !v); setAddingMoment(false) }}
          onOpenAddMoment={openAddMoment} onSetTrajectoryMode={setTrajectoryMode}
          onSetFocusPicker={setShowFocusPicker} onSetShowArrange={setShowArrange}
          onSetArrangeAxis={setArrangeAxis} onSetArrangeReplaceAll={setArrangeReplaceAll}
          onAutoPlace={(pat, axis, rep) => _autoPlace(pat, axis, rep, placementsRef, membersRef, dimsRef, applyPlacements)}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteSelected={() => removeSelectedRef.current?.()}
          onResetDirector={() => setDirectorManualX(null)}
          canUndo={canUndo} canRedo={canRedo}
          onUndo={() => undo(placementsRef.current)}
          onRedo={() => redo(placementsRef.current)}
          navigate={navigate}
          VOICE_GROUPS={VOICE_GROUPS} ARRANGEMENT_PATTERNS={ARRANGEMENT_PATTERNS} VOICE_COLORS={VOICE_COLORS}
        />

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {sidebarOpen && <div className="absolute inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          <EditorSidebar
            sidebarOpen={sidebarOpen} mode={mode} MODES={MODES} onChangeMode={changeMode}
            isPanelOpen={isPanelOpen} togglePanel={togglePanel}
            rowItems={rowItems} rowSensors={rowSensors} onRowDragEnd={handleRowDragEnd}
            onEditRow={updateRowLabel} onEditElevation={updateRowElevation}
            onRemoveRow={removeRow} onAddRow={addRow}
            COLS={COLS} onUpdateCols={updateCols}
            trajectoryMode={trajectoryMode} voiceGroups={voiceGroups} placements={placements}
            momentSoloists={momentSoloists} showMics={showMics}
            collapsedVoices={collapsedVoices} setCollapsedVoices={setCollapsedVoices}
            pendingMemberId={pendingMemberId} setPendingMemberId={setPendingMemberId}
            unplacedCount={unplacedCount} onContextMenu={openContextMenu} onSoloistMic={setSoloistMic}
          />

          <EditorCanvas
            canvasRef={canvasRef} canvasContainerRef={canvasContainerRef} heightCanvasRef={heightCanvasRef}
            CW={CW} CH={CH} rotated={rotated} pendingMemberId={pendingMemberId}
            trajectoryMode={trajectoryMode} canvasScale={canvasScale} canvasScaleRef={canvasScaleRef}
            members={members} hoverZenithInfo={hoverZenithInfo} showHeightProfile={showHeightProfile}
            onSetPendingMemberId={setPendingMemberId} onSetCanvasScale={setCanvasScale}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}
            onContextMenu={handleCanvasContextMenu} onDoubleClick={handleDoubleClick}
            onDragOver={handleDragOver} onDrop={handleDrop}
            onProfileMouseMove={handleProfileMouseMove} onProfileMouseLeave={() => { setHoverProfileId(null); setHoverProfileRow(null) }}
            onProfileContextMenu={handleProfileContextMenu}
            onToggleHeightProfile={() => setShowHeightProfile(v => !v)}
          />
        </div>

        {editingMoment && (
          <EditMomentPanel
            editMomentTitle={editMomentTitle} editMomentSubtitle={editMomentSubtitle}
            setEditMomentTitle={setEditMomentTitle} setEditMomentSubtitle={setEditMomentSubtitle}
            onSave={saveMomentMeta} onDelete={() => handleDeleteMoment(momentId)}
            onCancel={() => setEditingMoment(false)} />
        )}
        {addingMoment && (
          <AddMomentPanel
            newMomentTitle={newMomentTitle} setNewMomentTitle={setNewMomentTitle}
            cloneFrom={cloneFrom} moments={moments} momentId={momentId}
            otherSongs={otherSongs} otherSongMoments={otherSongMoments}
            selectedOtherSongId={selectedOtherSongId} selectedOtherMomentId={selectedOtherMomentId}
            selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
            setSelectedOtherSongId={setSelectedOtherSongId} setSelectedOtherMomentId={setSelectedOtherMomentId}
            onCloneFromChange={handleCloneFromChange} onCreate={createMoment}
            onCancel={() => setAddingMoment(false)} />
        )}
      </div>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {profileMember && (
        <PersonProfileOverlay member={profileMember} onClose={() => setProfileMember(null)}
          onSave={fields => handleMemberUpdate(profileMember.id, fields).then(d => { if (d) setProfileMember(d) })}
          onSetActive={(id, active) => handleMemberSetActive(id, active).then(d => { if (active && d) setProfileMember(d); else if (!active) setProfileMember(null) })}
          onDelete={id => handleMemberDelete(id).then(ok => { if (ok) setProfileMember(null) })} />
      )}

      {contextMenu?.source === 'canvas' && isTouchUI() ? (
        <EditorRadialMenu
          contextMenu={contextMenu} highlightId={highlightId}
          momentSoloists={momentSoloists} placements={placements}
          onClose={() => setContextMenu(null)} onSetHighlight={setHighlightId}
          onToggleSoloist={toggleSoloist} onSetProfile={setProfileMember}
          onEnterTrajectory={enterTrajectoryMode} onRemovePlacement={removePlacement}
          onMore={() => setContextMenu(cm => ({ ...cm, source: 'sheet' }))}
          VOICE_COLORS={VOICE_COLORS} />
      ) : (
        <EditorContextMenu
          contextMenu={contextMenu} members={members} highlightId={highlightId}
          momentSoloists={momentSoloists} placements={placements} showMics={showMics}
          onClose={() => setContextMenu(null)} onSetHighlight={setHighlightId}
          onToggleSoloist={toggleSoloist} onUpdateSoloistMic={updateSoloistMic}
          onRemovePlacement={removePlacement} onSetProfile={setProfileMember}
          onEnterTrajectory={enterTrajectoryMode}
          VOICE_COLORS={VOICE_COLORS} VOICE_LABELS={VOICE_LABELS} />
      )}
    </Layout>
  )
}
