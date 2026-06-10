import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { X, Plus, Mic, ArrowRight, Menu } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS } from '../lib/constants'
import Layout from '../components/Layout'

// ─── Helpers ──────────────────────────────────────────────────
function memberInitials(m) {
  return (m.initials || ((m.first_name ?? '').slice(0,1) + (m.last_name ?? '').slice(0,1))).toUpperCase()
}

// ─── Main ─────────────────────────────────────────────────────
export default function Mics() {
  const { id: showId } = useParams()

  const [show, setShow]         = useState(null)
  const [songs, setSongs]       = useState([])
  const [allMoments, setAllMoments] = useState([])  // [{...moment, song_title}]
  const [members, setMembers]   = useState([])
  const [mics, setMics]         = useState([])       // ['M1','M2',...]
  const [assignments, setAssignments] = useState({}) // { [moment_id]: { [mic]: member_id } }
  const [activeCell, setActiveCell] = useState(null) // { momentId, mic }
  const [newMicLabel, setNewMicLabel] = useState('')
  const [saving, setSaving]     = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load
  useEffect(() => {
    async function load() {
      const [showRes, songsRes, membersRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
      ])
      const s = showRes.data
      setShow(s)
      setMics(Array.isArray(s?.mics) ? s.mics : (s?.mics ? JSON.parse(s.mics) : []))
      setAssignments(s?.mic_assignments ? (typeof s.mic_assignments === 'string' ? JSON.parse(s.mic_assignments) : s.mic_assignments) : {})
      setMembers((membersRes.data ?? []).filter(m => m.active !== false))

      const songList = songsRes.data ?? []
      setSongs(songList)

      // Load moments for all songs
      if (songList.length > 0) {
        const { data: momentsData } = await supabase
          .from('moments').select('*')
          .in('song_id', songList.map(s => s.id))
          .order('order_index')
        const songMap = Object.fromEntries(songList.map(s => [s.id, s.title]))
        setAllMoments((momentsData ?? []).map(m => ({ ...m, song_title: songMap[m.song_id] ?? '' })))
      }
    }
    load()
  }, [showId])

  // Persist assignments + mics to show record
  async function persist(nextMics, nextAssignments) {
    setSaving(true)
    await supabase.from('shows').update({
      mics: JSON.stringify(nextMics),
      mic_assignments: JSON.stringify(nextAssignments),
    }).eq('id', showId)
    setSaving(false)
  }

  function assign(momentId, mic, memberId) {
    const next = {
      ...assignments,
      [momentId]: { ...(assignments[momentId] ?? {}), [mic]: memberId || null }
    }
    if (!memberId) delete next[momentId][mic]
    setAssignments(next)
    persist(mics, next)
  }

  function addMic() {
    const label = newMicLabel.trim()
    if (!label || mics.includes(label)) return
    const next = [...mics, label]
    setMics(next)
    setNewMicLabel('')
    persist(next, assignments)
  }

  function removeMic(mic) {
    const next = mics.filter(m => m !== mic)
    // Remove all assignments for this mic
    const nextA = Object.fromEntries(
      Object.entries(assignments).map(([mid, map]) => {
        const { [mic]: _, ...rest } = map
        return [mid, rest]
      })
    )
    setMics(next)
    setAssignments(nextA)
    persist(next, nextA)
  }

  // Group moments by song for column header display
  const momentsBySong = songs.map(s => ({
    song: s,
    moments: allMoments.filter(m => m.song_id === s.id),
  })).filter(g => g.moments.length > 0)

  // Detect handoffs: mic changes member between two consecutive moments (across all moments in order)
  function isHandoff(mic, momentIndex) {
    if (momentIndex === 0) return false
    const prev = allMoments[momentIndex - 1]
    const curr = allMoments[momentIndex]
    const prevMember = assignments[prev?.id]?.[mic]
    const currMember = assignments[curr?.id]?.[mic]
    return prevMember && currMember && prevMember !== currMember
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500'

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0">
            <Menu size={18} />
          </button>
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-300">Espectacles</Link>
            <span>/</span>
            <Link to={`/show/${showId}`} className="hover:text-gray-300">{show?.name ?? '…'}</Link>
            <span>/</span>
            <span className="text-gray-300 flex items-center gap-1"><Mic size={13} /> Micròfons</span>
          </nav>
          {saving && <span className="text-[10px] text-gray-600 ml-auto">Guardant…</span>}
        </div>

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {/* Sidebar backdrop (mobile) */}
          {sidebarOpen && (
            <div className="absolute inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar: mic config */}
          <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-56 lg:w-44 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col p-3 gap-3 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Micròfons</p>
              <div className="space-y-1">
                {mics.map(mic => (
                  <div key={mic} className="flex items-center gap-1.5">
                    <span className="flex-1 text-xs text-white font-medium">{mic}</span>
                    <button onClick={() => removeMic(mic)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={10} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <input value={newMicLabel} onChange={e => setNewMicLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMic()}
                  placeholder="M4…" className={inputCls + ' flex-1 min-w-0'} />
                <button onClick={addMic}
                  className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors shrink-0">
                  <Plus size={11} />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2">Llegenda handoff</p>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/60 shrink-0" />
                Canvi de persona
              </div>
            </div>
          </div>

          {/* Matrix */}
          <div className="flex-1 overflow-auto p-3">
            {mics.length === 0 && (
              <div className="text-gray-600 text-sm mt-8 text-center">Afegeix micròfons al panell esquerre per començar.</div>
            )}
            {mics.length > 0 && allMoments.length === 0 && (
              <div className="text-gray-600 text-sm mt-8 text-center">Crea moments a les cançons per poder assignar micros.</div>
            )}
            {mics.length > 0 && allMoments.length > 0 && (
              <table className="border-collapse text-xs" style={{ minWidth: allMoments.length * 100 }}>
                <thead>
                  {/* Song header row */}
                  <tr>
                    <th className="w-14 shrink-0 sticky left-0 bg-gray-950 z-10 border-b border-gray-800" />
                    {momentsBySong.map(({ song, moments }) => (
                      <th key={song.id}
                        colSpan={moments.length}
                        className="px-2 py-1 text-left text-[10px] text-gray-500 font-medium border-b border-gray-800 border-l border-gray-800 bg-gray-900">
                        <Link to={`/show/${showId}`} className="hover:text-gray-300 truncate block max-w-[200px]">{song.title}</Link>
                      </th>
                    ))}
                  </tr>
                  {/* Moment header row */}
                  <tr>
                    <th className="sticky left-0 bg-gray-950 z-10 border-b border-gray-800 text-[10px] text-gray-600 font-normal px-2 py-1 text-left">Micro</th>
                    {allMoments.map((m, idx) => (
                      <th key={m.id}
                        className="px-2 py-1 text-[10px] text-gray-400 font-normal border-b border-gray-800 border-l border-gray-800 whitespace-nowrap max-w-[110px]">
                        <div className="truncate">{m.title}</div>
                        {m.subtitle && <div className="text-[9px] text-gray-600 truncate">{m.subtitle}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mics.map(mic => (
                    <tr key={mic}>
                      <td className="sticky left-0 bg-gray-950 z-10 px-2 py-1 border-b border-gray-800 font-bold text-white text-xs">
                        {mic}
                      </td>
                      {allMoments.map((m, idx) => {
                        const memberId = assignments[m.id]?.[mic]
                        const member = memberId ? members.find(mb => mb.id === memberId) : null
                        const handoff = isHandoff(mic, idx)
                        const isActive = activeCell?.momentId === m.id && activeCell?.mic === mic
                        const c = member ? (VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra) : null

                        return (
                          <td key={m.id}
                            className={`border-b border-l border-gray-800 p-0 relative ${handoff ? 'bg-amber-500/10' : ''}`}
                            style={{ minWidth: 100 }}>
                            {isActive ? (
                              <select
                                autoFocus
                                value={memberId ?? ''}
                                onChange={e => { assign(m.id, mic, e.target.value); setActiveCell(null) }}
                                onBlur={() => setActiveCell(null)}
                                className="w-full h-full bg-gray-800 border border-blue-500 text-white text-xs px-1.5 py-1 focus:outline-none rounded-none">
                                <option value="">— ningú —</option>
                                {members.filter(mb => mb.role !== 'director').map(mb => (
                                  <option key={mb.id} value={mb.id}>{mb.name}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setActiveCell({ momentId: m.id, mic })}
                                className="w-full h-full text-left px-1.5 py-1.5 hover:bg-gray-800 transition-colors flex items-center gap-1 min-h-[32px]">
                                {handoff && (
                                  <ArrowRight size={9} className="text-amber-400 shrink-0" />
                                )}
                                {member ? (
                                  <>
                                    <span className="w-4 h-4 rounded-sm shrink-0 flex items-center justify-center text-[8px] font-bold"
                                      style={{ background: c.bg, color: c.fg }}>
                                      {memberInitials(member)}
                                    </span>
                                    <span className="text-gray-300 truncate text-[10px]">{member.name}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-700 text-[10px]">—</span>
                                )}
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
