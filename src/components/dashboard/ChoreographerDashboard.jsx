import { Link } from 'react-router-dom'
import { Users, Grid2x2, ArrowRight } from '../../lib/icons'
import { t } from '../../locales/ca'
import { ICON } from '../../lib/ui'
import { NextShowCard, UpcomingRehearsals } from './DashboardWidgets.jsx'
import Button from '../ui/Button'

export default function ChoreographerDashboard({ nextShow, readiness, readinessLoading, rehearsals, rehearsalAttendance }) {
  return (
    <>
      {nextShow && (
        <NextShowCard
          show={nextShow}
          readiness={readiness ? { positions: readiness.positions } : null}
          readinessLoading={readinessLoading}
          extraLinks={
            <>
              <Link to={`/show/${nextShow.id}/staging`}>
                <Button size="sm" variant="ghost">{t.dashboard.rehearsalGuide}</Button>
              </Link>
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
            <Grid2x2 size={20} className="group-hover:text-violet-400 transition-colors" />
            <span className="text-xs font-medium">Editor posicions</span>
          </Link>
          <Link to="/members"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <Users size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Persones</span>
          </Link>
          <Link to="/rehearsal"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <ArrowRight size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Assajos</span>
          </Link>
        </div>
      </div>
    </>
  )
}
