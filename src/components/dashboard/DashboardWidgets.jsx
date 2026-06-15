import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clapperboard, CalendarDays, ArrowRight, MapPin, Clock, X, Check } from '../../lib/icons'
import { ICON } from '../../lib/ui'
import { VOICE_COLORS, VOICE_SHORT } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { t } from '../../locales/ca'

const REHEARSAL_TYPES = t.rehearsalTypes

export function parseRehearsalMeta(notes) {
  if (!notes) return { type: '', freeNotes: '' }
  try {
    const p = JSON.parse(notes)
    if (p && typeof p === 'object' && 'type' in p) return { type: p.type ?? '', freeNotes: p.notes ?? '' }
  } catch {}
  return { type: '', freeNotes: notes }
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

// ─── Attendance sparkline ─────────────────────────────────────────────────────

export function AttendanceSparkline({ data }) {
  if (!data?.length) return null
  const W = 120, H = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (v / 100) * H
    return `${x},${y}`
  }).join(' ')
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length)
  return (
    <div className="flex items-center gap-2">
      <svg width={W} height={H} className="shrink-0">
        <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - (v / 100) * H} r="2" fill="#22d3ee" />
        ))}
      </svg>
      <span className="text-xs text-muted">∅ {avg}%</span>
    </div>
  )
}

// ─── Readiness bar ────────────────────────────────────────────────────────────

