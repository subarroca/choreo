import { VOICE_ORDER, VOICE_GROUPS } from './editorCanvas'

export const POSITION_TEMPLATES = [
  { id: 'SATB-cols', label: 'SATB per columnes', pattern: 'SATB', axis: 'cols' },
  { id: 'SATB-rows', label: 'SATB per files',    pattern: 'SATB', axis: 'rows' },
  { id: 'ABTS-cols', label: 'ABTS per columnes', pattern: 'ABTS', axis: 'cols' },
  { id: 'BSAT-cols', label: 'BSAT per columnes', pattern: 'BSAT', axis: 'cols' },
  { id: 'STBA-rows', label: 'STBA per files',    pattern: 'STBA', axis: 'rows' },
]

export function computeArrangementPositions(pattern, axis, members, dims) {
  const mems = members.filter(m => m.role !== 'director')
  const groups = pattern.split('').map(letter => {
    const voices = VOICE_GROUPS[letter] ?? []
    return {
      members: mems.filter(m => voices.includes(m.voice))
        .sort((a, b) => VOICE_ORDER.indexOf(a.voice) - VOICE_ORDER.indexOf(b.voice)),
    }
  }).filter(g => g.members.length > 0)

  const next = {}
  const maxGroupSize = Math.max(...groups.map(g => g.members.length))
  const optimalRows = Math.min(dims.ROWS, Math.max(2, Math.round(Math.sqrt(maxGroupSize))))

  if (axis === 'cols') {
    const groupSlices = groups.map(g => ({ ...g, sliceWidth: Math.max(1, Math.ceil(g.members.length / optimalRows)) }))
    const totalWidth = groupSlices.reduce((s, g) => s + g.sliceWidth, 0)
    let colCursor = Math.max(0, Math.floor((dims.COLS - totalWidth) / 2))
    groupSlices.forEach(g => {
      const startCol = colCursor; colCursor += g.sliceWidth
      g.members.forEach((m, i) => {
        const row = Math.max(0, dims.ROWS - 1 - Math.floor(i / g.sliceWidth))
        const col = startCol + (i % g.sliceWidth)
        next[m.id] = { row, col }
      })
    })
  } else {
    const colsPerRow = Math.min(dims.COLS, Math.max(1, Math.ceil(maxGroupSize / optimalRows)))
    const startCol = Math.max(0, Math.floor((dims.COLS - colsPerRow) / 2))
    let rowCursor = dims.ROWS - 1
    groups.forEach(g => {
      const rowsNeeded = Math.max(1, Math.ceil(g.members.length / colsPerRow))
      g.members.forEach((m, i) => {
        const rowOffset = Math.floor(i / colsPerRow)
        const row = Math.max(0, rowCursor - rowOffset)
        const inThisRow = Math.min(colsPerRow, g.members.length - rowOffset * colsPerRow)
        const rowStart = startCol + Math.floor((colsPerRow - inThisRow) / 2)
        next[m.id] = { row, col: rowStart + (i % colsPerRow) }
      })
      rowCursor = Math.max(0, rowCursor - rowsNeeded)
    })
  }
  return next
}

export function compactPositions(placementsRef, membersRef, dimsRef, applyPlacements, axis = 'hv') {
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
  const byRow = {}
  for (const p of placed) (byRow[p.row] ??= []).push(p)
  const occupiedRows = Object.keys(byRow).map(Number).sort((a, b) => a - b)
  if (axis === 'h') {
    for (const origRow of occupiedRows) {
      const items = byRow[origRow]
      const n = items.length
      const startCol = Math.max(0, Math.floor((d.COLS - n) / 2))
      items.forEach(({ id }, i) => { next[id] = { row: origRow, col: startCol + i } })
    }
  } else {
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

export function autoPlaceByArrangement(pattern, axis, replaceAll, placementsRef, membersRef, dimsRef, applyPlacements) {
  const d = dimsRef.current
  const mems = membersRef.current.filter(m => m.role !== 'director')
  const base = replaceAll ? {} : { ...placementsRef.current }
  const groups = pattern.split('').map(letter => {
    const voices = VOICE_GROUPS[letter] ?? []
    return {
      letter, voices,
      members: mems.filter(m => voices.includes(m.voice))
        .sort((a, b) => VOICE_ORDER.indexOf(a.voice) - VOICE_ORDER.indexOf(b.voice)),
    }
  }).filter(g => g.members.length > 0)
  const totalMembers = groups.reduce((s, g) => s + g.members.length, 0)
  if (totalMembers === 0) return
  const next = { ...base }
  const maxGroupSize = Math.max(...groups.map(g => g.members.length))
  const optimalRows = Math.min(d.ROWS, Math.max(2, Math.round(Math.sqrt(maxGroupSize))))
  if (axis === 'cols') {
    const groupSlices = groups.map(g => ({ ...g, sliceWidth: Math.max(1, Math.ceil(g.members.length / optimalRows)) }))
    const totalWidth = groupSlices.reduce((s, g) => s + g.sliceWidth, 0)
    let colCursor = Math.max(0, Math.floor((d.COLS - totalWidth) / 2))
    groupSlices.forEach(g => {
      const startCol = colCursor; colCursor += g.sliceWidth
      g.members.forEach((m, i) => {
        if (!replaceAll && placementsRef.current[m.id]) return
        const row = Math.max(0, d.ROWS - 1 - Math.floor(i / g.sliceWidth))
        const col = startCol + (i % g.sliceWidth)
        next[m.id] = { row, col }
      })
    })
  } else {
    const colsPerRow = Math.min(d.COLS, Math.max(1, Math.ceil(maxGroupSize / optimalRows)))
    const startCol = Math.max(0, Math.floor((d.COLS - colsPerRow) / 2))
    let rowCursor = d.ROWS - 1
    groups.forEach(g => {
      const rowsNeeded = Math.max(1, Math.ceil(g.members.length / colsPerRow))
      g.members.forEach((m, i) => {
        if (!replaceAll && placementsRef.current[m.id]) return
        const rowOffset = Math.floor(i / colsPerRow)
        const row = Math.max(0, rowCursor - rowOffset)
        const inThisRow = Math.min(colsPerRow, g.members.length - rowOffset * colsPerRow)
        const rowStart = startCol + Math.floor((colsPerRow - inThisRow) / 2)
        next[m.id] = { row, col: rowStart + (i % colsPerRow) }
      })
      rowCursor = Math.max(0, rowCursor - rowsNeeded)
    })
  }
  applyPlacements(next)
}
