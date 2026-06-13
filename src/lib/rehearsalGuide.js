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
