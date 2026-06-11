import { eventToCanvas, getMemberPixelPos, pixelToCell, TOKEN_R, LABEL_W, DIRECTOR_H } from '../lib/editorCanvas'

export function useEditorDrag(ctx) {
  const {
    refs: {
      canvasRef, dragRef, dirDragRef, longPressTimerRef, longPressStartRef, lastTapRef,
      activePointersRef, pinchStateRef, canvasScaleRef, canvasContainerRef,
      placementsRef, modeRef, membersRef, highlightRef, dirManualXRef,
      selectedIdsRef, rotatedRef, dimsRef, allSongPositionsRef,
    },
    state: { pendingMemberId, trajectoryMode, rotated, selectMode },
    setters: { setSelectedIds, setDirectorManualX, setCanvasScale, setHoverZenithInfo, setPendingMemberId, setContextMenu },
    callbacks: { applyPlacements, currentDirAbsX, redrawWithDrag, navigate },
    params: { showId, songId, trajectoryMemberId },
  } = ctx

  function vibrate(pattern) { if ('vibrate' in navigator) navigator.vibrate(pattern) }

  function placeMember(memberId, x, y) {
    const next = { ...placementsRef.current }, d = dimsRef.current
    if (modeRef.current === 'free') {
      if (y >= 0 && y <= d.GH) {
        next[memberId] = { free: true, x: Math.max(0, Math.min(1, (x - LABEL_W) / d.GW)), y: Math.max(0, Math.min(1, y / d.GH)) }
        vibrate(30)
      }
    } else {
      const cell = pixelToCell(x, y, modeRef.current, d)
      if (cell) { next[memberId] = { row: cell.row, col: cell.col }; vibrate(30) }
    }
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
    for (const m of ctx.refs.momentsRef.current) {
      const pos = allSongPositionsRef.current[m.id]?.[trajectoryMemberId]
      if (!pos) continue
      const pt = getMemberPixelPos(pos, modeRef.current, dimsRef.current)
      if (pt && Math.hypot(x - pt.x, y - pt.y) < TOKEN_R + 6) return m.id
    }
    return null
  }

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

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })

    // ── Pinch-zoom: 2 fingers ──
    if (activePointersRef.current.size === 2) {
      dragRef.current = null; dirDragRef.current = null
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; longPressStartRef.current = null }
      const pts = [...activePointersRef.current.values()]
      pinchStateRef.current = { dist: Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY), startScale: canvasScaleRef.current }
      return
    }

    if (!e.isPrimary) return

    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)

    // ── Tap-to-place pending member ──
    if (pendingMemberId) {
      placeMember(pendingMemberId, x, y)
      setPendingMemberId(null)
      return
    }

    // ── Long-press → context menu (touch only, 500ms) ──
    if (e.pointerType === 'touch') {
      const startCX = e.clientX, startCY = e.clientY
      longPressStartRef.current = { x: startCX, y: startCY }
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null; longPressStartRef.current = null
        dragRef.current = null
        const d = dimsRef.current
        const dirMember = membersRef.current.find(m => m.role === 'director')
        const dax = currentDirAbsX()
        let member = null
        if (dirMember && dax != null && Math.hypot(x - dax, y - (d.GH + DIRECTOR_H / 2)) < TOKEN_R * 1.8) {
          member = dirMember
        } else {
          member = memberAtPixel(x, y)
        }
        if (member) { vibrate(30); setContextMenu({ x: startCX, y: startCY, member }) }
      }, 500)
    }

    if (trajectoryMode) {
      const hitMomentId = hitTestTrajectory(x, y)
      if (hitMomentId) navigate(`/show/${showId}/song/${songId}/moment/${hitMomentId}`)
      return
    }

    // ── Select mode: tap toggles selection ──
    if (selectMode) {
      const hit = hitTest(x, y)
      if (hit?.type === 'member') {
        const { memberId } = hit
        setSelectedIds(prev => { const n = new Set(prev); n.has(memberId) ? n.delete(memberId) : n.add(memberId); return n })
      }
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

    // No member hit — pan if zoomed in (touch), else rect-select
    if (!e.shiftKey) { setSelectedIds(new Set()); selectedIdsRef.current = new Set() }
    if (canvasScaleRef.current > 1.05 && e.pointerType === 'touch') {
      dragRef.current = { type: 'pan', startClientX: e.clientX, startClientY: e.clientY }
    } else {
      dragRef.current = { type: 'select-rect', startX: x, startY: y, currentX: x, currentY: y }
    }
  }

  function handlePointerMove(e) {
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })

    // ── Pinch-zoom ──
    if (activePointersRef.current.size === 2 && pinchStateRef.current) {
      const pts = [...activePointersRef.current.values()]
      const newDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY)
      const newScale = Math.max(0.8, Math.min(4, pinchStateRef.current.startScale * newDist / pinchStateRef.current.dist))
      canvasScaleRef.current = newScale
      setCanvasScale(newScale)
      return
    }

    if (!e.isPrimary) return

    // ── Long-press: cancel only if moved > 8px ──
    if (longPressTimerRef.current && longPressStartRef.current) {
      const moved = Math.hypot(e.clientX - longPressStartRef.current.x, e.clientY - longPressStartRef.current.y)
      if (moved > 8) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null; longPressStartRef.current = null
      }
    }

    if (trajectoryMode) return
    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)

    if (dirDragRef.current?.active) {
      const relX = Math.max(0, Math.min(dimsRef.current.GW, x - LABEL_W))
      dirManualXRef.current = relX; setDirectorManualX(relX); return
    }

    const drag = dragRef.current

    // ── Pan (touch + zoomed) ──
    if (drag?.type === 'pan') {
      const dx = e.clientX - drag.startClientX
      const dy = e.clientY - drag.startClientY
      if (canvasContainerRef.current) {
        canvasContainerRef.current.scrollLeft -= dx
        canvasContainerRef.current.scrollTop -= dy
      }
      drag.startClientX = e.clientX; drag.startClientY = e.clientY
      return
    }

    if (!drag) {
      // Hover tooltip only for mouse/pen (not touch)
      if (e.pointerType !== 'touch') {
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
      }
      return
    }
    if (drag.type === 'member') { drag.x = x; drag.y = y }
    else if (drag.type === 'group') { drag.currentX = x; drag.currentY = y }
    else if (drag.type === 'select-rect') { drag.currentX = x; drag.currentY = y }
    redrawWithDrag(drag)
  }

  function handlePointerUp(e) {
    activePointersRef.current.delete(e.pointerId)
    if (activePointersRef.current.size < 2) pinchStateRef.current = null

    if (!e.isPrimary) return
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; longPressStartRef.current = null }

    const { x, y } = eventToCanvas(e, rotated, dimsRef.current)

    // Double-tap detection (touch)
    if (e.pointerType === 'touch' && !trajectoryMode) {
      const now = Date.now()
      const last = lastTapRef.current
      if (last && now - last.time < 300 && Math.hypot(x - last.x, y - last.y) < 20) {
        lastTapRef.current = null
        const wasDragging = dragRef.current && dragRef.current.type !== 'pan'
        dragRef.current = null; dirDragRef.current = null
        if (!wasDragging) {
          const hit = hitTest(x, y)
          if (hit?.type === 'member') {
            vibrate([30, 20, 30])
            const next = { ...placementsRef.current }; delete next[hit.memberId]
            setSelectedIds(prev => { const n = new Set(prev); n.delete(hit.memberId); return n })
            applyPlacements(next)
          } else {
            // Double-tap empty space → reset zoom
            canvasScaleRef.current = 1; setCanvasScale(1)
          }
          return
        }
      } else {
        lastTapRef.current = { time: now, x, y }
      }
    }

    if (trajectoryMode) return
    dirDragRef.current = null
    if (!dragRef.current) return
    const drag = dragRef.current; dragRef.current = null
    if (drag.type === 'pan') return
    if (drag.type === 'member') { vibrate(30); finalizeSingleDrag(drag.memberId, x, y) }
    else if (drag.type === 'group') { vibrate(30); finalizeGroupDrag(drag, x, y) }
    else if (drag.type === 'select-rect') finalizeRectSelect(drag)
  }

  function handlePointerCancel(e) {
    activePointersRef.current.delete(e.pointerId)
    pinchStateRef.current = null
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; longPressStartRef.current = null }
    dragRef.current = null; dirDragRef.current = null
    setHoverZenithInfo(null)
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
    placeMember(memberId, x, y)
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel,
           handleDoubleClick, handleDragOver, handleDrop }
}
