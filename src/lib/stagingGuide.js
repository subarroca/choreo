const METRO_COLORS = [
  '#DC0034', // L1 vermell
  '#9B2D8E', // L2 lila
  '#3FAB36', // L3 verd
  '#FFBE00', // L4 groc
  '#0068B0', // L5 blau
  '#00B2CA', // L6 blau clar
  '#E05020', // L7 taronja
  '#00A87D', // L8/L9 verd menta
]

const TERRA_GRAYS = ['#9CA3AF', '#6B7280', '#4B5563', '#374151']

export function rowChipStyle(rowIndex, rowElevations, rowLabels) {
  const elev = rowElevations?.[rowIndex] ?? 0
  if (elev > 0) {
    const uniqueElevs = [...new Set((rowElevations ?? []).filter(e => e > 0))].sort((a, b) => a - b)
    const tarimaIdx = uniqueElevs.indexOf(elev)
    const color = METRO_COLORS[tarimaIdx] ?? METRO_COLORS[METRO_COLORS.length - 1]
    const label = rowLabels?.[rowIndex] ?? `Tarima ${tarimaIdx + 1}`
    return { color, label, textColor: tarimaIdx === 3 ? '#1a1a1a' : '#ffffff' }
  }
  const terraRows = (rowElevations ?? []).reduce((acc, e, i) => { if (e === 0) acc.push(i); return acc }, [])
  const terraIdx = terraRows.indexOf(rowIndex)
  const color = TERRA_GRAYS[Math.min(terraIdx, TERRA_GRAYS.length - 1)]
  const label = rowLabels?.[rowIndex] ?? 'Terra'
  return { color, label, textColor: '#ffffff' }
}

export function colPosition(col, COLS) {
  if (col < COLS / 3) return 'esquerra'
  if (col > 2 * COLS / 3) return 'dreta'
  return 'centre'
}

export function firstName(m) { return m ? (m.first_name || m.name.split(' ')[0]) : null }

export function computeGuide(memberId, steps, positionsByMoment, members, dims) {
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
