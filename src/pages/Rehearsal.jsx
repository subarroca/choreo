import { useState, useEffect } from 'react'
import { t } from '../locales/ca'
import { parseJson } from '../lib/parseJson'
import { CalendarDays, Plus, Clock, MapPin, ChevronDown, Check, X } from '../lib/icons'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth.jsx'
import { inputCls } from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import SummaryView from '../components/SummaryView'
import RehearsalOverlay from '../components/rehearsal/RehearsalOverlay'
import RehearsalScheduleConfig from '../components/rehearsal/RehearsalScheduleConfig'
import SongCoverageView from '../components/rehearsal/SongCoverageView'
import { formatDate, isUpcoming } from '../lib/formatters'
import { useRehearsalData } from '../hooks/useRehearsalData'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
import { SkeletonRow } from '../components/ui/Skeleton'

const REHEARSAL_TYPES = t.rehearsalTypes

function parseRehearsalMeta(notes) {
  if (!notes) return { type: '', time: '', location: '', freeNotes: '' }
  try {
    const p = parseJson(notes)
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
    members, rehearsals, setRehearsals, schedule, setSchedule, selectedId, setSelectedId,
    attendance, loading, saving,
    summaryData, loadSummary,
    addRehearsal, saveRehearsalMeta, deleteRehearsal,
    toggleStatus, setReason, submitNotice,
  } = useRehearsalData()

  const { data: allSongs = [] } = useSupabaseQuery(async () => {
    const { data } = await supabase.from('repertoire_songs')
      .select('id, title, composer, attachments, target_rehearsals')
      .eq('type', 'song')
      .order('title')
    return data ?? []
  }, [])

  const { data: shows = [] } = useSupabaseQuery(async () => {
    const { data } = await supabase.from('shows').select('id, name, date').not('date', 'is', null).order('date')
    return data ?? []
  }, [])

  const [tab, setTab] = useState('assajos')
  const [showAllRehearsals, setShowAllRehearsals] = useState(false)

  // New rehearsal form
  const [addingDate, setAddingDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newType, setNewType] = useState('')
  const [newNotes, setNewNotes] = useState('')

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

  const overlayRehearsal = rehearsals.find(r => r.id === selectedId) ?? null

  const tabs = (
    <div className="flex gap-1">
      {[['assajos', t.attendance.tabRehearsals], ['resum', t.attendance.tabSummary], ['cançons', t.attendance.tabSongs]].map(([key, label]) => (
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
      {saving && <span className="text-xs text-ghost">{t.saving}</span>}
      {isAdmin && tab === 'assajos' && (
        <Button size="sm" onClick={() => setAddingDate(v => !v)}>
          <Plus size={14} /> {t.attendance.newRehearsal}
        </Button>
      )}
    </div>
  )

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <Layout fullWidth>
      <PageContainer
        header={<PageHeader title={t.attendance.pageTitle} icon={CalendarDays} actions={headerActions} tabs={tabs} />}
      >
        <div className="space-y-4 pt-2">

          {/* New rehearsal form */}
          {isAdmin && addingDate && (
            <div className="rounded-xl border border-line bg-pane p-4 space-y-3">
              <h3 className="text-sm font-semibold text-body">{t.attendance.newRehearsal}</h3>
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
                <Button size="sm" onClick={addRehearsalDate} disabled={!newDate}>{t.attendance.addRehearsal}</Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>{t.cancel}</Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="divide-y divide-rim rounded-xl border border-rim overflow-hidden">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : tab === 'assajos' ? (
            <div className="space-y-4">
              {isAdmin && (
                <RehearsalScheduleConfig
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  existingDates={rehearsals.map(r => r.date)}
                  onRehearsalsGenerated={newReh => setRehearsals(prev =>
                    [...prev, ...newReh].sort((a, b) => a.date < b.date ? -1 : 1)
                  )}
                />
              )}

              {rehearsals.length === 0 ? (
                <EmptyState icon={CalendarDays} title={t.attendance.emptyHint} />
              ) : (() => {
                const past = rehearsals.filter(r => r.date < todayStr)
                const upcoming = rehearsals.filter(r => r.date >= todayStr)
                const hidden = [...past.slice(0, -1), ...upcoming.slice(3)]
                const visible = showAllRehearsals
                  ? rehearsals
                  : [...past.slice(-1), ...upcoming.slice(0, 3)]

                return (
                  <div className="rounded-xl border border-rim overflow-hidden divide-y divide-rim">
                    {visible.map(r => {
                      const meta = parseRehearsalMeta(r.notes)
                      const time = r.time ?? meta.time
                      const loc  = r.location ?? meta.location
                      const type = r.type ?? meta.type
                      const isNext = isUpcoming(r.date)
                      const isPast = r.date < todayStr

                      const trailing = (
                        <div className="flex items-center gap-1.5">
                          {type && <Badge color="cyan">{REHEARSAL_TYPES[type]}</Badge>}
                          {isNext && <Badge color="amber">{t.attendance.upcoming}</Badge>}
                        </div>
                      )

                      const metaText = (time || loc) ? (
                        <span className="flex items-center gap-2">
                          {time && <span className="flex items-center gap-1"><Clock size={11} />{time}</span>}
                          {loc  && <span className="flex items-center gap-1"><MapPin size={11} />{loc}</span>}
                        </span>
                      ) : undefined

                      return (
                        <ListRow
                          key={r.id}
                          leading={<CalendarDays size={16} className={isPast && !isNext ? 'text-ghost' : 'text-cyan-500'} />}
                          title={<span className={isPast && !isNext ? 'text-muted' : 'text-body'}>{formatDate(r.date)}</span>}
                          meta={metaText}
                          trailing={trailing}
                          onClick={() => setSelectedId(r.id)}
                        />
                      )
                    })}
                    {!showAllRehearsals && hidden.length > 0 && (
                      <button onClick={() => setShowAllRehearsals(true)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted hover:text-body py-3 transition-colors hover:bg-fill/40">
                        <ChevronDown size={13} /> {t.attendance.showAll(rehearsals.length)}
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : tab === 'resum' ? (
            <SummaryView members={members} rehearsals={rehearsals} summaryData={summaryData} />
          ) : (
            <SongCoverageView rehearsals={rehearsals} allSongs={allSongs} shows={shows} />
          )}
        </div>
      </PageContainer>

      {overlayRehearsal && (
        <RehearsalOverlay
          rehearsal={overlayRehearsal}
          members={members}
          attendance={attendance}
          isAdmin={isAdmin}
          saving={saving}
          allSongs={allSongs}
          onClose={() => setSelectedId(null)}
          onSave={saveRehearsalMeta}
          onDelete={deleteRehearsal}
          onToggleStatus={toggleStatus}
          onSetReason={setReason}
          onSubmitNotice={submitNotice}
        />
      )}
    </Layout>
  )
}
