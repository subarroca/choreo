import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Plus, Check, X, Clock, Bell, Plane, Briefcase, HeartPulse, MessageSquare, MapPin, Pencil } from 'lucide-react'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import { inputCls } from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import SummaryView from '../components/SummaryView'

const STATUS_CONFIG = {
  present:  { label: 'Present',  icon: Check,  cls: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50' },
  absent:   { label: 'Absent',   icon: X,      cls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-700/50' },
  excused:  { label: 'Excusat', icon: Clock,  cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-700/30 dark:text-amber-300 dark:border-amber-700/50' },
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
  if (!notes) return { type: '', time: '', location: '', freeNotes: '' }
  try {
    const p = JSON.parse(notes)
    if (p && typeof p === 'object' && ('type' in p || 'time' in p || 'location' in p)) {
      return { type: p.type ?? '', time: p.time ?? '', location: p.location ?? '', freeNotes: p.notes ?? '' }
    }
  } catch {}
  return { type: '', time: '', location: '', freeNotes: notes }
}

function serializeRehearsalMeta(type, time, location, freeNotes) {
  const hasExtra = type || time || location
  if (!hasExtra) return freeNotes || null
  return JSON.stringify({ type: type || '', time: time || '', location: location || '', notes: freeNotes || '' })
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
  const [newTime, setNewTime] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newType, setNewType] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Rehearsal detail panel
  const [detailRehearsal, setDetailRehearsal] = useState(null) // rehearsal obj
  const [editTime, setEditTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editType, setEditType] = useState('')
  const [editNotes, setEditNotes] = useState('')

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

  function resetForm() {
    setNewDate(''); setNewTime(''); setNewLocation(''); setNewType(''); setNewNotes('')
    setAddingDate(false)
  }

  async function addRehearsalDate() {
    if (!newDate) return
    const notes = serializeRehearsalMeta(newType, newTime, newLocation, newNotes)
    const { data } = await supabase.from('rehearsals').insert({ date: newDate, notes }).select().single()
    if (data) {
      const updated = [...rehearsals, data].sort((a, b) => a.date < b.date ? -1 : 1)
      setRehearsals(updated)
      setSelectedId(data.id)
    }
    resetForm()
  }

  function openDetail(r) {
    const meta = parseRehearsalMeta(r.notes)
    setEditTime(meta.time)
    setEditLocation(meta.location)
    setEditType(meta.type)
    setEditNotes(meta.freeNotes)
    setDetailRehearsal(r)
  }

  async function saveDetail() {
    if (!detailRehearsal) return
    const notes = serializeRehearsalMeta(editType, editTime, editLocation, editNotes)
    const { data } = await supabase.from('rehearsals').update({ notes }).eq('id', detailRehearsal.id).select().single()
    if (data) {
      setRehearsals(prev => prev.map(r => r.id === data.id ? data : r))
    }
    setDetailRehearsal(null)
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

  const headerActions = (
    <div className="flex items-center gap-2">
      {saving && <span className="text-xs text-ghost">Guardant…</span>}
      {isAdmin && tab === 'assajos' && (
        <Button size="sm" onClick={() => setAddingDate(v => !v)}>
          <Plus size={14} /> Nou assaig
        </Button>
      )}
    </div>
  )

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Assajos"
            icon={CalendarDays}
            actions={headerActions}
            tabs={tabs}
          />
        }
      >
      <div className="space-y-4 pt-2">

        {/* New rehearsal form — shown when addingDate */}
        {isAdmin && addingDate && (
          <div className="rounded-xl border border-line bg-pane p-4 space-y-3">
            <h3 className="text-sm font-semibold text-body">Nou assaig</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Data *</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Hora</label>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Lloc</label>
                <input type="text" placeholder="Sala, adreça…" value={newLocation} onChange={e => setNewLocation(e.target.value)} className={inputCls} />
              </div>
              <Select label="Tipus" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="">— Tipus —</option>
                {Object.entries(REHEARSAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-2">
                <label className="text-xs text-muted">Notes</label>
                <input type="text" placeholder="Notes opcionals" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addRehearsalDate} disabled={!newDate}>Afegir assaig</Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>Cancel·lar</Button>
            </div>
          </div>
        )}

        {loading ? <p className="text-faint text-sm">Carregant...</p> : tab === 'assajos' ? (
          <div className="space-y-4">
            {/* Rehearsal cards — vertical list */}
            <div className="flex flex-col gap-2">
              {rehearsals.map(r => {
                const meta = parseRehearsalMeta(r.notes)
                const active = selectedId === r.id
                const upcoming = isUpcoming(r.date)
                return (
                  <div key={r.id} className="relative group">
                    <button onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        active
                          ? 'bg-cyan-50 border-cyan-300 dark:bg-cyan-700/20 dark:border-cyan-600'
                          : 'bg-pane border-rim hover:bg-fill'
                      }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${active ? 'text-cyan-700 dark:text-cyan-300' : 'text-body'}`}>
                          {formatDate(r.date)}
                        </span>
                        {meta.type && (
                          <Badge color="cyan">{REHEARSAL_TYPES[meta.type]}</Badge>
                        )}
                        {upcoming && (
                          <Badge color="amber">Proper</Badge>
                        )}
                      </div>
                      {(meta.time || meta.location) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          {meta.time && <span className="flex items-center gap-1"><Clock size={11} />{meta.time}</span>}
                          {meta.location && <span className="flex items-center gap-1"><MapPin size={11} />{meta.location}</span>}
                        </div>
                      )}
                    </button>
                    {isAdmin && (
                      <button onClick={() => openDetail(r)}
                        title="Editar detalls"
                        className="absolute right-10 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ghost hover:text-body hover:bg-fill transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil size={13} />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => deleteRehearsal(r.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ghost hover:text-red-500 hover:bg-fill transition-colors opacity-0 group-hover:opacity-100">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
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
                <div className="flex items-start gap-3 px-4 py-3 bg-pane border border-rim rounded-xl">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-body">{formatDate(selected.date)}</span>
                      {meta.type && <Badge color="cyan">{REHEARSAL_TYPES[meta.type]}</Badge>}
                      {upcoming && <Badge color="amber">Proper</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      {meta.time && <span className="flex items-center gap-1"><Clock size={11} />{meta.time}</span>}
                      {meta.location && <span className="flex items-center gap-1"><MapPin size={11} />{meta.location}</span>}
                      {meta.freeNotes && <span className="text-ghost">{meta.freeNotes}</span>}
                    </div>
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
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Bell size={14} /> Avisos d'absència
                      </h3>
                      <button onClick={() => setShowNotifyForm(v => !v)}
                        className="flex items-center gap-1.5 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-700/30 dark:hover:bg-amber-700/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/40 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus size={12} /> No vinc
                      </button>
                    </div>

                    {showNotifyForm && (
                      <div className="flex flex-wrap items-end gap-2 p-3 bg-white dark:bg-pane/50 rounded-lg border border-amber-200 dark:border-amber-700/20">
                        <Select label="Qui no ve" value={notifyMemberId} onChange={e => setNotifyMemberId(e.target.value)}>
                          <option value="">— Selecciona —</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.last_name ? `${m.last_name}, ${m.first_name ?? ''}` : m.name}
                            </option>
                          ))}
                        </Select>
                        <Select label="Motiu" value={notifyReason} onChange={e => setNotifyReason(e.target.value)}>
                          {Object.entries(REASONS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </Select>
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
                                <Badge color="amber">
                                  <ReasonIcon size={10} /> {REASONS[reason]?.label}
                                </Badge>
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
                              className="text-xs bg-fill border border-line rounded-lg px-2 py-1 text-muted focus:outline-none focus:border-cyan-500">
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

      {/* Rehearsal detail side panel */}
      <Modal
        open={!!detailRehearsal}
        onClose={() => setDetailRehearsal(null)}
        title={detailRehearsal ? formatDate(detailRehearsal.date) : ''}
        width="half"
        footer={isAdmin && (
          <div className="flex gap-2">
            <Button onClick={saveDetail}>Guardar</Button>
            <Button variant="ghost" onClick={() => setDetailRehearsal(null)}>Cancel·lar</Button>
          </div>
        )}
      >
        {detailRehearsal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Hora</label>
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                  disabled={!isAdmin}
                  className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Lloc</label>
                <input type="text" placeholder="Sala, adreça…" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                  disabled={!isAdmin}
                  className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Tipus</label>
              <select value={editType} onChange={e => setEditType(e.target.value)}
                disabled={!isAdmin}
                className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60">
                <option value="">— Tipus —</option>
                {Object.entries(REHEARSAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Notes</label>
              <Textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                disabled={!isAdmin}
                placeholder="Notes opcionals"
                className="disabled:opacity-60" />
            </div>
            {!isAdmin && <p className="text-xs text-ghost">Només els directors poden editar els detalls.</p>}
          </div>
        )}
      </Modal>
    </Layout>
  )
}

