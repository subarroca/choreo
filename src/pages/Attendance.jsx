import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Plus, Check, X, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'
import { confirmDialog } from '../components/ui/ConfirmDialog'

const STATUS_CONFIG = {
  present:  { label: 'Present',  icon: Check,  cls: 'bg-green-700/30 text-green-300 border-green-700/50' },
  absent:   { label: 'Absent',   icon: X,      cls: 'bg-red-700/30 text-red-300 border-red-700/50' },
  excused:  { label: 'Excusat', icon: Clock,  cls: 'bg-amber-700/30 text-amber-300 border-amber-700/50' },
}
const STATUS_CYCLE = ['present', 'absent', 'excused']

function deriveInitials(m) {
  if (m.last_name) return (m.last_name[0] + (m.first_name?.[0] ?? '')).toUpperCase()
  return ((m.name || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2)).toUpperCase() || '?'
}

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Attendance() {
  const { id: showId } = useParams()

  const [show, setShow] = useState(null)
  const [members, setMembers] = useState([])
  const [exclusions, setExclusions] = useState(new Set())
  const [dates, setDates] = useState([])       // sorted ISO date strings
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendance, setAttendance] = useState({}) // member_id → status
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingDate, setAddingDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    async function load() {
      const [showRes, membersRes, exclusionsRes, attRes] = await Promise.all([
        supabase.from('shows').select('id, name').eq('id', showId).single(),
        supabase.from('members').select('*').eq('active', true).order('last_name').order('first_name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('attendance').select('*').eq('show_id', showId),
      ])
      setShow(showRes.data)
      setMembers(membersRes.data ?? [])
      setExclusions(new Set((exclusionsRes.data ?? []).map(e => e.member_id)))

      const attRows = attRes.data ?? []
      const uniqueDates = [...new Set(attRows.map(r => r.date))].sort()
      setDates(uniqueDates)
      if (uniqueDates.length) setSelectedDate(uniqueDates[uniqueDates.length - 1])
      setLoading(false)
    }
    load()
  }, [showId])

  useEffect(() => {
    if (!selectedDate) { setAttendance({}); return }
    async function loadDate() {
      const { data } = await supabase
        .from('attendance').select('member_id, status')
        .eq('show_id', showId).eq('date', selectedDate)
      const map = {}
      for (const r of (data ?? [])) map[r.member_id] = r.status
      setAttendance(map)
    }
    loadDate()
  }, [showId, selectedDate])

  async function addDate() {
    if (!newDate) return
    if (!dates.includes(newDate)) {
      setDates(prev => [...prev, newDate].sort())
    }
    setSelectedDate(newDate)
    setNewDate('')
    setAddingDate(false)
    setAttendance({})
  }

  async function deleteDate(date) {
    if (!(await confirmDialog(`Eliminar la data ${formatDate(date)} i tots els registres?`))) return
    await supabase.from('attendance').delete().eq('show_id', showId).eq('date', date)
    const newDates = dates.filter(d => d !== date)
    setDates(newDates)
    setSelectedDate(newDates.length ? newDates[newDates.length - 1] : null)
  }

  async function toggleStatus(memberId) {
    if (!selectedDate) return
    const current = attendance[memberId] ?? 'present'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    setAttendance(prev => ({ ...prev, [memberId]: next }))
    setSaving(true)
    await supabase.from('attendance').upsert(
      { show_id: showId, member_id: memberId, date: selectedDate, status: next },
      { onConflict: 'show_id,member_id,date' }
    )
    setSaving(false)
  }

  const activeMembers = members.filter(m => !exclusions.has(m.id))

  // Summary: per each date, count statuses
  const summaryByDate = dates.map(date => ({
    date,
    counts: { present: 0, absent: 0, excused: 0 },
  }))

  // Stats for selected date
  const stats = { present: 0, absent: 0, excused: 0 }
  if (selectedDate) {
    for (const m of activeMembers) {
      const s = attendance[m.id] ?? 'present'
      stats[s] = (stats[s] ?? 0) + 1
    }
  }

  const inputCls = 'bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300'

  return (
    <Layout>
      <div className="space-y-4">
        <ShowToolbar showId={showId} showName={show?.name} />

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-body flex items-center gap-2">
            <CalendarDays size={20} className="text-cyan-500" /> Assistència
          </h1>
          {saving && <span className="text-xs text-ghost">Guardant…</span>}
        </div>

        {loading ? <p className="text-faint text-sm">Carregant...</p> : (
          <div className="space-y-4">
            {/* Date tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {dates.map(date => (
                <div key={date} className="relative group">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedDate === date
                        ? 'bg-cyan-700/30 border-cyan-600 text-cyan-300'
                        : 'border-line text-muted hover:text-body hover:bg-fill'
                    }`}>
                    {formatDate(date)}
                  </button>
                  <button
                    onClick={() => deleteDate(date)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-700 text-white hidden group-hover:flex items-center justify-center"
                    title="Eliminar data">
                    <X size={8} />
                  </button>
                </div>
              ))}
              {addingDate ? (
                <div className="flex items-center gap-2">
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className={inputCls + ' py-1'} />
                  <button onClick={addDate}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                    Afegir
                  </button>
                  <button onClick={() => { setAddingDate(false); setNewDate('') }}
                    className="text-faint hover:text-body text-sm px-3 py-1.5 rounded-lg transition-colors">
                    Cancel·lar
                  </button>
                </div>
              ) : (
                <button onClick={() => setAddingDate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed border-line text-faint hover:text-body hover:border-wire transition-colors">
                  <Plus size={13} /> Nova data
                </button>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-16 text-ghost">
                <CalendarDays size={40} className="mx-auto mb-4 opacity-30" />
                <p>Crea una data per registrar l'assistència.</p>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="flex items-center gap-4 px-4 py-3 bg-pane border border-rim rounded-xl">
                  <span className="text-sm font-semibold text-body">{formatDate(selectedDate)}</span>
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="flex items-center gap-1.5 text-sm text-green-400">
                      <Check size={13} /> {stats.present}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-red-400">
                      <X size={13} /> {stats.absent}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-amber-400">
                      <Clock size={13} /> {stats.excused}
                    </span>
                    <span className="text-xs text-ghost">/ {activeMembers.length}</span>
                  </div>
                </div>

                {/* Member list */}
                <div className="space-y-1.5">
                  {activeMembers.map(m => {
                    const status = attendance[m.id] ?? 'present'
                    const cfg = STATUS_CONFIG[status]
                    const StatusIcon = cfg.icon
                    const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                    return (
                      <button key={m.id} onClick={() => toggleStatus(m.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-pane hover:bg-fill/50 transition-colors text-left">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: c.bg, color: c.fg }}>
                          {deriveInitials(m)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-body truncate">
                            {m.last_name
                              ? <><span className="font-semibold">{m.last_name}</span>{m.first_name ? `, ${m.first_name}` : ''}</>
                              : <span className="font-medium">{m.name}</span>
                            }
                          </div>
                          <div className="text-xs font-medium" style={{ color: c.bg }}>
                            {VOICE_LABELS[m.voice]}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${cfg.cls}`}>
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Summary toggle */}
                {dates.length > 1 && (
                  <div className="pt-2">
                    <button onClick={() => setShowSummary(v => !v)}
                      className="flex items-center gap-2 text-xs text-faint hover:text-body transition-colors">
                      {showSummary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Resum de totes les dates
                    </button>
                    {showSummary && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="text-xs border-collapse w-full">
                          <thead>
                            <tr>
                              <th className="text-left px-2 py-1.5 text-ghost font-normal border-b border-rim">Persona</th>
                              {dates.map(d => (
                                <th key={d} className="px-2 py-1.5 text-ghost font-normal border-b border-rim text-center whitespace-nowrap">
                                  {formatDate(d)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeMembers.map(m => (
                              <SummaryRow key={m.id} member={m} showId={showId} dates={dates} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function SummaryRow({ member, showId, dates }) {
  const [rowData, setRowData] = useState(null)

  useEffect(() => {
    supabase.from('attendance').select('date, status')
      .eq('show_id', showId).eq('member_id', member.id)
      .then(({ data }) => {
        const map = {}
        for (const r of (data ?? [])) map[r.date] = r.status
        setRowData(map)
      })
  }, [showId, member.id])

  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra

  return (
    <tr className="hover:bg-fill/30 transition-colors">
      <td className="px-2 py-1.5 border-b border-rim/50 text-body">
        {member.last_name
          ? <><span className="font-semibold">{member.last_name}</span>{member.first_name ? `, ${member.first_name}` : ''}</>
          : member.name
        }
        <span className="ml-1.5 text-ghost" style={{ color: c.bg + 'aa' }}>{VOICE_LABELS[member.voice]?.slice(0, 1)}</span>
      </td>
      {dates.map(d => {
        const s = rowData?.[d]
        if (!rowData) return <td key={d} className="px-2 py-1.5 border-b border-rim/50 text-center text-ghost">…</td>
        return (
          <td key={d} className="px-2 py-1.5 border-b border-rim/50 text-center">
            {s === 'present' && <span className="text-green-400">✓</span>}
            {s === 'absent'  && <span className="text-red-400">✗</span>}
            {s === 'excused' && <span className="text-amber-400">~</span>}
            {!s && <span className="text-gray-700">—</span>}
          </td>
        )
      })}
    </tr>
  )
}
