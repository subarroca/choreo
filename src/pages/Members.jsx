import { useState } from 'react'
import { Users, ChevronDown, ChevronUp, Plus, Search, Undo2, Redo2 } from '../lib/icons'
import { useHistory, useHistoryHotkeys } from '../hooks/useHistory'
import { runMutation } from '../lib/mutate'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, VOICE_ORDER } from '../lib/constants'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import Avatar, { memberInitials } from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import PersonProfileOverlay from '../components/PersonProfileOverlay'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { ICON } from '../lib/ui'
import { SkeletonRow } from '../components/ui/Skeleton'
import { calcAge } from '../lib/formatters'

function MemberMeta({ member }) {
  const parts = [VOICE_LABELS[member.voice]].filter(Boolean)
  const age = calcAge(member.birth_date)
  if (age != null) parts.push(`${age} a.`)
  if (member.height) parts.push(`${member.height} cm`)
  return parts.join(' · ')
}

function AttendanceBadge({ pct }) {
  if (pct == null) return null
  const color = pct >= 80
    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    : pct >= 60
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
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
  const [searchParams] = useSearchParams()
  const [showInactive, setShowInactive] = useState(false)
  const [filterVoice, setFilterVoice]   = useState(() => searchParams.get('voice') || '')
  const [search, setSearch]             = useState('')
  const [sortBy, setSortBy]             = useState('first_name')
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

  const history = useHistory()
  useHistoryHotkeys(history)

  const sortMembers = list => [...list].sort((a, b) =>
    ((a.last_name || a.name) + '').localeCompare((b.last_name || b.name) + '', 'ca'))

  // Insert a full member row (used by create's `do` and delete's `undo`).
  // The id is generated client-side so do/undo/redo always reference the same
  // row identity, keeping the inverse stable across repeated undo/redo.
  function insertMemberCmd(row, msg) {
    return runMutation({
      optimistic: () => { setMembers(prev => sortMembers([...prev, row])); setOverlayMember(row) },
      persist: () => supabase.from('members').insert(row),
      rollback: () => setMembers(prev => prev.filter(m => m.id !== row.id)),
      errorMsg: 'Error en crear la persona', successMsg: msg,
    })
  }
  function deleteMemberCmd(row, msg) {
    return runMutation({
      optimistic: () => { setMembers(prev => prev.filter(m => m.id !== row.id)); setOverlayMember(null) },
      persist: () => supabase.from('members').delete().eq('id', row.id),
      rollback: () => setMembers(prev => sortMembers([...prev, row])),
      errorMsg: 'Error en eliminar la persona', successMsg: msg,
    })
  }
  function updateMemberCmd(id, fields, msg) {
    return runMutation({
      optimistic: () => setMembers(prev => sortMembers(prev.map(m => m.id === id ? { ...m, ...fields } : m))),
      persist: async () => {
        const res = await supabase.from('members').update(fields).eq('id', id).select().single()
        if (!res.error && res.data) { setMembers(prev => sortMembers(prev.map(m => m.id === id ? res.data : m))); setOverlayMember(res.data) }
        return res
      },
      errorMsg: 'Error en desar', successMsg: msg,
    })
  }

  function handleCreate(fields) {
    const row = { id: crypto.randomUUID(), active: true, ...fields }
    if (currentChoirId) row.choir_id = currentChoirId
    history.dispatch({
      label: 'create-member',
      do: () => insertMemberCmd(row, 'Persona creada'),
      undo: () => deleteMemberCmd(row, 'Creació desfeta'),
    })
  }

  function handleUpdate(id, fields) {
    const prev = members.find(m => m.id === id)
    if (!prev) return
    const prevFields = Object.fromEntries(Object.keys(fields).map(k => [k, prev[k]]))
    history.dispatch({
      label: 'update-member',
      do: () => updateMemberCmd(id, fields, 'Canvis desats'),
      undo: () => updateMemberCmd(id, prevFields, 'Canvi desfet'),
    })
  }

  function handleSetActive(id, active) {
    const fields = active ? { active: true, left_at: null } : { active: false, left_at: new Date().toISOString() }
    const prev = members.find(m => m.id === id)
    const prevFields = prev ? { active: prev.active, left_at: prev.left_at } : { active: !active, left_at: null }
    history.dispatch({
      label: 'setactive-member',
      do: () => updateMemberCmd(id, fields, active ? 'Persona reactivada' : 'Persona donada de baixa'),
      undo: () => updateMemberCmd(id, prevFields, 'Estat restaurat'),
    })
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar definitivament aquesta persona?'))) return
    const row = members.find(m => m.id === id)
    if (!row) return
    history.dispatch({
      label: 'delete-member',
      do: () => deleteMemberCmd(row, 'Persona eliminada'),
      undo: () => insertMemberCmd(row, 'Eliminació desfeta'),
    })
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
              <div className="flex items-center gap-1.5">
                <button onClick={history.undo} disabled={!history.canUndo}
                  aria-label="Desfés" aria-keyshortcuts="Control+Z Meta+Z" title="Desfés (Ctrl/Cmd+Z)"
                  className="p-2 rounded-lg text-faint hover:text-body hover:bg-fill disabled:opacity-30 disabled:hover:bg-transparent">
                  <Undo2 size={ICON.sm} />
                </button>
                <button onClick={history.redo} disabled={!history.canRedo}
                  aria-label="Refés" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" title="Refés (Ctrl/Cmd+Shift+Z)"
                  className="p-2 rounded-lg text-faint hover:text-body hover:bg-fill disabled:opacity-30 disabled:hover:bg-transparent">
                  <Redo2 size={ICON.sm} />
                </button>
                <Button onClick={() => setOverlayMember('new')}>
                  <Plus size={ICON.sm} /> Afegir
                </Button>
              </div>
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
                    <Chip key={k} active={sortBy === k} onClick={() => setSortBy(k)}>{l}</Chip>
                  ))}
                </div>
                {/* Voice filter pills */}
                <div className="flex flex-wrap gap-1.5 pb-0.5">
                  <Chip active={!filterVoice} onClick={() => setFilterVoice('')}>
                    Totes <span className="text-ghost ml-1">{activeMembers.length}</span>
                  </Chip>
                  {VOICE_ORDER.filter(v => voiceCounts[v] > 0).map(v => {
                    const c = VOICE_COLORS[v]
                    const isActive = filterVoice === v
                    return (
                      <button key={v} onClick={() => setFilterVoice(isActive ? '' : v)}
                        className="px-3 py-1 rounded-full text-xs border transition-all font-medium"
                        style={isActive
                          ? { backgroundColor: c.bg, color: c.fg, borderColor: c.bg }
                          : { borderColor: c.bg + '66', color: c.bg }}>
                        {VOICE_LABELS[v]} <span className="opacity-60 ml-0.5">{voiceCounts[v]}</span>
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
