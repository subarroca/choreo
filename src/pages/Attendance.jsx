import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Plus, Check, X, Clock, Bell, Plane, Briefcase, HeartPulse, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import { confirmDialog } from '../components/ui/ConfirmDialog'

const STATUS_CONFIG = {
  present:  { label: 'Present',  icon: Check,  cls: 'bg-green-700/30 text-green-300 border-green-700/50' },
  absent:   { label: 'Absent',   icon: X,      cls: 'bg-red-700/30 text-red-300 border-red-700/50' },
  excused:  { label: 'Excusat', icon: Clock,  cls: 'bg-amber-700/30 text-amber-300 border-amber-700/50' },
}
const STATUS_CYCLE = ['present', 'absent', 'excused']

const REASONS = {
  viatge:   { label: 'Viatge',   icon: Plane },
  feina:    { label: 'Feina',    icon: Briefcase },
  malaltia: { label: 'Malaltia', icon: HeartPulse },
  altre:    { label: 'Altre',    icon: MessageSquare },
}

const REHEARSAL_TYPES = {
  veu:         'Veu',
  coreo:       'Coreo',
  ambdues:     'Veu + Coreo',
  masterclass: 'Masterclass',
  posicions:   'Passi de posicions',
}

function parseRehearsalMeta(notes) {
  if (!notes) return { type: '', freeNotes: '' }
  try {
    const p = JSON.parse(notes)
    if (p && typeof p === 'object' && 'type' in p) return { type: p.type ?? '', freeNotes: p.notes ?? '' }
  } catch {}
  return { type: '', freeNotes: notes }
}

function serializeRehearsalMeta(type, freeNotes) {
  if (!type) return freeNotes || null
  return JSON.stringify({ type, notes: freeNotes || '' })
}

function deriveInitials(m) {
  if (m.last_name) return (m.last_name[0] + (m.first_name?.[0] ?? '')).toUpperCase()
  return ((m.name || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2)).toUpperCase() || '?'
}

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isUpcoming(isoDate) {
  return isoDate >= new Date().toISOString().slice(0, 10)
}

