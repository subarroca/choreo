import { useState, useEffect } from 'react'
import { Shield, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { key: 'shows',      label: 'Espectacles' },
  { key: 'members',    label: 'Membres' },
  { key: 'repertoire', label: 'Repertori' },
]

function PermToggle({ active, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
        active
          ? 'bg-blue-900/30 border-blue-700 text-blue-400'
          : 'bg-gray-800 border-gray-700 text-gray-600 hover:text-gray-400'
      }`}>
      {active ? <Check size={11} /> : <X size={11} />}
      {label}
    </button>
  )
}

export default function Admin() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers]   = useState([])
  const [perms, setPerms]   = useState({})   // { userId: { shows: {view,edit}, … } }
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  // Guard: only admins
  useEffect(() => {
    if (role && role !== 'admin' && role !== 'director') navigate('/')
  }, [role])

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name, email, role').order('full_name')
      const { data: permRows } = await supabase.from('user_permissions').select('*')

      const permMap = {}
      for (const p of profiles ?? []) {
        permMap[p.id] = {
          shows:      { view: true,  edit: false },
          members:    { view: false, edit: false },
          repertoire: { view: true,  edit: false },
        }
      }
      for (const r of permRows ?? []) {
        if (permMap[r.user_id]?.[r.section]) {
          permMap[r.user_id][r.section] = { view: r.can_view, edit: r.can_edit }
        }
      }
      setUsers(profiles ?? [])
      setPerms(permMap)
      setLoading(false)
    }
    load()
  }, [])

  async function togglePerm(userId, section, field, value) {
    // Optimistic update
    setPerms(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [section]: { ...prev[userId][section], [field]: value }
      }
    }))

    const current = perms[userId]?.[section] ?? { view: true, edit: false }
    const updated = { ...current, [field]: value }

    await supabase.from('user_permissions').upsert({
      user_id: userId,
      section,
      can_view: updated.view,
      can_edit: updated.edit,
    }, { onConflict: 'user_id,section' })
  }

  const ROLE_BADGE = {
    admin:    'bg-red-900/40 text-red-400 border-red-800',
    director: 'bg-purple-900/40 text-purple-400 border-purple-800',
    member:   'bg-gray-800 text-gray-500 border-gray-700',
  }

  return (
    <Layout narrow>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Gestió d'usuaris</h1>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Carregant...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-sm">Cap usuari registrat.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const isAdmin = u.role === 'admin' || u.role === 'director'
              const isOpen  = expanded === u.id
              const uPerms  = perms[u.id] ?? {}
              return (
                <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{u.full_name || u.email}</p>
                      {u.full_name && <p className="text-xs text-gray-500 truncate">{u.email}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.member}`}>
                      {u.role ?? 'member'}
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-600 shrink-0" /> : <ChevronDown size={14} className="text-gray-600 shrink-0" />}
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-800 px-4 py-3 bg-black/20">
                      {isAdmin ? (
                        <p className="text-xs text-gray-500 italic">Accés total (rol {u.role}). Els permisos no s'apliquen.</p>
                      ) : (
                        <div className="space-y-3">
                          {SECTIONS.map(s => (
                            <div key={s.key} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-24 shrink-0">{s.label}</span>
                              <div className="flex gap-2">
                                <PermToggle
                                  active={uPerms[s.key]?.view ?? true}
                                  onChange={v => togglePerm(u.id, s.key, 'view', v)}
                                  label="Veure" />
                                <PermToggle
                                  active={uPerms[s.key]?.edit ?? false}
                                  onChange={v => togglePerm(u.id, s.key, 'edit', v)}
                                  label="Editar" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
