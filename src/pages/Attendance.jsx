import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Check, X, Clock, Bell, Plane, Briefcase, HeartPulse, MessageSquare, MapPin, Pencil } from '../lib/icons'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth.jsx'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import { inputCls } from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import SummaryView from '../components/SummaryView'
import RehearsalDetailModal from '../components/attendance/RehearsalDetailModal'
import { memberInitials, formatDate, isUpcoming } from '../lib/formatters'
import { useAttendanceData } from '../hooks/useAttendanceData'

const STATUS_CONFIG = {
  present:  { label: 'Present',  icon: Check,  cls: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50' },
  absent:   { label: 'Absent',   icon: X,      cls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-700/50' },
  excused:  { label: 'Excusat', icon: Clock,  cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-700/30 dark:text-amber-300 dark:border-amber-700/50' },
}

const REASONS = {
  viatge:   { label: 'Viatge',   icon: Plane },
  feina:    { label: 'Feina',    icon: Briefcase },
  malaltia: { label: 'Malaltia', icon: HeartPulse },
  altre:    { label: 'Altre',    icon: MessageSquare },
}

const REHEARSAL_TYPES = {
  veu: 'Veu', coreo: 'Coreo', ambdues: 'Veu + Coreo',
  masterclass: 'Masterclass', posicions: 'Passi de posicions',
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

export default function Attendance() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'director'

  const {
    members, rehearsals, selectedId, setSelectedId,
    attendance, loading, saving,
    summaryData, loadSummary,
    addRehearsal, saveRehearsalMeta, deleteRehearsal,
    toggleStatus, setReason, submitNotice,
  } = useAttendanceData()

  const [tab, setTab] = useState('assajos')

  // New rehearsal form
  const [addingDate, setAddingDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newType, setNewType] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Detail panel (state kept minimal — edit state lives inside RehearsalDetailModal)
  const [detailRehearsal, setDetailRehearsal] = useState(null)

  // Absence notification form
  const [notifyMemberId, setNotifyMemberId] = useState('')
  const [notifyReason, setNotifyReason] = useState('viatge')
  const [showNotifyForm, setShowNotifyForm] = useState(false)

  useEffect(() => {
    if (tab === 'resum') loadSummary()
  }, [tab, loadSummary])

  function resetForm() {
    setNewDate(''); setNewTime(''); setNewLocation(''); setNewType(''); setNewNotes('')
    setAddingDate(false)
  }

  async function addRehearsalDate() {
    if (!newDate) return
    await addRehearsal(newDate, newType, newTime, newLocation, newNotes)
    resetForm()
  }

  async function handleSubmitNotice() {
    await submitNotice(notifyMemberId, notifyReason)
    setNotifyMemberId(''); setNotifyReason('viatge'); setShowNotifyForm(false)
  }

  const selected = rehearsals.find(r => r.id === selectedId)
  const upcoming = selected && isUpcoming(selected.date)

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
        header={<PageHeader title="Assajos" icon={CalendarDays} actions={headerActions} tabs={tabs} />}
      >
      <div className="space-y-4 pt-2">

        {/* New rehearsal form */}
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
            <div className="flex flex-col gap-2">
              {rehearsals.map(r => {
                const meta = parseRehearsalMeta(r.notes)
                const active = selectedId === r.id
                const isNext = isUpcoming(r.date)
                return (
                  <div key={r.id} className="relative group">
                    <button onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        active ? 'bg-cyan-50 border-cyan-300 dark:bg-cyan-700/20 dark:border-cyan-600' : 'bg-pane border-rim hover:bg-fill'
                      }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${active ? 'text-cyan-700 dark:text-cyan-300' : 'text-body'}`}>
                          {formatDate(r.date)}
                        </span>
                        {meta.type && <Badge color="cyan">{REHEARSAL_TYPES[meta.type]}</Badge>}
                        {isNext && <Badge color="amber">Proper</Badge>}
                      </div>
                      {(meta.time || meta.location) && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          {meta.time && <span className="flex items-center gap-1"><Clock size={11} />{meta.time}</span>}
                          {meta.location && <span className="flex items-center gap-1"><MapPin size={11} />{meta.location}</span>}
                        </div>
                      )}
                    </button>
                    {isAdmin && (
                      <button onClick={() => setDetailRehearsal(r)} title="Editar detalls"
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
                          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"><Check size={13} /> {stats.present}</span>
                          <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"><X size={13} /> {stats.absent}</span>
                          <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400"><Clock size={13} /> {stats.excused}</span>
                          <span className="text-xs text-ghost">/ {members.length}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Absence notifications (upcoming rehearsal) */}
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
                          {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </Select>
                        <button onClick={handleSubmitNotice} disabled={!notifyMemberId}
                          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                          Enviar avís
                        </button>
                        <button onClick={() => setShowNotifyForm(false)} className="text-faint hover:text-body text-sm py-2">Cancel·lar</button>
                      </div>
                    )}
                    {members.filter(m => attendance[m.id]?.status === 'excused').length === 0
                      ? <p className="text-xs text-ghost">Ningú ha avisat d'absència.</p>
                      : members.filter(m => attendance[m.id]?.status === 'excused').map(m => {
                          const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                          const reason = attendance[m.id]?.reason
                          const ReasonIcon = reason ? REASONS[reason]?.icon : Clock
                          return (
                            <div key={m.id} className="flex items-center gap-2 text-sm">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: c.bg, color: c.fg }}>{memberInitials(m)}</span>
                              <span className="text-body">
                                {m.last_name ? `${m.last_name}, ${m.first_name ?? ''}` : m.name}
                              </span>
                              {reason && <Badge color="amber"><ReasonIcon size={10} /> {REASONS[reason]?.label}</Badge>}
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

                {/* Member attendance list (past rehearsals) */}
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
                            style={{ backgroundColor: c.bg, color: c.fg }}>{memberInitials(m)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-body truncate">
                              {m.last_name
                                ? <><span className="font-semibold">{m.last_name}</span>{m.first_name ? `, ${m.first_name}` : ''}</>
                                : <span className="font-medium">{m.name}</span>}
                            </div>
                            <div className="text-xs font-medium" style={{ color: c.bg }}>{VOICE_LABELS[m.voice]}</div>
                          </div>
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
          <SummaryView members={members} rehearsals={rehearsals} summaryData={summaryData} />
        )}
      </div>
      </PageContainer>

      <RehearsalDetailModal
        rehearsal={detailRehearsal}
        isAdmin={isAdmin}
        onSave={saveRehearsalMeta}
        onClose={() => setDetailRehearsal(null)}
      />
    </Layout>
  )
}
