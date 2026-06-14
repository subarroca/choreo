/**
 * Position complexity heuristic for choir staging.
 *
 * Complexity = how hard it is for a member to remember all their position changes.
 * Factors:
 *  - Number of position changes (each change = +1 difficulty)
 *  - Manhattan distance of each move (|Δrow| + |Δcol|)
 *  - Row changes weigh more (exiting/entering a row is harder to remember)
 */

/**
 * Compute complexity stats for a single member across an ordered list of moments.
 * @param {string} memberId
 * @param {Object} positionsByMoment  { momentId: [{memberId, row, col, ...}] }
 * @param {string[]} momentIds         ordered moment IDs (within a song or show)
 * @returns {{ changes: number, distance: number, rowChanges: number }}
 */
export function memberMomentComplexity(memberId, positionsByMoment, momentIds) {
  let changes = 0
  let distance = 0
  let rowChanges = 0

  for (let i = 1; i < momentIds.length; i++) {
    const prev = (positionsByMoment[momentIds[i - 1]] ?? []).find(p => p.memberId === memberId)
    const curr = (positionsByMoment[momentIds[i]] ?? []).find(p => p.memberId === memberId)
    if (!prev || !curr) continue
    const dr = Math.abs((curr.row ?? 0) - (prev.row ?? 0))
    const dc = Math.abs((curr.col ?? 0) - (prev.col ?? 0))
    if (dr + dc > 0) {
      changes++
      distance += dr + dc
      if (dr > 0) rowChanges++
    }
  }

  return { changes, distance, rowChanges }
}

/**
 * Compute a complexity score (0–100) for a member across all songs of a show.
 * @param {string} memberId
 * @param {Object} positionsByMoment
 * @param {Object} momentsBySong     { songId: [{ id, order_index }] }
 * @returns {{ score: number, changes: number, distance: number, level: 'easy'|'medium'|'hard' }}
 */
export function memberShowComplexity(memberId, positionsByMoment, momentsBySong) {
  let totalChanges = 0
  let totalDistance = 0
  let totalRowChanges = 0

  for (const songMoments of Object.values(momentsBySong)) {
    const ordered = [...songMoments].sort((a, b) => a.order_index - b.order_index)
    const { changes, distance, rowChanges } = memberMomentComplexity(
      memberId, positionsByMoment, ordered.map(m => m.id)
    )
    totalChanges += changes
    totalDistance += distance
    totalRowChanges += rowChanges
  }

  // Score: changes × 8 + distance × 1.5 + rowChanges × 4, capped at 100
  const score = Math.min(100, Math.round(totalChanges * 8 + totalDistance * 1.5 + totalRowChanges * 4))
  const level = score >= 60 ? 'hard' : score >= 25 ? 'medium' : 'easy'

  return { score, changes: totalChanges, distance: totalDistance, level }
}

/**
 * Compute complexity for all members of a show, return sorted descending.
 * @param {Object} positionsByMoment
 * @param {Object} momentsBySong
 * @returns {Array<{ memberId, score, changes, distance, level }>}
 */
export function showComplexityRanking(positionsByMoment, momentsBySong) {
  const memberIds = new Set()
  for (const positions of Object.values(positionsByMoment)) {
    for (const p of positions) memberIds.add(p.memberId)
  }

  const results = []
  for (const memberId of memberIds) {
    const stats = memberShowComplexity(memberId, positionsByMoment, momentsBySong)
    results.push({ memberId, ...stats })
  }

  return results.sort((a, b) => b.score - a.score)
}

export const COMPLEXITY_COLORS = {
  easy:   { badge: 'bg-green-500/20 text-green-400',  label: 'Senzill' },
  medium: { badge: 'bg-amber-500/20 text-amber-400',  label: 'Moderat' },
  hard:   { badge: 'bg-red-500/20 text-red-400',      label: 'Complex' },
}
