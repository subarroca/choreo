import { useRef } from 'react'
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'
import { CELL, LABEL_W, DIRECTOR_H, DEFAULT_ROW_LABELS, DEFAULT_COLS } from '../lib/editorCanvas'

export function useGridConfig({ show, setShow, showId }) {
  const gridSaveTimerRef = useRef(null)

  const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
  const rowElevations = show?.row_elevations ?? rowLabels.map((_, i, a) => (a.length - 1 - i) * 40)
  const ROWS = rowLabels.length
  const COLS = show?.grid_cols ?? DEFAULT_COLS
  const GW = COLS * CELL, GH = ROWS * CELL
  const CW = LABEL_W + GW, CH = GH + DIRECTOR_H
  const dims = { ROWS, COLS, rowLabels, GW, GH, CW, CH, rowElevations }

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

  const addRow = () => setRowLabels([`Fila ${ROWS + 1}`, ...rowLabels], [0, ...rowElevations])
  const removeRow = (i) => {
    if (ROWS > 1) setRowLabels(rowLabels.filter((_, idx) => idx !== i), rowElevations.filter((_, idx) => idx !== i))
  }
  const updateRowLabel = (i, val) => setRowLabels(rowLabels.map((l, idx) => idx === i ? val : l))

  function updateRowElevation(i, val) {
    const e = rowElevations.map((v, idx) => idx === i ? Math.max(0, parseInt(val) || 0) : v)
    setShow(prev => ({ ...prev, row_elevations: e }))
    scheduleGridSave(rowLabels, COLS, e)
  }

  function reorderRows(newLabels) {
    const newElevs = newLabels.map(label => {
      const i = rowLabels.indexOf(label); return i >= 0 ? rowElevations[i] : 0
    })
    setRowLabels(newLabels, newElevs)
  }

  function updateCols(n) {
    const c = Math.max(4, Math.min(30, n))
    setShow(prev => ({ ...prev, grid_cols: c }))
    scheduleGridSave(rowLabels, c, rowElevations)
  }

  const rowSensors = useSensors(useSensor(PointerSensor))
  const rowItems = rowLabels.map((label, i) => ({ id: String(i), label, elevation: rowElevations[i] ?? 0 }))

  function handleRowDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    reorderRows(arrayMove(
      rowLabels,
      rowItems.findIndex(r => r.id === active.id),
      rowItems.findIndex(r => r.id === over.id),
    ))
  }

  return {
    rowLabels, rowElevations, ROWS, COLS, GW, GH, CW, CH, dims,
    addRow, removeRow, updateRowLabel, updateRowElevation, reorderRows, updateCols,
    rowSensors, rowItems, handleRowDragEnd,
  }
}
