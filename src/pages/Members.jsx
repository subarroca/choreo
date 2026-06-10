import { useState, useEffect } from 'react'
import { Mic, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import PersonProfileOverlay from '../components/PersonProfileOverlay'

const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']
const ALL_VOICES = VOICE_ORDER

// ─── Helpers ──────────────────────────────────────────────────
function calcAge(birth_date) {
  if (!birth_date) return null
  const b = new Date(birth_date), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}
function deriveInitials(fn, ln) {
  return ((fn?.trim()[0] ?? '') + (ln?.trim()[0] ?? '')).toUpperCase() || '?'
}

// ─── Main page ────────────────────────────────────────────────
export default function Members() {
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [filterVoice, setFilterVoice] = useState('')
  const [search, setSearch]           = useState('')
  const [overlayMember, setOverlayMember] = useState(null)   // member obj or 'new'

  useEffect(() => {
    supabase.from('members').select('*').order('last_name').order('first_name')
      .then(({ data }) => {
        const sorted = (data ?? []).sort((a, b) =>
          ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca'))
        setMembers(sorted); setLoading(false)
      })
  }, [])

  async function handleCreate(fields) {
    const { data, error } = await supabase.from('members').insert({ active: true, ...fields }).select().single()
    if (!error) {
      setMembers(prev => [...prev, data].sort((a, b) =>
        ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca')))
      setOverlayMember(data)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? data : m)
        .sort((a, b) => ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca')))
      setOverlayMember(data)
    }
  }

  async function handleSetActive(id, active) {
    const { data, error } = await supabase.from('members').update({ active }).eq('id', id).select().single()
    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? data : m))
      setOverlayMember(data)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar definitivament aquesta persona?')) return
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    setOverlayMember(null)
  }

  const activeMembers   = members.filter(m => m.active !== false)
  const inactiveMembers = members.filter(m => m.active === false)
  const voiceCounts = ALL_VOICES.reduce((acc, v) => {
    acc[v] = activeMembers.filter(m => m.voice === v).length; return acc
  }, {})
  const searchLower = search.toLowerCase()
  const listMembers = activeMembers.filter(m =>
    (!filterVoice || m.voice === filterVoice) &&
    (!search || m.name?.toLowerCase().includes(searchLower) ||
      m.first_name?.toLowerCase().includes(searchLower) ||
      m.last_name?.toLowerCase().includes(searchLower))
  )

  const isNew = overlayMember === 'new'
  const overlayData = isNew ? null : overlayMember

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">

        {/* ── Header ── */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca per nom…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={() => setOverlayMember('new')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
              <Plus size={14} /> Afegir
            </button>
          </div>

          {/* Voice filter */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFilterVoice('')}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${!filterVoice ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-500 hover:text-white'}`}>
              Totes <span className="text-gray-600 ml-1">{activeMembers.length}</span>
            </button>
            {ALL_VOICES.filter(v => voiceCounts[v] > 0).map(v => {
              const c = VOICE_COLORS[v]
              return (
                <button key={v} onClick={() => setFilterVoice(filterVoice === v ? '' : v)}
                  className="px-3 py-1 rounded-full text-xs border transition-all font-medium"
                  style={filterVoice === v
                    ? { backgroundColor: c.bg, color: c.fg, borderColor: c.bg }
                    : { backgroundColor: c.bg + '22', color: c.bg, borderColor: c.bg + '55' }}>
                  {VOICE_LABELS[v]} <span className="opacity-70 ml-0.5">{voiceCounts[v]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-sm p-4">Carregant...</p>
          ) : listMembers.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Mic size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Cap persona aquí.</p>
            </div>
          ) : (
            listMembers.map(m => {
              const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
              const age = calcAge(m.birth_date)
              return (
                <button key={m.id} onClick={() => setOverlayMember(m)}
                  className="w-full flex items-center gap-3 pl-0 pr-4 py-2.5 text-left transition-colors border-b border-gray-800/60 hover:bg-gray-900">
                  <span className="w-1 self-stretch rounded-r-full shrink-0" style={{ backgroundColor: c.bg }} />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: c.bg, color: c.fg }}>
                    {(m.initials || deriveInitials(m.first_name, m.last_name)).slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {m.first_name} <span className="font-semibold">{m.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium" style={{ color: c.bg }}>
                        {VOICE_LABELS[m.voice]}
                      </span>
                      {age != null && <span className="text-xs text-gray-600">{age} a.</span>}
                      {m.height && <span className="text-xs text-gray-600">{m.height} cm</span>}
                    </div>
                  </div>
                </button>
              )
            })
          )}

          {/* Inactive section */}
          {inactiveMembers.length > 0 && (
            <div className="border-t border-gray-800 mt-1">
              <button onClick={() => setShowInactive(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-yellow-700 hover:text-yellow-500 transition-colors">
                {showInactive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                De baixa ({inactiveMembers.length})
              </button>
              {showInactive && inactiveMembers.map(m => {
                const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                return (
                  <button key={m.id} onClick={() => setOverlayMember(m)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-800/60 opacity-50 hover:bg-gray-900">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: c.bg, color: c.fg }}>
                      {(m.initials || deriveInitials(m.first_name, m.last_name)).slice(0, 3)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate line-through">
                        {m.first_name} <span className="font-semibold">{m.last_name}</span>
                      </div>
                      <div className="text-xs text-yellow-700">De baixa</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Overlay ── */}
      {overlayMember && (
        <PersonProfileOverlay
          member={overlayData}
          isNew={isNew}
          onClose={() => setOverlayMember(null)}
          onSave={fields => isNew ? handleCreate(fields) : handleUpdate(overlayData.id, fields)}
          onSetActive={isNew ? null : handleSetActive}
          onDelete={isNew ? null : handleDelete} />
      )}
    </Layout>
  )
}
