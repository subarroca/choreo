import { useState, useEffect } from 'react'
import { Shield, Check, X, ChevronDown, ChevronUp, Eye, EyeOff, LayoutGrid, List, Play } from '../lib/icons'
import PermissionsMatrix from '../components/admin/PermissionsMatrix.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { useNavigate } from 'react-router-dom'
import { ICON } from '../lib/ui'
import { SECTIONS, SECTION_KEYS, ROLE_TEMPLATES, TEMPLATE_KEYS, defaultPermissions } from '../lib/roles.js'
import { VOICE_LABELS, VOICE_ORDER, VOICE_COLORS } from '../lib/constants.js'

const ROLE_BADGE = {
  admin:    'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800',
  director: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800',
  member:   'bg-fill text-faint border-line',
}

function PermToggle({ active, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg border transition-colors ${
        active
          ? 'bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-400'
          : 'bg-fill border-line text-ghost hover:text-muted'
      }`}>
      {active ? <Check size={ICON.xs + 1} /> : <X size={ICON.xs + 1} />}
      {label}
    </button>
  )
}

const SIM_PRESETS = ['choreographer', 'lighting', 'sound', 'cap_de_corda', 'member']

function SimulationPanel({ users, perms }) {
  const { isSimulating, setSimulatedPermissions, exitSimulation } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState('')

  function setTemplate(key) {
    const tpl = ROLE_TEMPLATES[key]?.perms
    if (tpl) { setSimulatedPermissions(structuredClone(tpl)); setSelectedUserId('') }
  }

  function simulateUser(userId) {
    const p = perms[userId]
    if (p) { setSimulatedPermissions(structuredClone(p)); setSelectedUserId(userId) }
  }

  const simCls = isSimulating
    ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20'
    : 'border-rim bg-fill/30'
  const btnCls = isSimulating
    ? 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700/60 dark:text-amber-300 dark:hover:bg-amber-900/30'
    : 'border-line text-muted hover:text-cyan-400 hover:border-cyan-700'

  const members = (users ?? []).filter(u => u.role !== 'admin' && u.role !== 'director')

  return (
    <div className={`rounded-xl border p-4 mb-6 ${simCls}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Eye size={ICON.sm} className={isSimulating ? 'text-amber-600 dark:text-amber-400' : 'text-muted'} />
          <span className="text-sm font-semibold text-body">Simular vista com a…</span>
        </div>
        {isSimulating && (
          <button onClick={() => { exitSimulation(); setSelectedUserId('') }}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
            <EyeOff size={11} /> Sortir de simulació
          </button>
        )}
      </div>
      <p className="text-xs text-faint mb-3">Previsualitza l'aplicació des del punt de vista d'un altre usuari sense canviar permisos reals.</p>

      <div className="space-y-3">
        {/* Per rol */}
        <div>
          <p className="text-xs text-ghost mb-1.5">Per rol</p>
          <div className="flex flex-wrap gap-2">
            {SIM_PRESETS.map(k => (
              <button key={k} onClick={() => setTemplate(k)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${btnCls}`}>
                {ROLE_TEMPLATES[k].label}
              </button>
            ))}
          </div>
        </div>

        {/* Per usuari concret */}
        {members.length > 0 && (
          <div>
            <p className="text-xs text-ghost mb-1.5">Per usuari concret</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="flex-1 bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500">
                <option value="">— Selecciona un usuari —</option>
                {members.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
              <button
                onClick={() => selectedUserId && simulateUser(selectedUserId)}
                disabled={!selectedUserId}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-line text-muted hover:text-cyan-400 hover:border-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Play size={13} /> Simula
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const { role, setSimulatedPermissions } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers]     = useState([])
  const [perms, setPerms]     = useState({})
  const [voiceSections, setVoiceSections] = useState({})
  const [voices, setVoices] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [view, setView] = useState('list')

  useEffect(() => {
    if (role && role !== 'admin' && role !== 'director') navigate('/')
  }, [role])

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name, email, role, voice_sections, voice').order('full_name')
      const { data: permRows } = await supabase.from('user_permissions').select('*')
      const permMap = {}
      const voiceMap = {}
      const voicesMap = {}
      for (const p of profiles ?? []) {
        permMap[p.id] = structuredClone(defaultPermissions('member'))
        voiceMap[p.id] = p.voice_sections ?? []
        voicesMap[p.id] = p.voice ?? ''
      }
      for (const r of permRows ?? []) {
        if (permMap[r.user_id]?.[r.section]) {
          permMap[r.user_id][r.section] = { view: r.can_view, edit: r.can_edit }
        }
      }
      setUsers(profiles ?? [])
      setPerms(permMap)
      setVoiceSections(voiceMap)
      setVoices(voicesMap)
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

  async function toggleVoiceSection(userId, voice) {
    const current = voiceSections[userId] ?? []
    const next = current.includes(voice) ? current.filter(v => v !== voice) : [...current, voice]
    setVoiceSections(prev => ({ ...prev, [userId]: next }))
    await supabase.from('profiles').update({ voice_sections: next }).eq('id', userId)
  }

  async function setVoiceForUser(userId, voice) {
    const next = voices[userId] === voice ? null : voice
    setVoices(prev => ({ ...prev, [userId]: next ?? '' }))
    await supabase.from('profiles').update({ voice: next }).eq('id', userId)
  }

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Gestió de permisos"
            icon={Shield}
            subtitle="Gestiona els rols i permisos dels membres de l'aplicació"
            actions={
              <div className="flex items-center gap-1 border border-rim rounded-lg overflow-hidden">
                <button onClick={() => setView('list')}
                  className={`p-2 transition-colors ${view === 'list' ? 'bg-fill text-body' : 'text-ghost hover:text-body'}`}>
                  <List size={16} />
                </button>
                <button onClick={() => setView('matrix')}
                  className={`p-2 transition-colors ${view === 'matrix' ? 'bg-fill text-body' : 'text-ghost hover:text-body'}`}>
                  <LayoutGrid size={16} />
                </button>
              </div>
            }
          />
        }
      >
        <SimulationPanel users={users} perms={perms} />
        {loading ? (
          <p className="text-faint text-sm py-8">Carregant...</p>
        ) : users.length === 0 ? (
          <EmptyState icon={Shield} title="Cap usuari registrat." />
        ) : view === 'matrix' ? (
          <PermissionsMatrix users={users} perms={perms} onToggle={togglePerm} />
        ) : (
          <div className="divide-y divide-rim">
            {users.map(u => {
              const isAdmin = u.role === 'admin' || u.role === 'director'
              const isOpen  = expanded === u.id
              const uPerms  = perms[u.id] ?? {}

              return (
                <div key={u.id}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-fill/60 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-body truncate">{u.full_name || u.email}</div>
                      {u.full_name && <div className="text-xs text-muted truncate">{u.email}</div>}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.member}`}>
                        {u.role ?? 'member'}
                      </span>
                      {!isAdmin && (
                        <button
                          title="Simular com aquest usuari"
                          onClick={e => { e.stopPropagation(); setSimulatedPermissions(structuredClone(perms[u.id] ?? {})) }}
                          className="p-1 rounded text-ghost hover:text-cyan-400 hover:bg-fill transition-colors">
                          <Play size={13} />
                        </button>
                      )}
                      {isOpen
                        ? <ChevronUp size={ICON.sm} className="text-ghost" />
                        : <ChevronDown size={ICON.sm} className="text-ghost" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-3 py-3 bg-fill/30 border-t border-rim space-y-3">
                      {/* Voice part — personal assignment, applies to all users */}
                      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-rim">
                        <span className="text-xs text-faint w-24 shrink-0">Veu</span>
                        {VOICE_ORDER.map(v => {
                          const c = VOICE_COLORS[v]
                          const active = voices[u.id] === v
                          return (
                            <button key={v} type="button"
                              onClick={() => setVoiceForUser(u.id, v)}
                              style={active ? { backgroundColor: c.bg, color: c.fg, borderColor: c.bg } : {}}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                active ? '' : 'bg-fill border-line text-ghost hover:text-muted'
                              }`}>
                              {VOICE_LABELS[v]}
                            </button>
                          )
                        })}
                      </div>
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
                          {uPerms.attendance?.edit && (
                            <div className="pt-2 mt-1 border-t border-rim">
                              <span className="text-xs text-muted block mb-2">Cordes assignades</span>
                              <div className="flex flex-wrap gap-1.5">
                                {VOICE_ORDER.map(v => {
                                  const active = (voiceSections[u.id] ?? []).includes(v)
                                  return (
                                    <button key={v} type="button"
                                      onClick={() => toggleVoiceSection(u.id, v)}
                                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                        active
                                          ? 'bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-400'
                                          : 'bg-fill border-line text-ghost hover:text-muted'
                                      }`}>
                                      {VOICE_LABELS[v]}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
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
