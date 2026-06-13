import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { X, Plus, ArrowRight, Menu } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS } from '../lib/constants'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'
import Button from '../components/ui/Button'
import { ICON } from '../lib/ui'

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
    // Auto-assign next number if no label given
    const label = newMicLabel.trim() || String(mics.length + 1)
    if (mics.includes(label)) return
    const next = [...mics, label]
    setMics(next)
    setNewMicLabel('')
    persist(next, assignments)
  }

  function displayMic(mic) {
    // Show just the number: strip leading M/m prefix for legacy labels
    return mic.replace(/^[Mm]/, '')
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

  const inputCls = 'bg-fill border border-line rounded-lg px-2 py-1 text-xs text-body focus:outline-none focus:border-cyan-300'

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-2.5 text-muted hover:text-body hover:bg-fill transition-colors shrink-0 self-stretch flex items-center border-b border-rim bg-pane">
            <Menu size={18} />
          </button>
          <div className="flex-1 min-w-0 flex items-center">
            <ShowToolbar showId={showId} showName={show?.name} />
            {saving && <span className="text-xs text-ghost pr-4 bg-pane border-b border-rim py-2.5 shrink-0">Guardant…</span>}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {/* Sidebar backdrop (mobile) */}
          {sidebarOpen && (
            <div className="absolute inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar: mic config */}
          <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-56 lg:w-44 shrink-0 border-r border-rim bg-page flex flex-col p-3 gap-3 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div>
              <p className="text-xs text-faint uppercase tracking-wider font-medium mb-2">Micròfons</p>
              <div className="space-y-1">
                {mics.map(mic => (
                  <div key={mic} className="flex items-center gap-1.5">
                    <span className="flex-1 text-xs text-body font-medium">{mic}</span>
                    <button onClick={() => removeMic(mic)} className="text-ghost hover:text-red-400 transition-colors p-2 -my-1.5 -mr-1"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <input value={newMicLabel} onChange={e => setNewMicLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMic()}
                  placeholder={String(mics.length + 1)} className={inputCls + ' flex-1 min-w-0'} />
                <Button onClick={addMic} className="w-9 h-9 !p-0 shrink-0">
                  <Plus size={ICON.md} />
                </Button>
              </div>
            </div>

            <div className="border-t border-rim pt-3">
              <p className="text-xs text-faint uppercase tracking-wider font-medium mb-2">Llegenda handoff</p>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/60 shrink-0" />
                Canvi de persona
              </div>
            </div>
          </div>

          {/* Matrix — moments as rows, mics as columns */}
          <div className="flex-1 overflow-auto p-3">
            {mics.length === 0 && (
              <div className="text-ghost text-sm mt-8 text-center">Afegeix micròfons al panell esquerre per començar.</div>
            )}
            {mics.length > 0 && allMoments.length === 0 && (
              <div className="text-ghost text-sm mt-8 text-center">Crea moments a les cançons per poder assignar micros.</div>
            )}
            {mics.length > 0 && allMoments.length > 0 && (
              <table className="border-collapse text-xs w-full">
                <thead>
                  <tr>
                    {/* Moment label col + song span cols */}
                    <th className="sticky left-0 bg-page z-10 border-b border-rim text-xs text-ghost font-normal px-3 py-2 text-left min-w-[160px]">Moment</th>
                    {mics.map((mic, i) => (
                      <th key={mic}
                        className="px-3 py-2 text-center text-sm font-bold text-body border-b border-l border-rim min-w-[120px]">
                        {displayMic(mic)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {momentsBySong.map(({ song, moments: songMoments }) => (
                    <>
                      {/* Song separator row */}
                      <tr key={`song-${song.id}`}>
                        <td colSpan={mics.length + 1}
                          className="px-3 py-1.5 bg-pane border-b border-rim text-xs text-faint font-medium">
                          <Link to={`/show/${showId}`} className="hover:text-soft">{song.title}</Link>
                        </td>
                      </tr>
                      {songMoments.map((m, idx) => {
                        const globalIdx = allMoments.findIndex(am => am.id === m.id)
                        return (
                          <tr key={m.id} className="hover:bg-pane/40 transition-colors">
                            <td className="sticky left-0 bg-page z-10 px-3 py-2 border-b border-rim text-soft text-xs">
                              <div className="font-medium">{m.title}</div>
                              {m.subtitle && <div className="text-ghost">{m.subtitle}</div>}
                            </td>
                            {mics.map((mic) => {
                              const memberId = assignments[m.id]?.[mic]
                              const member = memberId ? members.find(mb => mb.id === memberId) : null
                              const handoff = isHandoff(mic, globalIdx)
                              const isActive = activeCell?.momentId === m.id && activeCell?.mic === mic
                              const c = member ? (VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra) : null

                              return (
                                <td key={mic}
                                  className={`border-b border-l border-rim p-0 ${handoff ? 'bg-amber-500/10' : ''}`}
                                  style={{ minWidth: 120 }}>
                                  {isActive ? (
                                    <select
                                      autoFocus
                                      value={memberId ?? ''}
                                      onChange={e => { assign(m.id, mic, e.target.value); setActiveCell(null) }}
                                      onBlur={() => setActiveCell(null)}
                                      className="w-full h-full bg-fill border border-cyan-300 text-body text-xs px-2 py-2 focus:outline-none rounded-none">
                                      <option value="">— ningú —</option>
                                      {members.filter(mb => mb.role !== 'director').map(mb => (
                                        <option key={mb.id} value={mb.id}>{mb.name || [mb.first_name, mb.last_name].filter(Boolean).join(' ')}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <button
                                      onClick={() => setActiveCell({ momentId: m.id, mic })}
                                      className="w-full h-full text-left px-2 py-2 hover:bg-fill transition-colors flex items-center gap-1.5 min-h-[40px]">
                                      {handoff && <ArrowRight size={9} className="text-amber-400 shrink-0" />}
                                      {member ? (
                                        <>
                                          <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                                            style={{ background: c.bg, color: c.fg }}>
                                            {memberInitials(member)}
                                          </span>
                                          <span className="text-soft truncate text-xs">{member.name || [member.first_name, member.last_name].filter(Boolean).join(' ')}</span>
                                        </>
                                      ) : (
                                        <span className="text-gray-700 text-xs">—</span>
                                      )}
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </>
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
