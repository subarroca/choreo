import { useState, useEffect } from 'react'
import { t } from '../../locales/ca'
import { parseJsonArray, parseJson } from '../../lib/parseJson'
import { formatDate, isUpcoming } from '../../lib/formatters'
import { memberInitials } from '../../lib/formatters'
import { VOICE_COLORS, VOICE_LABELS } from '../../lib/constants'
import { X, Check, Clock, Bell, Plane, Briefcase, HeartPulse, MessageSquare, Plus,
  MapPin, Music, ExternalLink, FileText, Pencil, ChevronDown } from '../../lib/icons'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import { inputCls, labelCls } from '../ui/Input'

const STATUS_CONFIG = {
  present:  { label: t.attendanceStatus.present,  icon: Check,  cls: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50' },
  absent:   { label: t.attendanceStatus.absent,   icon: X,      cls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-700/50' },
  excused:  { label: t.attendanceStatus.excused,  icon: Clock,  cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-700/30 dark:text-amber-300 dark:border-amber-700/50' },
}

const REASONS = {
  viatge:   { label: t.reasons.viatge,   icon: Plane },
  feina:    { label: t.reasons.feina,    icon: Briefcase },
  malaltia: { label: t.reasons.malaltia, icon: HeartPulse },
  altre:    { label: t.reasons.altre,    icon: MessageSquare },
}

const REHEARSAL_TYPES = t.rehearsalTypes

const ATTACHMENT_COLORS = { reference: 'text-blue-400', score: 'text-purple-400', audio: 'text-green-400' }

function parseRehearsalMeta(notes) {
  if (!notes) return { type: '', time: '', location: '', freeNotes: '', duration: 90 }
  try {
    const p = parseJson(notes)
    if (p && typeof p === 'object' && ('type' in p || 'time' in p || 'location' in p)) {
      return { type: p.type ?? '', time: p.time ?? '', location: p.location ?? '', freeNotes: p.notes ?? '', duration: p.duration ?? 90 }
    }
  } catch {}
  return { type: '', time: '', location: '', freeNotes: notes, duration: 90 }
}

function RehearsalSongs({ rehearsal, allSongs }) {
  const songIds = parseJsonArray(rehearsal?.song_ids)
  if (!songIds.length || !allSongs?.length) return null
  const songs = songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean)
  if (!songs.length) return null
  return (
    <div className="rounded-xl border border-rim bg-fill/30 p-4 space-y-2">
      <h4 className="text-sm font-semibold text-body flex items-center gap-2"><Music size={14} /> Temes a estudiar</h4>
      <div className="flex flex-col gap-2">
        {songs.map(song => {
          const atts = parseJsonArray(song.attachments)
          return (
            <div key={song.id} className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-body">{song.title}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {atts.map((a, i) => {
                  const colorCls = ATTACHMENT_COLORS[a.type] ?? 'text-muted'
                  const Icon = a.type === 'score' ? FileText : a.type === 'audio' ? Music : ExternalLink
                  return (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-xs ${colorCls} hover:underline`}>
                      <Icon size={11} /> {a.label}
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RehearsalOverlay({
  rehearsal, members, attendance, isAdmin, saving, allSongs, myMemberId,
  onClose, onSave, onDelete, onToggleStatus, onSetReason, onSubmitNotice,
}) {
  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editType, setEditType] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDuration, setEditDuration] = useState(90)
  const [showNotifyForm, setShowNotifyForm] = useState(false)
  const [notifyMemberId, setNotifyMemberId] = useState('')
  const [notifyReason, setNotifyReason] = useState('viatge')
  const [expandPresent, setExpandPresent] = useState(false)
  const [expandAbsent, setExpandAbsent] = useState(false)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { editing ? setEditing(false) : onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editing])

  useEffect(() => {
    if (rehearsal) {
      const m = parseRehearsalMeta(rehearsal.notes)
      setEditTime(m.time); setEditLocation(m.location); setEditType(m.type); setEditNotes(m.freeNotes); setEditDuration(m.duration ?? 90)
      setEditing(false); setShowNotifyForm(false); setExpandPresent(false); setExpandAbsent(false)
    }
  }, [rehearsal?.id])

  if (!rehearsal) return null

  const meta = parseRehearsalMeta(rehearsal.notes)
  const time = rehearsal.time ?? meta.time
  const loc = rehearsal.location ?? meta.location
  const type = rehearsal.type ?? meta.type
  const duration = meta.duration ?? 90
  const upcoming = isUpcoming(rehearsal.date)
  const myStatus = myMemberId ? (attendance[myMemberId]?.status ?? null) : null

  const stats = { present: 0, absent: 0, excused: 0 }
  for (const m of members) {
    const s = attendance[m.id]?.status ?? (upcoming ? null : 'present')
    if (s) stats[s] = (stats[s] ?? 0) + 1
  }

  async function handleSave() {
    await onSave(rehearsal.id, editType, editTime, editLocation, editNotes, editDuration)
    setEditing(false)
  }

  async function handleSubmitNotice() {
    await onSubmitNotice(notifyMemberId, notifyReason)
    setNotifyMemberId(''); setNotifyReason('viatge'); setShowNotifyForm(false)
  }

  const excusedMembers = members.filter(m => attendance[m.id]?.status === 'excused')

  const presentMembers = members.filter(m => (attendance[m.id]?.status ?? 'present') === 'present')
  const absentExcusedMembers = members.filter(m => {
    const s = attendance[m.id]?.status ?? 'present'
    return s === 'absent' || s === 'excused'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => editing ? setEditing(false) : onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 bg-pane border-l border-rim shadow-2xl w-full sm:w-1/2 sm:max-w-[600px] flex flex-col max-h-[90dvh] sm:max-h-none sm:h-full rounded-t-2xl border-t sm:rounded-none sm:border-t-0 animate-slide-right overflow-hidden">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-2 right-2 z-10 text-ghost hover:text-body transition-colors p-2.5 rounded-lg hover:bg-fill">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-rim shrink-0">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-body">{formatDate(rehearsal.date)}</h2>
                {type && <Badge color="cyan">{REHEARSAL_TYPES[type]}</Badge>}
                {upcoming && <Badge color="amber">{t.attendance.upcoming}</Badge>}
              </div>
              {(time || loc || duration) && !editing && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  {time && <span className="flex items-center gap-1"><Clock size={12} />{time}</span>}
                  {loc  && <span className="flex items-center gap-1"><MapPin size={12} />{loc}</span>}
                  {duration && <span className="flex items-center gap-1"><Clock size={12} />{duration} min</span>}
                </div>
              )}
            </div>
            {!upcoming && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"><Check size={13} />{stats.present}</span>
                <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"><X size={13} />{stats.absent}</span>
                <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400"><Clock size={13} />{stats.excused}</span>
                <span className="text-xs text-ghost">/ {members.length}</span>
              </div>
            )}
          </div>

          {/* Admin edit form */}
          {isAdmin && editing && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Hora</label>
                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Lloc</label>
                  <input type="text" placeholder="Sala, adreça…" value={editLocation} onChange={e => setEditLocation(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Durada (min)</label>
                  <input type="number" min="30" max="300" step="15" value={editDuration} onChange={e => setEditDuration(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Tipus</label>
                <select value={editType} onChange={e => setEditType(e.target.value)}
                  className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500">
                  <option value="">— Tipus —</option>
                  {Object.entries(REHEARSAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Notes</label>
                <Textarea rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes opcionals" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Guardar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel·lar</Button>
                <Button size="sm" variant="ghost" className="ml-auto text-red-500 hover:text-red-400"
                  onClick={() => { onDelete(rehearsal.id); onClose() }}>Eliminar</Button>
              </div>
            </div>
          )}

          {isAdmin && !editing && (
            <button onClick={() => setEditing(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-body transition-colors">
              <Pencil size={12} /> Editar detalls
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <RehearsalSongs rehearsal={rehearsal} allSongs={allSongs} />

          {/* My attendance (upcoming) */}
          {upcoming && myMemberId && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">La meva assistència:</span>
              <button
                onClick={() => onSubmitNotice(myMemberId, '')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  myStatus === 'present'
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-fill text-muted border-rim hover:bg-green-600/10 hover:text-green-400 hover:border-green-700/50'
                }`}>
                <Check size={11} /> Hi vaig
              </button>
              <button
                onClick={() => onSubmitNotice(myMemberId, 'altre')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  myStatus === 'excused' || myStatus === 'absent'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-fill text-muted border-rim hover:bg-red-600/10 hover:text-red-400 hover:border-red-700/50'
                }`}>
                <X size={11} /> No hi vaig
              </button>
            </div>
          )}

          {/* Absence notices (upcoming) */}
          {upcoming && (
            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Bell size={14} /> {t.attendance.absenceNotices}
                </h3>
                {isAdmin && (
                  <button onClick={() => setShowNotifyForm(v => !v)}
                    className="flex items-center gap-1.5 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-700/30 dark:hover:bg-amber-700/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/40 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={12} /> {t.attendance.notComing}
                  </button>
                )}
              </div>
              {isAdmin && showNotifyForm && (
                <div className="flex flex-wrap items-end gap-2 p-3 bg-white dark:bg-pane/50 rounded-lg border border-amber-200 dark:border-amber-700/20">
                  <Select label={t.attendance.whoNotComing} value={notifyMemberId} onChange={e => setNotifyMemberId(e.target.value)}>
                    <option value="">— Selecciona —</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.last_name ? `${m.last_name}, ${m.first_name ?? ''}` : m.name}
                      </option>
                    ))}
                  </Select>
                  <Select label={t.attendance.reason} value={notifyReason} onChange={e => setNotifyReason(e.target.value)}>
                    {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  <button onClick={handleSubmitNotice} disabled={!notifyMemberId}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    {t.attendance.sendNotice}
                  </button>
                  <button onClick={() => setShowNotifyForm(false)} className="text-faint hover:text-body text-sm py-2">{t.cancel}</button>
                </div>
              )}
              {excusedMembers.length === 0
                ? <p className="text-xs text-ghost">{t.attendance.noAbsenceNotices}</p>
                : excusedMembers.map(m => {
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
                          <button onClick={() => onToggleStatus(m.id)} className="ml-auto text-xs text-ghost hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* Member attendance list (past) — compact summary + expandable sections */}
          {!upcoming && (
            <div className="space-y-2">
              {/* Present section */}
              <div className="rounded-xl border border-rim overflow-hidden">
                <button onClick={() => setExpandPresent(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-fill/40 transition-colors">
                  <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <Check size={14} /> {t.attendanceStatus.present}
                    <span className="text-xs font-bold bg-green-700/20 text-green-400 px-1.5 py-0.5 rounded-full">{presentMembers.length}</span>
                  </span>
                  <ChevronDown size={14} className={`text-ghost transition-transform ${expandPresent ? 'rotate-180' : ''}`} />
                </button>
                {expandPresent && (
                  <div className="border-t border-rim divide-y divide-rim/50">
                    {presentMembers.map(m => {
                      const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-fill/20 transition-colors">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: c.bg, color: c.fg }}>{memberInitials(m)}</span>
                          <div className="flex-1 min-w-0 text-sm text-body truncate">
                            {m.last_name ? <><span className="font-medium">{m.last_name}</span>{m.first_name ? `, ${m.first_name}` : ''}</> : m.name}
                          </div>
                          {isAdmin && (
                            <button onClick={() => onToggleStatus(m.id)}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 transition-colors bg-green-100 border-green-300 text-green-700 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50 hover:opacity-70">
                              <Check size={10} /> {t.attendanceStatus.present}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Absent/excused section */}
              {absentExcusedMembers.length > 0 && (
                <div className="rounded-xl border border-rim overflow-hidden">
                  <button onClick={() => setExpandAbsent(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-fill/40 transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                      <X size={14} /> Absents
                      <span className="text-xs font-bold bg-red-700/20 text-red-400 px-1.5 py-0.5 rounded-full">{absentExcusedMembers.length}</span>
                    </span>
                    <ChevronDown size={14} className={`text-ghost transition-transform ${expandAbsent ? 'rotate-180' : ''}`} />
                  </button>
                  {expandAbsent && (
                    <div className="border-t border-rim divide-y divide-rim/50">
                      {absentExcusedMembers.map(m => {
                        const status = attendance[m.id]?.status ?? 'absent'
                        const reason = attendance[m.id]?.reason ?? ''
                        const cfg = STATUS_CONFIG[status]
                        const StatusIcon = cfg.icon
                        const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                        return (
                          <div key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-fill/20 transition-colors">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ backgroundColor: c.bg, color: c.fg }}>{memberInitials(m)}</span>
                            <div className="flex-1 min-w-0 text-sm text-body truncate">
                              {m.last_name ? <><span className="font-medium">{m.last_name}</span>{m.first_name ? `, ${m.first_name}` : ''}</> : m.name}
                            </div>
                            {isAdmin && (
                              <select value={reason} onChange={e => onSetReason(m.id, e.target.value)}
                                className="text-xs bg-fill border border-line rounded-lg px-2 py-1 text-muted focus:outline-none focus:border-cyan-500">
                                <option value="">Motiu…</option>
                                {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            )}
                            {!isAdmin && reason && <span className="text-xs text-ghost">{REASONS[reason]?.label}</span>}
                            {isAdmin ? (
                              <button onClick={() => onToggleStatus(m.id)}
                                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 transition-colors ${cfg.cls}`}>
                                <StatusIcon size={10} /> {cfg.label}
                              </button>
                            ) : (
                              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${cfg.cls}`}>
                                <StatusIcon size={10} /> {cfg.label}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {saving && (
          <div className="shrink-0 px-5 py-2 border-t border-rim text-xs text-ghost">{t.saving}</div>
        )}
      </div>
    </div>
  )
}
