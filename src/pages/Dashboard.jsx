import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Clapperboard, Users, BookOpen, Shield,
  CalendarDays, ArrowRight, MapPin, Clock,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { ICON } from '../lib/ui'

// ─── Greeting ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 13) return 'Bon dia'
  if (h < 20) return 'Bona tarda'
  return 'Bona nit'
}

function roleBadge(role) {
  if (role === 'admin') return { label: 'Administrador', cls: 'bg-amber-500/20 text-amber-400' }
  if (role === 'director') return { label: 'Director', cls: 'bg-cyan-500/20 text-cyan-400' }
  return { label: 'Membre', cls: 'bg-violet-500/20 text-violet-400' }
}

function firstName(fullName) {
  return fullName?.split(' ')[0] ?? ''
}

// ─── Next show card ───────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

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

function NextShowCard({ show }) {
  const days = daysUntil(show.date)

  return (
    <div className="rounded-xl border border-rim bg-pane overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Poster */}
        {show.poster_url ? (
          <div className="sm:w-28 shrink-0 aspect-[2/1] sm:aspect-auto">
            <img src={show.poster_url} alt={show.name}
              className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="sm:w-28 shrink-0 hidden sm:flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
            <Clapperboard size={28} className="text-ghost" />
          </div>
        )}

        {/* Info */}
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
              <span className="flex items-center gap-1">
                <MapPin size={ICON.xs} /> {show.venue}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-auto">
            <Link to={`/show/${show.id}`}>
              <Button size="sm">
                Setlist <ArrowRight size={ICON.xs} />
              </Button>
            </Link>
            <Link to={`/show/${show.id}/assaig`}>
              <Button size="sm" variant="ghost">Guia d'assaig</Button>
            </Link>
            <Link to={`/show/${show.id}/llums`}>
              <Button size="sm" variant="ghost">Il·luminació</Button>
            </Link>
            <Link to={`/show/${show.id}/mics`}>
              <Button size="sm" variant="ghost">Micròfons</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-rim bg-pane p-4 flex flex-col gap-1">
      <p className="text-2xl font-bold text-body">{loading ? '—' : value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickActions({ role, permissions }) {
  const isAdmin = role === 'admin' || role === 'director'
  const canViewMembers = isAdmin || permissions?.members?.view
  const canViewRepertoire = isAdmin || permissions?.repertoire?.view

  const actions = [
    { to: '/shows', label: 'Espectacles', Icon: Clapperboard, always: true },
    { to: '/members', label: 'Persones', Icon: Users, show: canViewMembers },
    { to: '/songs', label: 'Repertori', Icon: BookOpen, show: canViewRepertoire },
    { to: '/assistencia', label: 'Assistència', Icon: CalendarDays, always: true },
    { to: '/admin', label: 'Admin', Icon: Shield, show: isAdmin },
  ].filter(a => a.always || a.show)

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

// ─── Recent shows mini-grid ───────────────────────────────────────────────────

function MiniShowCard({ show }) {
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

// ─── Member dashboard ─────────────────────────────────────────────────────────

function MemberDashboard({ permissions, nextShow }) {
  const canViewRepertoire = permissions?.repertoire?.view
  const canViewMembers = permissions?.members?.view

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Accés ràpid</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {nextShow && (
          <Link to={`/show/${nextShow.id}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <Clapperboard size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium text-center">Espectacle actual</span>
          </Link>
        )}
        {nextShow && (
          <Link to={`/show/${nextShow.id}/assaig`}
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <LayoutDashboard size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium text-center">Guia d'assaig</span>
          </Link>
        )}
        {canViewRepertoire && (
          <Link to="/songs"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <BookOpen size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Repertori</span>
          </Link>
        )}
        <Link to="/assistencia"
          className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
          <CalendarDays size={20} className="group-hover:text-cyan-400 transition-colors" />
          <span className="text-xs font-medium">Assistència</span>
        </Link>
        {canViewMembers && (
          <Link to="/members"
            className="flex flex-col items-center gap-2 rounded-xl border border-rim bg-pane p-4 text-muted hover:text-body hover:border-wire transition-colors group">
            <Users size={20} className="group-hover:text-cyan-400 transition-colors" />
            <span className="text-xs font-medium">Persones</span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, role, permissions } = useAuth()
  const { currentChoirId } = useChoir()
  const isEditor = role === 'admin' || role === 'director'
  const badge = roleBadge(role)

  const { data: shows = [], loading: showsLoading } = useSupabaseQuery(async () => {
    let q = supabase.from('shows').select('*').order('date', { ascending: true })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  const { data: membersCount, loading: membersLoading } = useSupabaseQuery(async () => {
    let q = supabase.from('members').select('id', { count: 'exact', head: true }).eq('active', true)
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { count } = await q
    return count ?? 0
  }, [currentChoirId])

  const { data: songsCount, loading: songsLoading } = useSupabaseQuery(async () => {
    let q = supabase.from('repertoire_songs').select('id', { count: 'exact', head: true })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { count } = await q
    return count ?? 0
  }, [currentChoirId])

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  const nextShow = useMemo(
    () => shows.find(s => s.date && new Date(s.date) >= today) ?? shows[0] ?? null,
    [shows, today]
  )

  const recentShows = useMemo(() => shows.slice(0, 4), [shows])

  return (
    <Layout>
      <PageContainer
        header={
          <PageHeader
            title="Inici"
            icon={LayoutDashboard}
          />
        }
      >
        <div className="space-y-8">

          {/* Welcome */}
          <div className="flex items-center gap-3 pt-1">
            <div>
              <h2 className="text-xl font-bold text-body">
                {greeting()}, {firstName(profile?.full_name) || profile?.email}
              </h2>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Next show */}
          {!showsLoading && nextShow && <NextShowCard show={nextShow} />}

          {/* Admin/Director view */}
          {isEditor && (
            <>
              {/* Stats */}
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Resum</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Espectacles" value={shows.length} loading={showsLoading} />
                  <StatCard label="Membres actius" value={membersCount} loading={membersLoading} />
                  <StatCard label="Cançons al repertori" value={songsCount} loading={songsLoading} />
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Seccions</h3>
                <QuickActions role={role} permissions={permissions} />
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
                    {recentShows.map(show => (
                      <MiniShowCard key={show.id} show={show} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Member view */}
          {!isEditor && (
            <MemberDashboard permissions={permissions} nextShow={nextShow} />
          )}

        </div>
      </PageContainer>
    </Layout>
  )
}