export function ReadinessBar({ label, pct, loading }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-ghost shrink-0 w-14 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-raised rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${loading ? 0 : pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#6b7280' }} />
      </div>
      <span className="text-xs text-ghost shrink-0 w-7 text-right">{loading ? '…' : `${Math.round(pct)}%`}</span>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

export function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-rim bg-pane p-4 flex flex-col gap-1">
      <p className="text-2xl font-bold text-body">{loading ? '—' : value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}

// ─── Voice distribution bar ───────────────────────────────────────────────────

const CHOIR_VOICES = ['soprano1', 'soprano2', 'alto1', 'alto2', 'tenor1', 'tenor2', 'baritone', 'bass']

export function VoiceDistributionBar({ members }) {
  const counts = {}
  for (const m of members) {
    if (CHOIR_VOICES.includes(m.voice)) counts[m.voice] = (counts[m.voice] ?? 0) + 1
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (!total) return null
  return (
    <div className="space-y-1.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {CHOIR_VOICES.filter(v => counts[v]).map(v => (
          <div key={v} style={{ width: `${(counts[v] / total) * 100}%`, background: VOICE_COLORS[v].bg }}
            title={`${VOICE_SHORT[v]}: ${counts[v]}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {CHOIR_VOICES.filter(v => counts[v]).map(v => (
          <span key={v} className="flex items-center gap-1 text-xs text-muted">
            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: VOICE_COLORS[v].bg }} />
            {VOICE_SHORT[v]} <span className="text-ghost">{counts[v]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Next show card ───────────────────────────────────────────────────────────

function CountdownBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <span className="text-xs text-faint">Ja passat</span>
  if (days === 0) return <span className="text-xs font-semibold text-amber-400">Avui!</span>
  if (days === 1) return <span className="text-xs font-semibold text-amber-400">Demà!</span>
  return (
    <span className="text-xs text-muted flex items-center gap-1">
      <Clock size={ICON.xs} /> {days} dies
    </span>
  )
}

export function NextShowCard({ show, readiness, readinessLoading, extraLinks }) {
  const days = daysUntil(show.date)
  return (
    <div className="rounded-xl border border-rim bg-pane overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        {show.poster_url ? (
          <div className="sm:w-28 shrink-0 aspect-[2/1] sm:aspect-auto">
            <img src={show.poster_url} alt={show.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="sm:w-28 shrink-0 hidden sm:flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <Clapperboard size={28} className="text-ghost" />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Proper espectacle</p>
              <h2 className="text-lg font-bold text-body leading-tight">{show.name}</h2>
            </div>
            {days !== null && <CountdownBadge days={days} />}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            {show.date && (
              <span className="flex items-center gap-1">
                <CalendarDays size={ICON.xs} />
                {new Date(show.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {show.venue && (
              <span className="flex items-center gap-1"><MapPin size={ICON.xs} /> {show.venue}</span>
            )}
          </div>
          {readiness && (
            <div className="space-y-1.5 py-1 border-t border-rim">
              {readiness.positions != null && <ReadinessBar label="Posicions" pct={readiness.positions} loading={readinessLoading} />}
              {readiness.lights != null && <ReadinessBar label="Llums" pct={readiness.lights} loading={readinessLoading} />}
              {readiness.mics != null && <ReadinessBar label="Micròfons" pct={readiness.mics} loading={readinessLoading} />}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-auto">
            <Link to={`/show/${show.id}`}>
              <Button size="sm">Setlist <ArrowRight size={ICON.xs} /></Button>
            </Link>
            {extraLinks}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upcoming rehearsals ──────────────────────────────────────────────────────

function formatDateShort(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysUntilRehearsal(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T12:00:00'); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function RehearsalMiniCard({ rehearsal, attendanceMap, myMemberId }) {
  const meta = parseRehearsalMeta(rehearsal.notes)
  const time  = rehearsal.time     ?? meta.time
  const loc   = rehearsal.location ?? meta.location
  const type  = rehearsal.type     ?? meta.type
  const days  = daysUntilRehearsal(rehearsal.date)
  const att   = attendanceMap[rehearsal.id] ?? {}
  const excusedCount = Object.values(att).filter(a => a.status === 'excused').length
  const absentCount  = Object.values(att).filter(a => a.status === 'absent').length

  const [myStatus, setMyStatus] = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!myMemberId) return
    supabase.from('attendance').select('status')
      .eq('rehearsal_id', rehearsal.id).eq('member_id', myMemberId)
      .then(({ data }) => setMyStatus(data?.[0]?.status ?? null))
  }, [rehearsal.id, myMemberId])

  async function toggle(e) {
    e.preventDefault()
    if (!myMemberId || saving) return
    setSaving(true)
    const next = myStatus === 'present' ? 'excused' : 'present'
    await supabase.from('attendance').upsert(
      { rehearsal_id: rehearsal.id, member_id: myMemberId, status: next, reason: '' },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setMyStatus(next)
    setSaving(false)
  }

  return (
    <div className="rounded-xl border border-rim bg-pane p-3 flex flex-col gap-2 hover:border-wire transition-colors">
      <Link to="/attendance" className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-body">{formatDateShort(rehearsal.date)}</span>
        <span className={`text-xs shrink-0 ${days === 0 ? 'text-amber-400 font-semibold' : days === 1 ? 'text-amber-400' : 'text-ghost'}`}>
          {days === 0 ? 'Avui' : days === 1 ? 'Demà' : `${days}d`}
        </span>
      </Link>
      {(time || loc) && (
        <div className="flex flex-col gap-0.5 text-xs text-muted">
          {time && <span className="flex items-center gap-1"><Clock size={10} />{time}</span>}
          {loc  && <span className="flex items-center gap-1"><MapPin size={10} />{loc}</span>}
        </div>
      )}
      {type && <Badge color="cyan" className="self-start">{REHEARSAL_TYPES[type]}</Badge>}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-rim/60">
        {myMemberId ? (
          <button onClick={toggle} disabled={saving}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
              myStatus === 'present'
                ? 'bg-green-700/20 text-green-300 border-green-700/40 hover:bg-green-700/30'
                : myStatus === 'excused' || myStatus === 'absent'
                ? 'bg-red-700/20 text-red-300 border-red-700/40 hover:bg-red-700/30'
                : 'bg-fill text-muted border-rim hover:border-wire hover:text-body'
            }`}>
            {myStatus === 'present'
              ? <><Check size={10} /> Hi vaig</>
              : myStatus === 'excused' || myStatus === 'absent'
              ? <><X size={10} /> No hi vaig</>
              : 'Confirma'}
          </button>
        ) : <span />}
        {(excusedCount > 0 || absentCount > 0) && (
          <div className="flex items-center gap-2 text-xs text-ghost">
            {excusedCount > 0 && <span className="flex items-center gap-1 text-amber-400"><Clock size={10} />{excusedCount}</span>}
            {absentCount  > 0 && <span className="flex items-center gap-1 text-red-400"><X size={10} />{absentCount}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export function UpcomingRehearsals({ rehearsals, attendanceMap, myMemberId }) {
  if (!rehearsals.length) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Propers assajos</h3>
        <Link to="/attendance" className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 transition-colors">
          Veure tots <ArrowRight size={ICON.xs} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rehearsals.map(r => (
          <RehearsalMiniCard key={r.id} rehearsal={r} attendanceMap={attendanceMap} myMemberId={myMemberId} />
        ))}
      </div>
    </div>
  )
}

// ─── Mini show card ───────────────────────────────────────────────────────────

export function MiniShowCard({ show }) {
  const navigate = useNavigate()
  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/show/${show.id}`)}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-rim group-hover:border-wire transition-colors">
        {show.poster_url ? (
          <img src={show.poster_url} alt={show.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-800 to-gray-900 p-4">
            <Clapperboard size={24} className="text-ghost" />
            <p className="text-body text-sm font-semibold text-center leading-snug">{show.name}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-2 px-0.5 space-y-0.5">
        <p className="text-body text-sm font-medium truncate">{show.name}</p>
        <p className="text-xs text-faint truncate">
          {show.date && new Date(show.date).toLocaleDateString('ca-ES')}
          {show.date && show.venue && ' · '}
          {show.venue}
        </p>
      </div>
    </div>
  )
}
