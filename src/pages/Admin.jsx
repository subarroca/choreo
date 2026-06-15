import { useState, useEffect } from 'react'
import { Shield, Check, X, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import { useNavigate } from 'react-router-dom'
import { ICON } from '../lib/ui'
import { SECTIONS, SECTION_KEYS, ROLE_TEMPLATES, TEMPLATE_KEYS, defaultPermissions } from '../lib/roles.js'

const ROLE_BADGE = {
  admin:    'bg-red-900/40 text-red-400 border-red-800',
  director: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
  member:   'bg-fill text-faint border-line',
}

function PermToggle({ active, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg border transition-colors ${
        active
          ? 'bg-cyan-900/30 border-cyan-700 text-cyan-400'
          : 'bg-fill border-line text-ghost hover:text-muted'
      }`}>
      {active ? <Check size={ICON.xs + 1} /> : <X size={ICON.xs + 1} />}
      {label}
    </button>
  )
}

const SIM_PRESETS = ['choreographer', 'lighting', 'sound', 'member']

function SimulationPanel() {
  const { isSimulating, simulatedPermissions, setSimulatedPermissions, exitSimulation } = useAuth()
  function setTemplate(key) {
    const tpl = ROLE_TEMPLATES[key]?.perms
    if (tpl) setSimulatedPermissions(structuredClone(tpl))
  }
  return (
    <div className={`rounded-xl border p-4 mb-6 ${isSimulating ? 'border-amber-700/60 bg-amber-900/20' : 'border-rim bg-fill/30'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye size={ICON.sm} className={isSimulating ? 'text-amber-400' : 'text-muted'} />
          <span className="text-sm font-semibold text-body">Simular vista com a…</span>
        </div>
        {isSimulating && (
          <button onClick={exitSimulation}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            <EyeOff size={11} /> Sortir de simulació
          </button>
        )}
      </div>
      <p className="text-xs text-faint mb-3">Previsualitza l'aplicació des del punt de vista d'un altre rol sense canviar permisos reals.</p>
      <div className="flex flex-wrap gap-2">
        {SIM_PRESETS.map(k => (
          <button key={k} onClick={() => setTemplate(k)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isSimulating ? 'border-amber-700/60 text-amber-300 hover:bg-amber-900/30' : 'border-line text-muted hover:text-cyan-400 hover:border-cyan-700'
            }`}>
            {ROLE_TEMPLATES[k].label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers]     = useState([])
  const [perms, setPerms]     = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

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
        // seed with the member baseline so every section has a toggle
        permMap[p.id] = structuredClone(defaultPermissions('member'))
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
    setPerms(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [section]: { ...prev[userId][section], [field]: value } }
    }))
    const current = perms[userId]?.[section] ?? { view: true, edit: false }
    const updated = { ...current, [field]: value }
    await supabase.from('user_permissions').upsert(
      { user_id: userId, section, can_view: updated.view, can_edit: updated.edit },
      { onConflict: 'user_id,section' }
    )
  }

  // Apply a role template: fills every section, but stays editable afterwards.
  async function applyTemplate(userId, templateKey) {
    const tpl = ROLE_TEMPLATES[templateKey]?.perms
    if (!tpl) return
    const next = structuredClone(tpl)
    setPerms(prev => ({ ...prev, [userId]: next }))
    await supabase.from('user_permissions').upsert(
      SECTION_KEYS.map(section => ({
        user_id: userId, section,
        can_view: next[section].view, can_edit: next[section].edit,
      })),
      { onConflict: 'user_id,section' }
    )
  }

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader title="Gestió d'usuaris" icon={Shield} subtitle="Gestiona els rols i permisos dels membres de l'aplicació" />
        }
      >
        <SimulationPanel />
        {loading ? (
          <p className="text-faint text-sm py-8">Carregant...</p>
        ) : users.length === 0 ? (
          <EmptyState icon={Shield} title="Cap usuari registrat." />
        ) : (
          <div className="divide-y divide-rim">
            {users.map(u => {
              const isAdmin = u.role === 'admin' || u.role === 'director'
              const isOpen  = expanded === u.id
              const uPerms  = perms[u.id] ?? {}

              return (
                <div key={u.id}>
                  <ListRow
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    title={u.full_name || u.email}
                    meta={u.full_name ? u.email : null}
                    trailing={
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.member}`}>
                          {u.role ?? 'member'}
                        </span>
                        {isOpen
                          ? <ChevronUp size={ICON.sm} className="text-ghost" />
                          : <ChevronDown size={ICON.sm} className="text-ghost" />}
                      </div>
                    }
                  />

                  {isOpen && (
                    <div className="px-3 py-3 bg-fill/30 border-t border-rim">
                      {isAdmin ? (
                        <p className="text-xs text-faint italic">Accés total (rol {u.role}). Els permisos no s'apliquen.</p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap pb-2 mb-1 border-b border-rim">
                            <span className="text-xs text-faint w-24 shrink-0">Plantilla</span>
                            {TEMPLATE_KEYS.filter(k => k !== 'admin' && k !== 'director').map(k => (
                              <button key={k} type="button"
                                onClick={() => applyTemplate(u.id, k)}
                                className="text-xs px-2.5 py-1 rounded-lg border border-line text-muted hover:text-cyan-400 hover:border-cyan-700 transition-colors">
                                {ROLE_TEMPLATES[k].label}
                              </button>
                            ))}
                          </div>
                          {SECTIONS.map(s => (
                            <div key={s.key} className="flex items-center gap-3">
                              <span className="text-xs text-muted w-24 shrink-0">{s.label}</span>
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
      </PageContainer>
    </Layout>
  )
}
