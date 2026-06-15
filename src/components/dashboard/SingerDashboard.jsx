import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, LayoutDashboard, Clapperboard, ArrowRight, MapPin, CalendarClock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { ICON } from '../../lib/ui'
import { daysUntil, parseRehearsalMeta } from './DashboardWidgets.jsx'
import Badge from '../ui/Badge'

const REHEARSAL_TYPES = {
  veu:         'Veu',
  coreo:       'Coreo',
  ambdues:     'Veu + Coreo',
  masterclass: 'Masterclass',
  posicions:   'Passi de posicions',
}

function NextRehearsalCard({ rehearsal }) {
  if (!rehearsal) return null
  const meta = parseRehearsalMeta(rehearsal.notes)
  const days = daysUntil(rehearsal.date)
  const dateLabel = new Date(rehearsal.date + 'T12:00:00').toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <Link to="/assistencia"
      className="block rounded-xl border border-rim bg-pane p-5 hover:border-wire transition-colors">
      <p className="text-xs text-muted uppercase tracking-wide mb-1">Proper assaig</p>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="text-xl font-bold text-body capitalize">{dateLabel}</h2>
        {days !== null && (
          <span className={`text-sm font-semibold shrink-0 ${days <= 1 ? 'text-amber-400' : 'text-muted'}`}>
            {days === 0 ? 'Avui!' : days === 1 ? 'Demà!' : `${days} dies`}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {rehearsal.location && (
          <span className="flex items-center gap-1"><MapPin size={ICON.xs} />{rehearsal.location}</span>
        )}
        {rehearsal.time && (
          <span className="flex items-center gap-1"><CalendarClock size={ICON.xs} />{rehearsal.time}</span>
        )}
      </div>
      {meta.type && (
        <Badge color="cyan" className="mt-3">
          {REHEARSAL_TYPES[meta.type] ?? meta.type}
        </Badge>
      )}
      {meta.freeNotes && !meta.type && (
        <p className="text-xs text-soft mt-2">{meta.freeNotes}</p>
      )}
      <div className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 mt-3">
        Veure assistència <ArrowRight size={10} />
      </div>
    </Link>
  )
}

export default function SingerDashboard({ nextShow, nextRehearsal }) {
  const { can } = useAuth()

  return (
    <div className="space-y-6">
      {/* Next rehearsal — big card */}
      <NextRehearsalCard rehearsal={nextRehearsal} />

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Accés ràpid</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {nextShow && (
            <Link to={`/show/${nextShow.id}/assaig`}
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <LayoutDashboard size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium text-center">La meva posició</span>
            </Link>
          )}
          {nextShow && (
            <Link to={`/show/${nextShow.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <Clapperboard size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium text-center">Espectacle actual</span>
            </Link>
          )}
          {can('repertoire', 'view') && (
            <Link to="/songs"
              className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
              <BookOpen size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs font-medium">Repertori</span>
            </Link>
          )}
          <Link to="/assistencia"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <CalendarDays size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Assajos</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
