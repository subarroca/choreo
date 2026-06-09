import { useState, useEffect } from 'react'
import { AtSign, Mail, Ruler, Calendar, UserPlus, ChevronDown, ChevronUp, Plus, X, Mic } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, ROLE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'

const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']
const ALL_VOICES = VOICE_ORDER
const ROLES = Object.keys(ROLE_LABELS)

// ─── Helpers ──────────────────────────────────────────────────
function calcAge(birth_date) {
  if (!birth_date) return null
  const b = new Date(birth_date), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}
function yearsInChoir(joined_at) {
  if (!joined_at) return null
  const y = new Date().getFullYear() - new Date(joined_at).getFullYear()
  return y < 1 ? 'menys d\'1 any' : `${y} any${y !== 1 ? 's' : ''}`
}
function deriveName(fn, ln) { return [fn, ln].filter(Boolean).join(' ') }
function deriveInitials(fn, ln) {
  return ((fn?.trim()[0] ?? '') + (ln?.trim()[0] ?? '')).toUpperCase() || '?'
}

// ─── Voice selector ───────────────────────────────────────────
function VoiceSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_VOICES.map(v => {
        const c = VOICE_COLORS[v]
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${value === v ? 'border-white ring-2 ring-white/20 scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}
            style={{ backgroundColor: c.bg, color: c.fg }}>
            {VOICE_LABELS[v]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Edit panel (vertical form) ───────────────────────────────
function EditPanel({ member, onSave, onCancel, onSetActive, onDelete, isNew }) {
  const [firstName, setFirstName] = useState(member?.first_name ?? (member?.name?.split(' ')[0] ?? ''))
  const [lastName,  setLastName]  = useState(member?.last_name  ?? (member?.name?.split(' ').slice(1).join(' ') ?? ''))
  const [initials,  setInitials]  = useState(member?.initials ?? '')
  const [voice,     setVoice]     = useState(member?.voice ?? 'soprano1')
  const [role,      setRole]      = useState(member?.role ?? 'choir')
  const [google,    setGoogle]    = useState(member?.google_account ?? '')
  const [instagram, setInstagram] = useState(member?.instagram ?? '')
  const [height,    setHeight]    = useState(member?.height ?? '')
  const [birthDate, setBirthDate] = useState(member?.birth_date ?? '')
  const [joinedAt,  setJoinedAt]  = useState(member?.joined_at ?? '')

  const autoInitials = deriveInitials(firstName, lastName)
  const isInactive = member?.active === false

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      name: deriveName(firstName, lastName),
      initials: (initials.trim().toUpperCase().slice(0, 3) || autoInitials),
      voice, role,
      google_account: google.trim(),
      instagram: instagram.trim().replace(/^@/, ''),
      height: height ? parseInt(height) : null,
      birth_date: birthDate || null,
      joined_at:  joinedAt  || null,
    })
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600'
  const labelCls = 'text-xs text-gray-500 mb-1 block'

  const c = VOICE_COLORS[voice] ?? VOICE_COLORS.extra
  const displayInitials = (initials.trim().toUpperCase() || autoInitials).slice(0, 3)

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: c.bg, color: c.fg }}>
            {displayInitials}
          </span>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">
              {deriveName(firstName, lastName) || 'Nou membre'}
            </div>
            {isInactive && <span className="text-[10px] text-yellow-600 font-medium">De baixa</span>}
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        <div className="space-y-1">
          <label className={labelCls}>Nom *</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} required
            placeholder="Anna" className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Cognoms *</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} required
            placeholder="Soler García" className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Inicials al canvas</label>
          <input value={initials || autoInitials} onChange={e => setInitials(e.target.value.slice(0, 3))}
            placeholder={autoInitials} className={inputCls + ' uppercase'} />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Rol</label>
          <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {role === 'choir' && (
          <div className="space-y-1.5">
            <label className={labelCls}>Corda / veu *</label>
            <VoiceSelector value={voice} onChange={setVoice} />
          </div>
        )}

        <div className="border-t border-gray-800 pt-4 space-y-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Contacte</p>

          <div className="space-y-1">
            <label className={labelCls + ' flex items-center gap-1'}><Mail size={10} /> Google</label>
            <input value={google} onChange={e => setGoogle(e.target.value)} type="email"
              placeholder="nom@gmail.com" className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className={labelCls + ' flex items-center gap-1'}><AtSign size={10} /> Instagram</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)}
              placeholder="handle (sense @)" className={inputCls} />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 space-y-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Dades personals</p>

          <div className="space-y-1">
            <label className={labelCls + ' flex items-center gap-1'}><Ruler size={10} /> Alçada (cm)</label>
            <input value={height} onChange={e => setHeight(e.target.value)} type="number"
              min="100" max="220" placeholder="170" className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className={labelCls + ' flex items-center gap-1'}><Calendar size={10} /> Data de naixement</label>
            <input value={birthDate} onChange={e => setBirthDate(e.target.value)} type="date"
              className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className={labelCls + ' flex items-center gap-1'}><UserPlus size={10} /> Entrada al cor</label>
            <input value={joinedAt} onChange={e => setJoinedAt(e.target.value)} type="date"
              className={inputCls} />
          </div>
        </div>

        {/* Save */}
        <div className="pt-2 pb-4">
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            {isNew ? 'Crear persona' : 'Guardar canvis'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      {!isNew && (
        <div className="border-t border-gray-800 px-5 py-3 shrink-0 flex gap-2">
          {isInactive ? (
            <button onClick={() => onSetActive(member.id, true)}
              className="flex-1 text-xs text-green-600 hover:text-green-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              Reactivar
            </button>
          ) : (
            <button onClick={() => onSetActive(member.id, false)}
              className="flex-1 text-xs text-yellow-600 hover:text-yellow-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              Donar de baixa
            </button>
          )}
          <button onClick={() => onDelete(member.id)}
            className="flex-1 text-xs text-red-800 hover:text-red-500 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)   // member id or 'new'
  const [showInactive, setShowInactive] = useState(false)
  const [filterVoice, setFilterVoice] = useState('')

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
      setSelected(data.id)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (!error) setMembers(prev => prev.map(m => m.id === id ? data : m)
      .sort((a, b) => ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca')))
  }

  async function handleSetActive(id, active) {
    const { data, error } = await supabase.from('members').update({ active }).eq('id', id).select().single()
    if (!error) setMembers(prev => prev.map(m => m.id === id ? data : m))
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar definitivament aquesta persona?')) return
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    setSelected(null)
  }

  const activeMembers   = members.filter(m => m.active !== false)
  const inactiveMembers = members.filter(m => m.active === false)
  const voiceCounts = ALL_VOICES.reduce((acc, v) => {
    acc[v] = activeMembers.filter(m => m.voice === v).length; return acc
  }, {})

  const listMembers = filterVoice
    ? activeMembers.filter(m => m.voice === filterVoice)
    : activeMembers

  const selectedMember = selected === 'new' ? null : members.find(m => m.id === selected)
  const panelOpen = selected !== null

  return (
    <Layout fullWidth>
      <div className="flex h-[calc(100vh-57px)]">

        {/* ── Left: list ── */}
        <div className="flex flex-col min-w-0 flex-1 border-r border-gray-800">

          {/* List header */}
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-semibold text-white">Persones</h1>
                <p className="text-xs text-gray-500">
                  {activeMembers.length} actius
                  {inactiveMembers.length > 0 && <span className="ml-2 text-yellow-700">· {inactiveMembers.length} de baixa</span>}
                </p>
              </div>
              <button onClick={() => setSelected('new')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={12} /> Afegir
              </button>
            </div>
            {/* Voice filter */}
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterVoice('')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] border transition-colors ${!filterVoice ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-500 hover:text-white'}`}>
                Totes
              </button>
              {ALL_VOICES.filter(v => voiceCounts[v] > 0).map(v => {
                const c = VOICE_COLORS[v]
                return (
                  <button key={v} onClick={() => setFilterVoice(filterVoice === v ? '' : v)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] border transition-all"
                    style={filterVoice === v
                      ? { backgroundColor: c.bg, color: c.fg, borderColor: c.bg }
                      : { backgroundColor: c.bg + '22', color: c.bg, borderColor: c.bg + '55' }}>
                    {VOICE_LABELS[v]} {voiceCounts[v]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 text-sm p-4">Carregant...</p>
            ) : listMembers.length === 0 && !loading ? (
              <div className="text-center py-16 text-gray-600">
                <Mic size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cap persona aquí.</p>
              </div>
            ) : (
              listMembers.map(m => {
                const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                const isSelected = selected === m.id
                const age = calcAge(m.birth_date)
                return (
                  <button key={m.id} onClick={() => setSelected(isSelected ? null : m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-800/60 ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: c.bg, color: c.fg }}>
                      {(m.initials || deriveInitials(m.first_name, m.last_name)).slice(0, 3)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {m.first_name} <span className="font-semibold">{m.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium" style={{ color: c.bg }}>
                          {VOICE_LABELS[m.voice]}
                        </span>
                        {age != null && <span className="text-[10px] text-gray-600">{age} a.</span>}
                        {m.height && <span className="text-[10px] text-gray-600">{m.height} cm</span>}
                      </div>
                    </div>
                    {isSelected && <div className="w-1 h-6 rounded-full bg-blue-500 shrink-0" />}
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
                  const isSelected = selected === m.id
                  return (
                    <button key={m.id} onClick={() => setSelected(isSelected ? null : m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-800/60 opacity-50 ${isSelected ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: c.bg, color: c.fg }}>
                        {(m.initials || deriveInitials(m.first_name, m.last_name)).slice(0, 3)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate line-through">
                          {m.first_name} <span className="font-semibold">{m.last_name}</span>
                        </div>
                        <div className="text-[10px] text-yellow-700">De baixa</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: edit panel ── */}
        {panelOpen && (
          <div className="flex-1 bg-gray-950 flex flex-col overflow-hidden border-l border-gray-800">
            <EditPanel
              key={selected}
              member={selectedMember}
              isNew={selected === 'new'}
              onSave={fields => selected === 'new' ? handleCreate(fields) : handleUpdate(selected, fields)}
              onCancel={() => setSelected(null)}
              onSetActive={handleSetActive}
              onDelete={handleDelete} />
          </div>
        )}

        {/* Empty state when nothing selected */}
        {!panelOpen && !loading && activeMembers.length > 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-700 text-sm select-none border-l border-gray-800">
            Clica una persona per editar
          </div>
        )}
      </div>
    </Layout>
  )
}
