import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCueNumber, cueSummary, lightColor, sortCues } from '../../lib/lights'

// Barra fina sota la toolbar de l'editor: cues de llum vinculats al moment actual.
// Si el moment no té cues, no es mostra res.
export default function MomentLightsBar({ showId, momentId }) {
  const [cues, setCues] = useState([])

  useEffect(() => {
    let active = true
    supabase.from('light_cues').select('*').eq('moment_id', momentId)
      .then(({ data }) => { if (active) setCues(sortCues(data ?? [])) })
    return () => { active = false }
  }, [momentId])

  if (!cues.length) return null

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900/70 border-b border-gray-800 overflow-x-auto shrink-0">
      <Lightbulb size={13} className="text-amber-400 shrink-0" />
      {cues.map(c => {
        const color = lightColor(c.front_color) ?? lightColor(c.back_color)
        return (
          <Link key={c.id} to={`/show/${showId}/llums`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-800 rounded-md px-2 py-1 shrink-0 transition-colors">
            <span className="font-bold text-gray-200">{formatCueNumber(c.cue_number)}</span>
            {color && <span className="w-2.5 h-2.5 rounded-full border border-gray-600" style={{ background: color.hex }} />}
            <span className="truncate max-w-[260px]">{cueSummary(c)}</span>
          </Link>
        )
      })}
    </div>
  )
}
