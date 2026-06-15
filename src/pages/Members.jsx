import { useState } from 'react'
import { Users, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import Avatar, { memberInitials } from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import PersonProfileOverlay from '../components/PersonProfileOverlay'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { ICON } from '../lib/ui'
import { SkeletonRow } from '../components/ui/Skeleton'
import { toast } from '../components/ui/Toast'

const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']

function calcAge(birth_date) {
  if (!birth_date) return null
  const b = new Date(birth_date), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}

function MemberMeta({ member }) {
  const parts = [VOICE_LABELS[member.voice]].filter(Boolean)
  const age = calcAge(member.birth_date)
  if (age != null) parts.push(`${age} a.`)
  if (member.height) parts.push(`${member.height} cm`)
  return parts.join(' · ')
}

function AttendanceBadge({ pct }) {
  if (pct == null) return null
  const color = pct >= 80 ? 'bg-green-500/20 text-green-400' : pct >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${color}`}>
      {Math.round(pct)}%
    </span>
  )
}

function MemberRow({ member, onClick, dim = false, attendancePct }) {
  const label = member.last_name
    ? <><span className="font-semibold">{member.last_name}</span>{member.first_name ? `, ${member.first_name}` : ''}</>
    : <span className="font-medium">{member.name}</span>

  return (
    <ListRow
      onClick={onClick}
      className={dim ? 'opacity-50 hover:opacity-75' : ''}
      leading={<Avatar member={member} size="sm" />}
      title={<span className={dim ? 'line-through' : ''}>{label}</span>}
      meta={dim ? <span className="text-amber-600 dark:text-amber-400">De baixa</span> : undefined}
      trailing={!dim && <AttendanceBadge pct={attendancePct} />}
    />
  )
}

export default function Members() {
  const { can } = useAuth()
  const { currentChoirId } = useChoir()
  const canEdit = can('members', 'edit')
  const [showInactive, setShowInactive] = useState(false)
  const [filterVoice, setFilterVoice]   = useState('')
  const [search, setSearch]             = useState('')
  const [sortBy, setSortBy]             = useState('last_name')
  const [overlayMember, setOverlayMember] = useState(null) // member obj | 'new'

  const { data: attendanceMap = {} } = useSupabaseQuery(async () => {
    const { data: allReh } = await supabase.from('rehearsals').select('id, date').order('date')
    if (!allReh?.length) return {}
    const nowStr = new Date().toISOString().slice(0, 10)
    const pastReh = allReh.filter(r => r.date <= nowStr)
    const total = pastReh.length
    if (!total) return {}
    const rehIds = pastReh.map(r => r.id)
    const { data: attData } = await supabase.from('attendance').select('rehearsal_id, member_id').in('rehearsal_id', rehIds)
    const absences = {}
    for (const a of (attData ?? [])) {
      absences[a.member_id] = (absences[a.member_id] ?? 0) + 1
    }
    const result = {}
    for (const [memberId, absCount] of Object.entries(absences)) {
      result[memberId] = ((total - absCount) / total) * 100
    }
    return result
  }, [])

  const { data: members = [], setData: setMembers, loading } = useSupabaseQuery(async () => {
    let q = supabase.from('members').select('*').order('last_name').order('first_name')
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return (data ?? []).sort((a, b) =>
      ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca'))
  }, [currentChoirId])

  async function handleCreate(fields) {
    const payload = { active: true, ...fields }
    if (currentChoirId) payload.choir_id = currentChoirId
    const { data, error } = await supabase.from('members').insert(payload).select().single()
    if (error) { toast.error('Error en crear la persona'); return }
    setMembers(prev => [...prev, data].sort((a, b) =>
      ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca')))
    setOverlayMember(data)
    toast('Persona creada')
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (error) { toast.error('Error en desar'); return }
    setMembers(prev => prev.map(m => m.id === id ? data : m)
      .sort((a, b) => ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca')))
    setOverlayMember(data)
    toast('Canvis desats')
  }

  async function handleSetActive(id, active) {
    const fields = active ? { active: true, left_at: null } : { active: false, left_at: new Date().toISOString() }
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? data : m))
      setOverlayMember(data)
      toast(active ? 'Persona reactivada' : 'Persona donada de baixa', active ? 'success' : 'warn')
    }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar definitivament aquesta persona?'))) return
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    setOverlayMember(null)
    toast('Persona eliminada', 'warn')
  }

  const activeMembers   = members.filter(m => m.active !== false)
  const inactiveMembers = members.filter(m => m.active === false)
  const voiceCounts = VOICE_ORDER.reduce((acc, v) => {
    acc[v] = activeMembers.filter(m => m.voice === v).length; return acc
  }, {})
  const searchLower = search.toLowerCase()
  const listMembers = activeMembers
    .filter(m =>
      (!filterVoice || m.voice === filterVoice) &&
      (!search || m.name?.toLowerCase().includes(searchLower) ||
        m.first_name?.toLowerCase().includes(searchLower) ||
        m.last_name?.toLowerCase().includes(searchLower))
    )
    .sort((a, b) => {
      if (sortBy === 'voice') {
        return VOICE_ORDER.indexOf(a.voice) - VOICE_ORDER.indexOf(b.voice) ||
               (a.last_name || '').localeCompare(b.last_name || '', 'ca')
      }
      if (sortBy === 'first_name') return (a.first_name || '').localeCompare(b.first_name || '', 'ca')
      return (a.last_name || a.name || '').localeCompare(b.last_name || b.name || '', 'ca')
    })

  const isNew = overlayMember === 'new'
  const overlayData = isNew ? null : overlayMember

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Persones"
            icon={Users}
            actions={canEdit && (
              <Button onClick={() => setOverlayMember('new')}>
                <Plus size={ICON.sm} /> Afegir
              </Button>
            )}
            tabs={
              <div className="space-y-2 py-2">
                {/* Search */}
                <div className="relative">
                  <Search size={ICON.sm} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cerca per nom…"
                    className="w-full bg-fill border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {/* Sort buttons */}
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="text-xs text-ghost">Ordenar:</span>
                  {[['last_name','Cognom'],['first_name','Nom'],['voice','Corda']].map(([k,l]) => (
                    <button key={k} onClick={() => setSortBy(k)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        sortBy === k ? 'border-cyan-600 text-cyan-400' : 'border-line text-faint hover:text-body'
                      }`}>{l}</button>
                  ))}
                </div>
                {/* Voice filter pills */}
                <div className="flex flex-wrap gap-1.5 pb-0.5">
                  <button
                    onClick={() => setFilterVoice('')}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${!filterVoice ? 'border-cyan-600 text-cyan-400' : 'border-line text-faint hover:text-body'}`}
                  >
                    Totes <span className="text-ghost ml-1">{activeMembers.length}</span>
                  </button>
                  {VOICE_ORDER.filter(v => voiceCounts[v] > 0).map(v => {
                    const c = VOICE_COLORS[v]
                    return (
                      <button key={v} onClick={() => setFilterVoice(filterVoice === v ? '' : v)}
                        className="px-3 py-1 rounded-full text-xs border transition-all font-medium"
                        style={filterVoice === v
                          ? { color: c.bg, borderColor: c.bg }
                          : { color: c.bg + 'aa', borderColor: c.bg + '44' }}>
                        {VOICE_LABELS[v]} <span className="opacity-70 ml-0.5">{voiceCounts[v]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            }
          />
        }
      >
        {loading ? (
          <div className="divide-y divide-rim">{Array.from({length: 8}, (_,i) => <SkeletonRow key={i} />)}</div>
        ) : listMembers.length === 0 ? (
          <EmptyState icon={Users} title="Cap persona aquí." />
        ) : (
          <div className="divide-y divide-rim">
            {listMembers.map(m => (
              <MemberRow key={m.id} member={m} onClick={() => setOverlayMember(m)} attendancePct={attendanceMap[m.id]} />
            ))}
          </div>
        )}

        {/* Inactive section */}
        {inactiveMembers.length > 0 && (
          <div className="mt-2 border-t border-rim">
            <button
              onClick={() => setShowInactive(v => !v)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors w-full"
            >
              {showInactive ? <ChevronUp size={ICON.xs} /> : <ChevronDown size={ICON.xs} />}
              De baixa ({inactiveMembers.length})
            </button>
            {showInactive && (
              <div className="divide-y divide-rim">
                {inactiveMembers.map(m => (
                  <MemberRow key={m.id} member={m} onClick={() => setOverlayMember(m)} dim />
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>

      {overlayMember && (
        <PersonProfileOverlay
          member={overlayData}
          isNew={isNew}
          readOnly={!canEdit}
          onClose={() => setOverlayMember(null)}
          onSave={canEdit ? (fields => isNew ? handleCreate(fields) : handleUpdate(overlayData.id, fields)) : null}
          onSetActive={isNew || !canEdit ? null : handleSetActive}
          onDelete={isNew || !canEdit ? null : handleDelete}
        />
      )}
    </Layout>
  )
}
