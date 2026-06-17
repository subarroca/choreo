// Upcoming birthdays widget — compact grid with featured card for today
import { VOICE_COLORS } from '../../lib/constants'
import { memberInitials } from '../../lib/formatters'
import { Icons } from '../../lib/icons'
const PartyPopper = Icons.achieveWelcome

function daysUntilBirthday(birthDate) {
  if (!birthDate) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [, mm, dd] = birthDate.split('-')
  let next = new Date(today.getFullYear(), parseInt(mm) - 1, parseInt(dd))
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.round((next - today) / 86400000)
}

function birthdayDateLabel(birthDate) {
  const [, mm, dd] = birthDate.split('-')
  const d = new Date(2000, parseInt(mm) - 1, parseInt(dd))
  return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })
}

function MemberAvatar({ member, size }) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const cls = size === 'lg' ? 'w-14 h-14 text-lg font-bold' : 'w-8 h-8 text-xs font-bold'
  return (
    <span className={`${cls} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: c.bg, color: c.fg }}>
      {memberInitials(member)}
    </span>
  )
}

function FeaturedCard({ member }) {
  const label = member.daysUntil === 0 ? <span className="flex items-center gap-1 justify-center"><PartyPopper size={12} /> Avui!</span> : member.daysUntil === 1 ? 'Demà!' : `En ${member.daysUntil} dies`
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex flex-col items-center gap-3 text-center justify-center min-h-[160px]">
      <MemberAvatar member={member} size="lg" />
      <div>
        <p className="text-sm font-bold text-body">{member.first_name} {member.last_name}</p>
        <p className="text-xs text-muted mt-0.5">{birthdayDateLabel(member.birth_date)}</p>
        <p className="text-xs font-semibold text-amber-400 mt-1">{label}</p>
      </div>
      {member.instagram ? (
        <a href={`https://instagram.com/${member.instagram}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors">
          @ {member.instagram}
        </a>
      ) : null}
    </div>
  )
}

function SmallCard({ member }) {
  const label = member.daysUntil === 1 ? 'Demà' : `${member.daysUntil}d`
  return (
    <div className="rounded-xl border border-rim bg-pane p-2.5 flex items-center gap-2">
      <MemberAvatar member={member} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-body truncate">{member.first_name} {member.last_name}</p>
        <p className="text-xs text-ghost truncate">{birthdayDateLabel(member.birth_date)}</p>
      </div>
      <span className="text-xs text-ghost shrink-0">{label}</span>
    </div>
  )
}

export default function UpcomingBirthdays({ members }) {
  const upcoming = (members ?? [])
    .filter(m => m.birth_date && m.active !== false)
    .map(m => ({ ...m, daysUntil: daysUntilBirthday(m.birth_date) }))
    .filter(m => m.daysUntil !== null && m.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6)

  if (!upcoming.length) return null

  const todayGroup = upcoming.filter(m => m.daysUntil === 0)
  const restGroup  = upcoming.filter(m => m.daysUntil > 0)

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
        Aniversaris pròxims
      </h3>
      {todayGroup.length > 0 ? (
        <div className="flex gap-3">
          <div className="flex flex-col gap-2 shrink-0" style={{ width: 'calc(33.333% - 6px)' }}>
            {todayGroup.map(m => <FeaturedCard key={m.id} member={m} />)}
          </div>
          {restGroup.length > 0 && (
            <div className="flex-1 grid grid-cols-2 gap-2 content-start">
              {restGroup.map(m => <SmallCard key={m.id} member={m} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {upcoming.map(m => <SmallCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  )
}
