import { Link } from 'react-router-dom'
import { Clapperboard, Users, BookOpen, Shield, CalendarDays, ArrowRight } from '../../lib/icons'
import { useAuth } from '../../hooks/useAuth.jsx'
import { ICON } from '../../lib/ui'
import { StatCard, VoiceDistributionBar, AttendanceSparkline, MiniShowCard } from './DashboardWidgets.jsx'

function QuickActions() {
  const { can, role } = useAuth()
  const actions = [
    { to: '/shows',      label: 'Espectacles', Icon: Clapperboard, show: true },
    { to: '/members',    label: 'Persones',    Icon: Users,        show: can('members', 'view') },
    { to: '/songs',      label: 'Repertori',   Icon: BookOpen,     show: can('repertoire', 'view') },
    { to: '/rehearsal', label: 'Assajos',     Icon: CalendarDays, show: true },
    { to: '/admin',      label: 'Admin',       Icon: Shield,       show: can('users', 'view') },
  ].filter(a => a.show)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {actions.map(({ to, label, Icon }) => (
        <Link key={to} to={to}
          className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
          <Icon size={20} className="group-hover:text-cyan-400 transition-colors" />
          <span className="text-xs font-medium">{label}</span>
        </Link>
      ))}
    </div>
  )
}

export default function DirectorDashboard({ shows, members, songsCount, showsLoading, membersLoading, songsLoading, attendanceSparkData, recentShows }) {
  return (
    <>
      {/* Stats */}
      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Resum</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Espectacles" value={shows.length} loading={showsLoading} />
          <StatCard label="Membres actius" value={members.length} loading={membersLoading} />
          <StatCard label="Cançons al repertori" value={songsCount} loading={songsLoading} />
        </div>
        {!membersLoading && members.length > 0 && (
          <div className="space-y-3">
            <VoiceDistributionBar members={members} />
            {attendanceSparkData && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-ghost shrink-0">Assistència</span>
                <AttendanceSparkline data={attendanceSparkData} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Seccions</h3>
        <QuickActions />
      </div>

      {/* Shows mini-grid */}
      {recentShows.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Espectacles</h3>
            <Link to="/shows" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              Veure tots <ArrowRight size={ICON.xs} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recentShows.map(show => <MiniShowCard key={show.id} show={show} />)}
          </div>
        </div>
      )}
    </>
  )
}