export default function Attendance() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'director'

  const [members, setMembers] = useState([])
  const [rehearsals, setRehearsals] = useState([])    // [{ id, date, notes }]
  const [selectedId, setSelectedId] = useState(null)
  const [attendance, setAttendance] = useState({})    // member_id → { status, reason }
  const [tab, setTab] = useState('assajos')
  const [summaryData, setSummaryData] = useState(null) // { byMember: {memberId: {date: {status,reason}}} }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New rehearsal form
  const [addingDate, setAddingDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Absence notification form
  const [notifyMemberId, setNotifyMemberId] = useState('')
  const [notifyReason, setNotifyReason] = useState('viatge')
  const [showNotifyForm, setShowNotifyForm] = useState(false)

  useEffect(() => {
    async function load() {
      const [membersRes, rehearsalsRes] = await Promise.all([
        supabase.from('members').select('*').eq('active', true).order('last_name').order('first_name'),
        supabase.from('rehearsals').select('*').order('date'),
      ])
      setMembers(membersRes.data ?? [])
      const reh = rehearsalsRes.data ?? []
      setRehearsals(reh)
      if (reh.length) setSelectedId(reh[reh.length - 1].id)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedId) { setAttendance({}); return }
    supabase.from('attendance')
      .select('member_id, status, reason')
      .eq('rehearsal_id', selectedId)
      .then(({ data }) => {
        const map = {}
        for (const r of (data ?? [])) map[r.member_id] = { status: r.status, reason: r.reason ?? '' }
        setAttendance(map)
      })
  }, [selectedId])

  const loadSummary = useCallback(async () => {
    const { data } = await supabase.from('attendance').select('rehearsal_id, member_id, status, reason')
    const byMember = {}
    for (const r of (data ?? [])) {
      if (!byMember[r.member_id]) byMember[r.member_id] = {}
      byMember[r.member_id][r.rehearsal_id] = { status: r.status, reason: r.reason }
    }
    setSummaryData(byMember)
  }, [])

  useEffect(() => {
    if (tab === 'resum') loadSummary()
  }, [tab, loadSummary])

  async function addRehearsalDate() {
    if (!newDate) return
    const notes = serializeRehearsalMeta(newType, newNotes)
    const { data } = await supabase.from('rehearsals').insert({ date: newDate, notes }).select().single()
    if (data) {
      const updated = [...rehearsals, data].sort((a, b) => a.date < b.date ? -1 : 1)
      setRehearsals(updated)
      setSelectedId(data.id)
    }
    setNewDate(''); setNewType(''); setNewNotes(''); setAddingDate(false)
  }

  async function deleteRehearsal(id) {
    const r = rehearsals.find(x => x.id === id)
    if (!(await confirmDialog(`Eliminar l'assaig del ${formatDate(r.date)} i tots els registres?`))) return
    await supabase.from('attendance').delete().eq('rehearsal_id', id)
    await supabase.from('rehearsals').delete().eq('id', id)
    const newList = rehearsals.filter(x => x.id !== id)
    setRehearsals(newList)
    setSelectedId(newList.length ? newList[newList.length - 1].id : null)
  }

  async function toggleStatus(memberId) {
    if (!selectedId) return
    const current = attendance[memberId]?.status ?? 'present'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    const reason = next === 'present' ? '' : (attendance[memberId]?.reason ?? '')
    setAttendance(prev => ({ ...prev, [memberId]: { status: next, reason } }))
    setSaving(true)
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: memberId, status: next, reason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setSaving(false)
  }

  async function setReason(memberId, reason) {
    setAttendance(prev => ({ ...prev, [memberId]: { ...prev[memberId], reason } }))
    setSaving(true)
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: memberId, status: attendance[memberId]?.status ?? 'excused', reason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setSaving(false)
  }

  async function submitNotice() {
    if (!notifyMemberId || !selectedId) return
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: notifyMemberId, status: 'excused', reason: notifyReason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setAttendance(prev => ({ ...prev, [notifyMemberId]: { status: 'excused', reason: notifyReason } }))
    setNotifyMemberId(''); setNotifyReason('viatge'); setShowNotifyForm(false)
  }

  const selected = rehearsals.find(r => r.id === selectedId)
  const upcoming = selected && isUpcoming(selected.date)

  // Count stats for selected rehearsal
  const stats = { present: 0, absent: 0, excused: 0 }
  for (const m of members) {
    const s = attendance[m.id]?.status ?? (upcoming ? null : 'present')
    if (s) stats[s] = (stats[s] ?? 0) + 1
  }

  const inputCls = 'bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300'

  const tabs = (
    <div className="flex gap-1">
      {[['assajos', 'Assajos'], ['resum', 'Resum acumulat']].map(([key, label]) => (
        <button key={key} onClick={() => setTab(key)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === key ? 'border-cyan-500 text-cyan-600 dark:border-cyan-400 dark:text-cyan-300' : 'border-transparent text-muted hover:text-body'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <Layout>
      <PageContainer
        header={
          <PageHeader
            title="Assistència als assajos"
            icon={CalendarDays}
            actions={saving ? <span className="text-xs text-ghost">Guardant…</span> : null}
            tabs={tabs}
          />
        }
      >
      <div className="space-y-4 pt-2">

        {loading ? <p className="text-faint text-sm">Carregant...</p> : tab === 'assajos' ? (
          <div className="space-y-4">
            {/* Date tabs — horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {rehearsals.map(r => (
                <div key={r.id} className="relative group">
                  <button onClick={() => setSelectedId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedId === r.id
                        ? isUpcoming(r.date)
                          ? 'bg-amber-700/30 border-amber-600 text-amber-300'
                          : 'bg-cyan-700/30 border-cyan-600 text-cyan-300'
                        : 'border-line text-muted hover:text-body hover:bg-fill'
                    }`}>
                    {isUpcoming(r.date) && <span className="mr-1 text-amber-400">·</span>}
                    {formatDate(r.date)}
                  </button>
                  {isAdmin && (
                    <button onClick={() => deleteRehearsal(r.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-700 text-white hidden group-hover:flex items-center justify-center">
                      <X size={8} />
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (addingDate ? (
                <div className="flex flex-col gap-2 p-3 bg-pane border border-line rounded-xl shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputCls + ' py-1'} />
                    <select value={newType} onChange={e => setNewType(e.target.value)} className={inputCls + ' py-1'}>
                      <option value="">— Tipus —</option>
                      {Object.entries(REHEARSAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button onClick={addRehearsalDate} className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">Afegir</button>
                    <button onClick={() => { setAddingDate(false); setNewDate(''); setNewType(''); setNewNotes('') }} className="text-faint hover:text-body text-sm">Cancel·lar</button>
                  </div>
                  <input type="text" placeholder="Notes (opcional)" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={inputCls + ' py-1'} />
                </div>
              ) : (
                <button onClick={() => setAddingDate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed border-line text-faint hover:text-body hover:border-wire transition-colors">
                  <Plus size={13} /> Nou assaig
                </button>
              ))}
            </div>

            {!selected ? (
              <div className="text-center py-16 text-ghost">
                <CalendarDays size={40} className="mx-auto mb-4 opacity-30" />
                <p>Afegeix una data per registrar l'assistència.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                {(() => {
                  const meta = parseRehearsalMeta(selected.notes)
                  return (
                <div className="flex items-center gap-3 px-4 py-3 bg-pane border border-rim rounded-xl">
                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-body">{formatDate(selected.date)}</span>
                    {meta.type && <span className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-700/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/40 px-2 py-0.5 rounded-full">{REHEARSAL_TYPES[meta.type]}</span>}
                    {meta.freeNotes && <span className="text-xs text-ghost">{meta.freeNotes}</span>}
                    {upcoming && <span className="text-xs bg-amber-700/30 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded-full">Proper</span>}
                  </div>
                  {!upcoming && (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-green-400"><Check size={13} /> {stats.present}</span>
                      <span className="flex items-center gap-1 text-sm text-red-400"><X size={13} /> {stats.absent}</span>
                      <span className="flex items-center gap-1 text-sm text-amber-400"><Clock size={13} /> {stats.excused}</span>
                      <span className="text-xs text-ghost">/ {members.length}</span>
                    </div>
                  )}
                </div>
                  )
                })()}

                {/* Absence notification for upcoming */}
                {upcoming && (
                  <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                        <Bell size={14} /> Avisos d'absència
                      </h3>
                      <button onClick={() => setShowNotifyForm(v => !v)}
                        className="flex items-center gap-1.5 text-xs bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 border border-amber-700/40 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus size={12} /> No vinc
                      </button>
                    </div>

                    {showNotifyForm && (
                      <div className="flex flex-wrap items-end gap-2 p-3 bg-pane/50 rounded-lg border border-amber-700/20">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-ghost">Qui no ve</label>
                          <select value={notifyMemberId} onChange={e => setNotifyMemberId(e.target.value)} className={inputCls + ' py-1'}>
                            <option value="">— Selecciona —</option>
                            {members.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.last_name ? `${m.last_name}, ${m.first_name ?? ''}` : m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-ghost">Motiu</label>
                          <select value={notifyReason} onChange={e => setNotifyReason(e.target.value)} className={inputCls + ' py-1'}>
                            {Object.entries(REASONS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <button onClick={submitNotice} disabled={!notifyMemberId}
                          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                          Enviar avís
                        </button>
                        <button onClick={() => setShowNotifyForm(false)} className="text-faint hover:text-body text-sm py-2">Cancel·lar</button>
                      </div>
                    )}

                    {/* Existing excused notices */}
                    {members.filter(m => attendance[m.id]?.status === 'excused').length === 0
                      ? <p className="text-xs text-ghost">Ningú ha avisat d'absència.</p>
                      : members.filter(m => attendance[m.id]?.status === 'excused').map(m => {
                          const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                          const reason = attendance[m.id]?.reason
                          const ReasonIcon = reason ? REASONS[reason]?.icon : Clock
                          return (
                            <div key={m.id} className="flex items-center gap-2 text-sm">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: c.bg, color: c.fg }}>{deriveInitials(m)}</span>
                              <span className="text-body">
                                {m.last_name ? `${m.last_name}, ${m.first_name ?? ''}` : m.name}
                              </span>
                              {reason && (
                                <span className="flex items-center gap-1 text-xs bg-amber-700/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700/30">
                                  <ReasonIcon size={10} /> {REASONS[reason]?.label}
                                </span>
                              )}
                              {isAdmin && (
                                <button onClick={() => toggleStatus(m.id)} className="ml-auto text-xs text-ghost hover:text-red-400 transition-colors">
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          )
                        })
                    }
                  </div>
                )}

                {/* Member attendance list (past rehearsals — director editable) */}
                {!upcoming && (
                  <div className="space-y-1">
                    {members.map(m => {
                      const status = attendance[m.id]?.status ?? 'present'
                      const reason = attendance[m.id]?.reason ?? ''
                      const cfg = STATUS_CONFIG[status]
                      const StatusIcon = cfg.icon
                      const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-pane hover:bg-fill/30 transition-colors">
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: c.bg, color: c.fg }}>{deriveInitials(m)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-body truncate">
                              {m.last_name
                                ? <><span className="font-semibold">{m.last_name}</span>{m.first_name ? `, ${m.first_name}` : ''}</>
                                : <span className="font-medium">{m.name}</span>}
                            </div>
                            <div className="text-xs font-medium" style={{ color: c.bg }}>{VOICE_LABELS[m.voice]}</div>
                          </div>

                          {/* Reason selector (only for absent/excused) */}
                          {(status === 'absent' || status === 'excused') && isAdmin && (
                            <select value={reason} onChange={e => setReason(m.id, e.target.value)}
                              className="text-xs bg-fill border border-line rounded-lg px-2 py-1 text-muted focus:outline-none focus:border-cyan-400">
                              <option value="">Motiu…</option>
                              {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          )}
                          {(status === 'absent' || status === 'excused') && !isAdmin && reason && (
                            <span className="text-xs text-ghost">{REASONS[reason]?.label}</span>
                          )}

                          {isAdmin ? (
                            <button onClick={() => toggleStatus(m.id)}
                              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 transition-colors ${cfg.cls}`}>
                              <StatusIcon size={11} /> {cfg.label}
                            </button>
                          ) : (
                            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${cfg.cls}`}>
                              <StatusIcon size={11} /> {cfg.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Summary tab */
          <SummaryView members={members} rehearsals={rehearsals} summaryData={summaryData} />
        )}
      </div>
      </PageContainer>
    </Layout>
  )
}

function SummaryView({ members, rehearsals, summaryData }) {
  if (!summaryData) return <p className="text-sm text-faint">Carregant resum…</p>
  if (!rehearsals.length) return <p className="text-sm text-ghost">Sense dades d'assistència.</p>

  const past = rehearsals.filter(r => !isUpcoming(r.date))

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left px-2 py-2 text-ghost font-normal border-b border-rim sticky left-0 bg-page z-10 whitespace-nowrap">Persona</th>
              {past.map(r => (
                <th key={r.id} className="px-2 py-2 text-ghost font-normal border-b border-rim text-center whitespace-nowrap">
                  {formatDate(r.date)}
                </th>
              ))}
              <th className="px-3 py-2 text-ghost font-normal border-b border-rim text-center whitespace-nowrap">% Assist.</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
              const memberData = summaryData[m.id] ?? {}
              const presents = past.filter(r => (memberData[r.id]?.status ?? 'present') === 'present').length
              const pct = past.length ? Math.round((presents / past.length) * 100) : null
              return (
                <tr key={m.id} className="hover:bg-fill/20 transition-colors">
                  <td className="px-2 py-2 border-b border-rim/40 sticky left-0 bg-page z-10">
                    <span className="font-semibold text-body">
                      {m.last_name ?? m.name}
                    </span>
                    <span className="ml-1 font-medium" style={{ color: c.bg + 'cc' }}>
                      {VOICE_LABELS[m.voice]?.slice(0, 1)}
                    </span>
                  </td>
                  {past.map(r => {
                    const rec = memberData[r.id]
                    const s = rec?.status ?? 'present'
                    const reason = rec?.reason
                    const ReasonIcon = reason ? REASONS[reason]?.icon : null
                    return (
                      <td key={r.id} className="px-2 py-2 border-b border-rim/40 text-center" title={reason ? REASONS[reason]?.label : undefined}>
                        {s === 'present' && <span className="text-green-400 font-bold">✓</span>}
                        {s === 'absent'  && <span className="text-red-400 font-bold">✗</span>}
                        {s === 'excused' && (
                          <span className="text-amber-400" title={reason ? REASONS[reason]?.label : 'Excusat'}>~</span>
                        )}
                        {!rec && <span className="text-gray-700">—</span>}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 border-b border-rim/40 text-center font-semibold">
                    {pct !== null ? (
                      <span className={pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {pct}%
                      </span>
                    ) : <span className="text-ghost">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ghost">Mostra només assajos passats ({past.length} de {rehearsals.length} totals).</p>
    </div>
  )
}
