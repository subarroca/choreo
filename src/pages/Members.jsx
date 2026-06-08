import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, ROLE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'

const ALL_VOICES = Object.keys(VOICE_LABELS)
const ROLES = Object.keys(ROLE_LABELS)

function VoiceSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_VOICES.map(v => {
        const c = VOICE_COLORS[v]
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${value === v ? 'border-white ring-2 ring-white/20 scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}
            style={{ backgroundColor: c.bg, color: c.fg }}
          >{VOICE_LABELS[v]}</button>
        )
      })}
    </div>
  )
}

function MemberForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [initials, setInitials] = useState(initial?.initials ?? '')
  const [voice, setVoice] = useState(initial?.voice ?? 'soprano1')
  const [role, setRole] = useState(initial?.role ?? 'choir')

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ name, initials: initials.toUpperCase().slice(0, 3), voice, role }) }} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs text-gray-400">Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Anna Garcia"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Inicials (max 3)</label>
          <input value={initials} onChange={e => setInitials(e.target.value.slice(0, 3))} placeholder="AG"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Rol</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400">Corda / veu</label>
        <VoiceSelector value={voice} onChange={setVoice} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Guardar</button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Cancel·lar</button>
      </div>
    </form>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    supabase.from('members').select('*').order('name')
      .then(({ data }) => { setMembers(data ?? []); setLoading(false) })
  }, [])

  async function handleCreate(fields) {
    const { data, error } = await supabase.from('members').insert(fields).select().single()
    if (!error) { setMembers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); setCreating(false) }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (!error) { setMembers(prev => prev.map(m => m.id === id ? data : m).sort((a, b) => a.name.localeCompare(b.name))); setEditingId(null) }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar aquest membre del cor?')) return
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const grouped = ALL_VOICES.reduce((acc, v) => {
    const list = members.filter(m => m.voice === v)
    if (list.length) acc[v] = list
    return acc
  }, {})

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-300">Espectacles</Link>
              <span>/</span>
              <span className="text-gray-300">Membres del cor</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Membres del cor</h1>
            <p className="text-sm text-gray-500 mt-0.5">Llista global — s'activen/desactiven per espectacle des del setlist</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              + Afegir membre
            </button>
          )}
        </div>

        {creating && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nou membre</h3>
            <MemberForm onSave={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {loading ? <p className="text-gray-500">Carregant...</p> : members.length === 0 && !creating ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🎤</p>
            <p>El cor no té membres encara.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Voice summary chips */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(grouped).map(([v, list]) => {
                const c = VOICE_COLORS[v]
                return (
                  <span key={v} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: c.bg + '33', color: c.fg === '#fff' ? c.bg : c.fg, border: `1px solid ${c.bg}66` }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.bg }} />
                    {VOICE_LABELS[v]} · {list.length}
                  </span>
                )
              })}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-400 border border-gray-700">
                Total · {members.length}
              </span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 w-10">#</th>
                    <th className="text-left px-4 py-3">Nom</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Corda</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Rol</th>
                    <th className="text-right px-4 py-3">Accions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {members.map((member, i) => {
                    const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
                    return (
                      <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                        {editingId === member.id ? (
                          <td colSpan={5} className="px-4 py-3">
                            <MemberForm initial={member}
                              onSave={fields => handleUpdate(member.id, fields)}
                              onCancel={() => setEditingId(null)} />
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-600 text-xs">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: c.bg, color: c.fg }}>
                                  {member.initials || member.name.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="text-white font-medium">{member.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: c.bg + '33', color: c.fg === '#fff' ? '#ddd' : c.fg }}>
                                {VOICE_LABELS[member.voice] ?? member.voice}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                              {ROLE_LABELS[member.role] ?? member.role}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditingId(member.id)}
                                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors">Editar</button>
                                <button onClick={() => handleDelete(member.id)}
                                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-gray-700 transition-colors">×</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
