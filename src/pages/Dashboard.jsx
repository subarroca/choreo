import { useMemo } from 'react'
import { LayoutDashboard } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { parseJsonArray, parseJson } from '../lib/parseJson'
import { useMyMember } from '../hooks/useMyMember.js'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import { NextShowCard, UpcomingRehearsals } from '../components/dashboard/DashboardWidgets.jsx'
import DirectorDashboard from '../components/dashboard/DirectorDashboard.jsx'
import SingerDashboard from '../components/dashboard/SingerDashboard.jsx'
import UpcomingBirthdays from '../components/dashboard/UpcomingBirthdays.jsx'
import ChoreographerDashboard from '../components/dashboard/ChoreographerDashboard.jsx'
import LightingDashboard from '../components/dashboard/LightingDashboard.jsx'
import SoundDashboard from '../components/dashboard/SoundDashboard.jsx'
import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'
import { t } from '../locales/ca'

// ─── Greeting ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 13) return 'Bon dia'
  if (h < 20) return 'Bona tarda'
  return 'Bona nit'
}

function personaBadge(persona) {
  const map = {
    admin:          { label: t.roles.administrator, cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30' },
    director:       { label: t.roles.director,      cls: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/30' },
    choreographer:  { label: t.roles.choreographer, cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-400/30' },
    lighting:       { label: t.roles.lighting,      cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30' },
    sound:          { label: t.roles.sound,         cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30' },
    cap_de_corda:   { label: t.roles.capDeCorda,    cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-400/30' },
    member:         { label: t.roles.member_label,  cls: 'bg-fill text-muted border border-rim' },
  }
  return map[persona] ?? map.member
}

function firstName(fullName) {
  return fullName?.split(' ')[0] ?? ''
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, persona } = useAuth()
  const { currentChoirId } = useChoir()
  const myMember = useMyMember()
  const badge = personaBadge(persona)

  const isDirectorView = persona === 'admin' || persona === 'director'
  const needsReadiness = persona === 'admin' || persona === 'director' || persona === 'choreographer' || persona === 'lighting' || persona === 'sound'

  const { data: shows = [], loading: showsLoading } = useSupabaseQuery(async () => {
    let q = supabase.from('shows').select('*').order('date', { ascending: true })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const nextShow = useMemo(
    () => shows.find(s => s.date && new Date(s.date) >= today) ?? shows[0] ?? null,
    [shows, today]
  )
  const cutoff = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 5); d.setHours(0,0,0,0); return d }, [])
  const recentShows = useMemo(() => shows.filter(s => !s.date || new Date(s.date) >= cutoff).slice(0, 4), [shows, cutoff])

  const todayStr = new Date().toISOString().slice(0, 10)
  const { data: upcomingRehearsals = [] } = useSupabaseQuery(async () => {
    const { data } = await supabase.from('rehearsals').select('*').gte('date', todayStr).order('date').limit(3)
    return data ?? []
  }, [todayStr])

  const { data: allMembers = [] } = useSupabaseQuery(async () => {
    let q = supabase.from('members').select('id, first_name, last_name, voice, birth_date').eq('active', true)
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  const { data: repertoireSongs = [] } = useSupabaseQuery(async () => {
    let q = supabase.from('repertoire_songs').select('id, title, attachments')
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  const { data: rehearsalAttendance = {} } = useSupabaseQuery(async () => {
    if (!upcomingRehearsals.length) return {}
    const ids = upcomingRehearsals.map(r => r.id)
    const { data } = await supabase.from('attendance').select('rehearsal_id, member_id, status').in('rehearsal_id', ids)
    const map = {}
    for (const row of (data ?? [])) {
      if (!map[row.rehearsal_id]) map[row.rehearsal_id] = {}
      map[row.rehearsal_id][row.member_id] = { status: row.status }
    }
    return map
  }, [upcomingRehearsals.length > 0 ? upcomingRehearsals.map(r => r.id).join(',') : ''])

  // Director-only data
  const { data: members = [], loading: membersLoading } = useSupabaseQuery(async () => {
    if (!isDirectorView) return []
    let q = supabase.from('members').select('id, voice').eq('active', true)
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId, isDirectorView])

  const { data: songsCount, loading: songsLoading } = useSupabaseQuery(async () => {
    if (!isDirectorView) return 0
    let q = supabase.from('repertoire_songs').select('id', { count: 'exact', head: true })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { count } = await q
    return count ?? 0
  }, [currentChoirId, isDirectorView])

  const { data: attendanceSparkData } = useSupabaseQuery(async () => {
    if (!isDirectorView || !members.length) return null
    const { data: allReh } = await supabase.from('rehearsals').select('id, date').order('date')
    if (!allReh?.length) return null
    const nowStr = new Date().toISOString().slice(0, 10)
    const pastReh = allReh.filter(r => r.date <= nowStr).slice(-10)
    if (!pastReh.length) return null
    const rehIds = pastReh.map(r => r.id)
    const { data: attData } = await supabase.from('attendance').select('rehearsal_id').in('rehearsal_id', rehIds)
    const absPerReh = {}
    for (const a of (attData ?? [])) absPerReh[a.rehearsal_id] = (absPerReh[a.rehearsal_id] ?? 0) + 1
    const total = members.length || 1
    return pastReh.map(r => Math.round(((total - (absPerReh[r.id] ?? 0)) / total) * 100))
  }, [members.length, isDirectorView])

  const { data: showReadiness, loading: readinessLoading } = useSupabaseQuery(async () => {
    if (!needsReadiness || !nextShow) return null
    const { data: songList } = await supabase.from('songs').select('id').eq('show_id', nextShow.id)
    const songs = songList ?? []
    if (!songs.length) return { positions: 0, lights: 0, mics: 0 }
    const songIds = songs.map(s => s.id)
    const [momRes, cueRes] = await Promise.all([
      supabase.from('moments').select('id').in('song_id', songIds),
      supabase.from('light_cues').select('song_id').eq('show_id', nextShow.id),
    ])
    const momentIds = (momRes.data ?? []).map(m => m.id)
    let positionedMoments = 0
    if (momentIds.length) {
      const { data: posData } = await supabase.from('positions').select('moment_id').in('moment_id', momentIds)
      positionedMoments = new Set((posData ?? []).map(p => p.moment_id)).size
    }
    const songsWithCues = new Set((cueRes.data ?? []).map(c => c.song_id)).size
    const micAssign = parseJson(nextShow.mic_assignments, {})
    return {
      positions: momentIds.length ? (positionedMoments / momentIds.length) * 100 : 0,
      lights: songs.length ? (songsWithCues / songs.length) * 100 : 0,
      mics: Object.keys(micAssign).length > 0 ? 100 : 0,
    }
  }, [nextShow?.id, needsReadiness])

  const nextRehearsal = upcomingRehearsals[0] ?? null

  function renderPersonaDashboard() {
    switch (persona) {
      case 'admin':
      case 'director':
        return (
          <>
            {!showsLoading && nextShow && (
              <NextShowCard show={nextShow} readiness={showReadiness} readinessLoading={readinessLoading}
                extraLinks={
                  <>
                    <Link to={`/show/${nextShow.id}/staging`}><Button size="sm" variant="ghost">{t.dashboard.rehearsalGuide}</Button></Link>
                    <Link to={`/show/${nextShow.id}/lights`}><Button size="sm" variant="ghost">{t.dashboard.lighting}</Button></Link>
                    <Link to={`/show/${nextShow.id}/mics`}><Button size="sm" variant="ghost">{t.mics.microphones}</Button></Link>
                  </>
                }
              />
            )}
            <UpcomingRehearsals rehearsals={upcomingRehearsals} attendanceMap={rehearsalAttendance} myMemberId={myMember?.id} />
            <UpcomingBirthdays members={allMembers} />
            <DirectorDashboard
              shows={shows} members={members} songsCount={songsCount}
              showsLoading={showsLoading} membersLoading={membersLoading} songsLoading={songsLoading}
              attendanceSparkData={attendanceSparkData} recentShows={recentShows}
            />
          </>
        )
      case 'choreographer':
        return (
          <ChoreographerDashboard
            nextShow={nextShow} readiness={showReadiness} readinessLoading={readinessLoading}
            rehearsals={upcomingRehearsals} rehearsalAttendance={rehearsalAttendance}
          />
        )
      case 'lighting':
        return (
          <LightingDashboard
            nextShow={nextShow} readiness={showReadiness} readinessLoading={readinessLoading}
            rehearsals={upcomingRehearsals} rehearsalAttendance={rehearsalAttendance}
          />
        )
      case 'sound':
        return (
          <SoundDashboard
            nextShow={nextShow} readiness={showReadiness} readinessLoading={readinessLoading}
            rehearsals={upcomingRehearsals} rehearsalAttendance={rehearsalAttendance}
          />
        )
      default:
        return <SingerDashboard nextShow={nextShow} upcomingRehearsals={upcomingRehearsals} members={allMembers} allSongs={repertoireSongs} rehearsalAttendance={rehearsalAttendance} />
    }
  }

  return (
    <Layout fullWidth>
      <PageContainer header={<PageHeader title="Inici" icon={LayoutDashboard} />}>
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

          {renderPersonaDashboard()}
        </div>
      </PageContainer>
    </Layout>
  )
}
