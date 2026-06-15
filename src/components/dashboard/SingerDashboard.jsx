import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, LayoutDashboard, ArrowRight, MapPin, CalendarClock, Music, Check, X, ExternalLink, FileText, ChevronDown, ChevronUp, Users } from '../../lib/icons'
import { t } from '../../locales/ca'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useMyMember } from '../../hooks/useMyMember.js'
import { supabase } from '../../lib/supabase'
import { ICON } from '../../lib/ui'
import { daysUntil, parseRehearsalMeta } from './DashboardWidgets.jsx'
import Badge from '../ui/Badge'
import UpcomingBirthdays from './UpcomingBirthdays'
import { VOICE_COLORS, VOICE_LABELS } from '../../lib/constants'
import { t } from '../../locales/ca'

const REHEARSAL_TYPES = t.rehearsalTypes

const ATTACHMENT_COLORS = {
  reference: 'text-blue-400',
  score:     'text-purple-400',
  audio:     'text-green-400',
}

function AttachmentLink({ att }) {
  const colorCls = ATTACHMENT_COLORS[att.type] ?? 'text-muted'
  const Icon = att.type === 'score' ? FileText : att.type === 'audio' ? Music : ExternalLink
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-1 text-xs ${colorCls} hover:underline`}>
      <Icon size={11} /> {att.label}
    </a>
  )
}

function SongsList({ songIds, allSongs }) {
  const [expanded, setExpanded] = useState(false)
  if (!songIds?.length || !allSongs?.length) return null
  const songs = songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean)
  if (!songs.length) return null
  const visible = expanded ? songs : songs.slice(0, 2)
  const hidden = songs.length - 2

  return (
    <div className="mt-2 pt-2 border-t border-rim/60">
      <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1">
        <Music size={11} /> Temes a estudiar
      </p>
      <div className="flex flex-col gap-1.5">
        {visible.map(song => {
          let atts = []
          try { atts = JSON.parse(song.attachments || '[]') } catch {}
          return (
            <div key={song.id} className="bg-fill/30 rounded-lg px-2 py-1.5">
              <p className="text-xs font-medium text-body truncate">{song.title}</p>
              {atts.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {atts.slice(0, 2).map((a, i) => <AttachmentLink key={i} att={a} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {songs.length > 2 && (
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-muted hover:text-body mt-1.5 transition-colors">
          {expanded
            ? <><ChevronUp size={11} /> Amaga</>
            : <><ChevronDown size={11} /> {hidden} temes més</>}
        </button>
      )}
    </div>
  )
}

function AttendancePill({ status, saving, onToggle }) {
  if (status === 'excused' || status === 'absent') {
    return (
      <button onClick={onToggle} disabled={saving}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 transition-colors bg-red-700/20 text-red-300 border-red-700/40 hover:bg-red-700/30">
        <X size={11} /> No hi vaig
      </button>
    )
  }
  if (status === 'present') {
    return (
      <button onClick={onToggle} disabled={saving}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 transition-colors bg-green-700/20 text-green-300 border-green-700/40 hover:bg-green-700/30">
        <Check size={11} /> Hi vaig
      </button>
    )
  }
  return (
    <button onClick={onToggle} disabled={saving}
      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 transition-colors bg-fill text-muted border-rim hover:border-wire hover:text-body">
      Confirma assistència
    </button>
  )
}

function RehearsalCard({ rehearsal, isFirst, nextShow, allSongs, myMemberId, sectionMembers, rehearsalAttendance }) {
  const meta = parseRehearsalMeta(rehearsal.notes)
  const time  = rehearsal.time     ?? meta.time
  const loc   = rehearsal.location ?? meta.location
  const type  = rehearsal.type     ?? meta.type
  const days  = daysUntil(rehearsal.date)
  const dateLabel = new Date(rehearsal.date + 'T12:00:00').toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  let songIds = []
  try { songIds = JSON.parse(rehearsal.song_ids || '[]') } catch {}

  const [attStatus, setAttStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!myMemberId) return
    supabase.from('attendance').select('status')
      .eq('rehearsal_id', rehearsal.id).eq('member_id', myMemberId)
      .then(({ data }) => { setAttStatus(data?.[0]?.status ?? null) })
  }, [rehearsal.id, myMemberId])

  async function toggleAttendance() {
    if (!myMemberId) return
    setSaving(true)
    const next = attStatus === 'excused' || attStatus === 'absent' ? 'present'
      : attStatus === 'present' ? 'excused' : 'present'
    await supabase.from('attendance').upsert(
      { rehearsal_id: rehearsal.id, member_id: myMemberId, status: next, reason: '' },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setAttStatus(next)
    setSaving(false)
  }

  return (
    <div className={`rounded-xl border bg-pane p-4 ${isFirst ? 'border-cyan-500/40' : 'border-rim'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5 truncate">
            {isFirst ? t.dashboard.nextRehearsal : t.dashboard.rehearsal}
          </p>
          <p className="text-base font-bold text-body capitalize">{dateLabel}</p>
        </div>
        {days !== null && (
          <span className={`text-xs font-semibold shrink-0 ${days <= 1 ? 'text-amber-400' : 'text-ghost'}`}>
            {days === 0 ? 'Avui!' : days === 1 ? 'Demà!' : `${days}d`}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted mb-2">
        {loc && <span className="flex items-center gap-1"><MapPin size={ICON.xs} />{loc}</span>}
        {time && <span className="flex items-center gap-1"><CalendarClock size={ICON.xs} />{time}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {type && <Badge color="cyan">{REHEARSAL_TYPES[type] ?? type}</Badge>}
        {myMemberId && (
          <AttendancePill status={attStatus} saving={saving} onToggle={toggleAttendance} />
        )}
      </div>
      <SongsList songIds={songIds} allSongs={allSongs} />
      {sectionMembers?.length > 0 && (
        <SectionAttendanceBlock rehearsal={rehearsal} sectionMembers={sectionMembers} rehearsalAttendance={rehearsalAttendance} />
      )}
    </div>
  )
}

// ─── Section attendance for cap_de_corda ─────────────────────────────────────

function SectionMemberPill({ member, status }) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const statusCls = status === 'present'
    ? 'ring-1 ring-green-500/60'
    : status === 'excused' || status === 'absent'
    ? 'ring-1 ring-red-500/60 opacity-50'
    : ''
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-fill text-xs ${statusCls}`}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
        style={{ backgroundColor: c.bg, color: c.fg }}>
        {member.initials?.slice(0, 2) ?? (member.first_name?.[0] ?? '')}
      </span>
      <span className="text-body truncate">{member.first_name}</span>
      {status === 'present' && <Check size={9} className="text-green-400 shrink-0" />}
      {(status === 'excused' || status === 'absent') && <X size={9} className="text-red-400 shrink-0" />}
    </div>
  )
}

function SectionAttendanceBlock({ rehearsal, sectionMembers, rehearsalAttendance }) {
  const attMap = rehearsalAttendance?.[rehearsal.id] ?? {}
  if (!sectionMembers.length) return null
  const confirmed   = sectionMembers.filter(m => attMap[m.id]?.status === 'present')
  const absent      = sectionMembers.filter(m => attMap[m.id]?.status === 'excused' || attMap[m.id]?.status === 'absent')
  const unconfirmed = sectionMembers.filter(m => !attMap[m.id])
  return (
    <div className="mt-2 pt-2 border-t border-rim/60">
      <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1">
        <Users size={11} /> La meva corda
        <span className="text-green-400 ml-1">{confirmed.length}✓</span>
        {absent.length > 0 && <span className="text-red-400">{absent.length}✗</span>}
        {unconfirmed.length > 0 && <span className="text-ghost">{unconfirmed.length}?</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[...confirmed, ...unconfirmed, ...absent].map(m => (
          <SectionMemberPill key={m.id} member={m} status={attMap[m.id]?.status ?? null} />
        ))}
      </div>
    </div>
  )
}

export default function SingerDashboard({ nextShow, upcomingRehearsals, members, allSongs, rehearsalAttendance }) {
  const { can, persona } = useAuth()
  const myMember = useMyMember()
  const isCapDeCorda = persona === 'cap_de_corda'
  const sectionMembers = isCapDeCorda && myMember
    ? (members ?? []).filter(m => m.voice === myMember.voice && m.id !== myMember.id)
    : []

  return (
    <div className="space-y-6">
      {upcomingRehearsals?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Propers assajos</h3>
            <Link to="/attendance" className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 transition-colors">
              Tots <ArrowRight size={ICON.xs} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {upcomingRehearsals.slice(0, 3).map((r, i) => (
              <RehearsalCard key={r.id} rehearsal={r} isFirst={i === 0}
                nextShow={nextShow} allSongs={allSongs} myMemberId={myMember?.id}
                sectionMembers={sectionMembers} rehearsalAttendance={rehearsalAttendance} />
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Accés ràpid</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {nextShow && (
            <Link to={`/show/${nextShow.id}/rehearsal`}
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <LayoutDashboard size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium text-center">La meva posició</span>
            </Link>
          )}
          {can('repertoire', 'view') && (
            <Link to="/songs"
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <BookOpen size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium">Repertori</span>
            </Link>
          )}
          <Link to="/attendance"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <CalendarDays size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Assajos</span>
          </Link>
        </div>
      </div>

      <UpcomingBirthdays members={members} />
    </div>
  )
}
