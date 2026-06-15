import { Link } from 'react-router-dom'
import { MicVocal, FileText, CalendarDays } from '../../lib/icons'
import { NextShowCard, UpcomingRehearsals } from './DashboardWidgets.jsx'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function SoundDashboard({ nextShow, readiness, readinessLoading, rehearsals, rehearsalAttendance }) {
  const { can } = useAuth()
  return (
    <>
      {nextShow && (
        <NextShowCard
          show={nextShow}
          readiness={readiness ? { mics: readiness.mics } : null}
          readinessLoading={readinessLoading}
          extraLinks={
            <>
              <Link to={`/show/${nextShow.id}/mics`}>
                <Button size="sm" variant="ghost">Micròfons</Button>
              </Link>
              {can('rider', 'view') && (
                <Link to={`/show/${nextShow.id}/rider`}>
                  <Button size="sm" variant="ghost">Rider</Button>
                </Link>
              )}
            </>
          }
        />
      )}

      <UpcomingRehearsals rehearsals={rehearsals} attendanceMap={rehearsalAttendance} />

      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Seccions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link to="/shows"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <MicVocal size={20} className="group-hover:text-emerald-400 transition-colors" />
            <span className="text-xs font-medium">Espectacles</span>
          </Link>
          {can('rider', 'view') && (
            <Link to="/shows"
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <FileText size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium">Rider tècnic</span>
            </Link>
          )}
          <Link to="/attendance"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <CalendarDays size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Assajos</span>
          </Link>
        </div>
      </div>
    </>
  )
}
