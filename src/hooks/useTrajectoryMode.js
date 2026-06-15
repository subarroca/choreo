import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useTrajectoryMode({ momentsRef }) {
  const [trajectoryMode, setTrajectoryMode] = useState(false)
  const [trajectoryMemberId, setTrajectoryMemberId] = useState('')
  const [allSongPositions, setAllSongPositions] = useState({})
  const allSongPositionsRef = useRef(allSongPositions)

  useEffect(() => { allSongPositionsRef.current = allSongPositions }, [allSongPositions])

  async function enterTrajectoryMode(memberId) {
    if (!memberId) { setTrajectoryMode(false); setTrajectoryMemberId(''); return }
    setTrajectoryMemberId(memberId); setTrajectoryMode(true)
    const allMoments = momentsRef.current; if (!allMoments.length) return
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

  return {
    trajectoryMode, setTrajectoryMode,
    trajectoryMemberId, setTrajectoryMemberId,
    allSongPositions, allSongPositionsRef,
    enterTrajectoryMode,
  }
}
