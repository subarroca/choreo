import { useState } from 'react'
import { BarChart3, Users, Clapperboard, CalendarDays } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS, VOICE_ORDER } from '../lib/constants'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useChoir } from '../hooks/useChoir.jsx'
import { ACCENT } from '../lib/ui'

// ─── Attendance trend tab ──────────────────────────────────────
function AttendanceTab({ choirId }) {
  const { data } = useSupabaseQuery(async () => {
    const nowStr = new Date().toISOString().slice(0, 10)
    let qm = supabase.from('members').select('id').eq('active', true)
    if (choirId) qm = qm.eq('choir_id', choirId)
    const { data: mems } = await qm
    const total = (mems ?? []).length
    if (!total) return null

    const { data: allReh } = await supabase.from('rehearsals').select('id, date, notes').order('date')
    const pastReh = (allReh ?? []).filter(r => r.date <= nowStr)
    if (!pastReh.length) return null

    const rehIds = pastReh.map(r => r.id)
    const { data: attData } = await supabase.from('attendance').select('rehearsal_id').in('rehearsal_id', rehIds)
    const absPerReh = {}
    for (const a of (attData ?? [])) absPerReh[a.rehearsal_id] = (absPerReh[a.rehearsal_id] ?? 0) + 1

    return pastReh.map(r => ({
      date: r.date,
      pct: Math.round(((total - (absPerReh[r.id] ?? 0)) / total) * 100),
      abs: absPerReh[r.id] ?? 0,
    }))
  }, [choirId])

  if (!data) return <p className="text-ghost text-sm py-12 text-center">Sense dades d'assistència.</p>

  const max = 100
  const W = 800, H = 200, PAD = 30
  const pts = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2),
    y: PAD + (1 - d.pct / max) * (H - PAD * 2),
    ...d,
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${pts[0]?.x},${H - PAD} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1]?.x},${H - PAD} Z`
  const avgPct = Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length)

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <div className="bg-pane border border-rim rounded-xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-ghost uppercase tracking-wider">Mitjana assistència</span>
          <span className="text-3xl font-bold text-body">{avgPct}%</span>
        </div>
        <div className="bg-pane border border-rim rounded-xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-ghost uppercase tracking-wider">Assajos registrats</span>
          <span className="text-3xl font-bold text-body">{data.length}</span>
        </div>
      </div>

      <div className="bg-pane border border-rim rounded-xl p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
          {[25, 50, 75, 100].map(g => (
            <g key={g}>
              <line x1={PAD} x2={W - PAD} y1={PAD + (1 - g / max) * (H - PAD * 2)} y2={PAD + (1 - g / max) * (H - PAD * 2)} stroke="#ffffff10" strokeWidth="1" />
              <text x={PAD - 4} y={PAD + (1 - g / max) * (H - PAD * 2) + 4} textAnchor="end" fill="#9ca3af" fontSize="9">{g}%</text>
            </g>
          ))}
          <path d={area} fill="url(#agrad)" />
          <defs>
            <linearGradient id="agrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={polyline} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#06b6d4">
              <title>{p.date}: {p.pct}%</title>
            </circle>
          ))}
        </svg>
        <div className="flex justify-between mt-1 px-7 text-[9px] text-ghost overflow-hidden">
          {data.length <= 12 ? data.map((d, i) => (
            <span key={i}>{d.date?.slice(5)}</span>
          )) : (
            <>
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-pane border border-rim rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rim">
              <th className="text-left px-4 py-2.5 text-xs text-ghost font-medium">Data</th>
              <th className="text-right px-4 py-2.5 text-xs text-ghost font-medium">Absències</th>
              <th className="text-right px-4 py-2.5 text-xs text-ghost font-medium">Assistència</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rim">
            {[...data].reverse().map((d, i) => (
              <tr key={i} className="hover:bg-fill/40">
                <td className="px-4 py-2 text-muted">{new Date(d.date).toLocaleDateString('ca-ES')}</td>
                <td className="px-4 py-2 text-right text-muted">{d.abs}</td>
                <td className="px-4 py-2 text-right">
                  <span className={`font-semibold ${d.pct >= 80 ? 'text-green-600 dark:text-green-400' : d.pct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{d.pct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Voice distribution tab ────────────────────────────────────
function VoicesTab({ choirId }) {
  const navigate = useNavigate()
  const { data: members = [] } = useSupabaseQuery(async () => {
    let q = supabase.from('members').select('id, voice').eq('active', true)
    if (choirId) q = q.eq('choir_id', choirId)
    const { data } = await q
    return data ?? []
  }, [choirId])

  const voiceCounts = VOICE_ORDER.reduce((acc, v) => {
    acc[v] = members.filter(m => m.voice === v).length; return acc
  }, {})
  const total = members.filter(m => VOICE_ORDER.includes(m.voice)).length

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-pane border border-rim rounded-xl px-5 py-4 flex flex-col gap-1">
        <span className="text-xs text-ghost uppercase tracking-wider">Total cantants actius</span>
        <span className="text-3xl font-bold text-body">{total}</span>
      </div>

      <div className="bg-pane border border-rim rounded-xl overflow-hidden">
        <div className="flex h-8 overflow-hidden">
          {VOICE_ORDER.filter(v => voiceCounts[v] > 0).map(v => (
            <div key={v} className="transition-all" title={`${VOICE_LABELS[v]}: ${voiceCounts[v]}`}
              style={{ width: `${(voiceCounts[v] / total) * 100}%`, backgroundColor: VOICE_COLORS[v]?.bg }} />
          ))}
        </div>
        <div className="divide-y divide-rim">
          {VOICE_ORDER.filter(v => voiceCounts[v] > 0).map(v => {
            const c = VOICE_COLORS[v]
            const pct = total ? Math.round((voiceCounts[v] / total) * 100) : 0
            return (
              <button key={v}
                onClick={() => navigate(`/members?voice=${v}`)}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-fill/60 transition-colors">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: c?.bg }} />
                <span className="text-body text-sm flex-1">{VOICE_LABELS[v]}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-raised rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c?.bg }} />
                  </div>
                  <span className="text-muted text-sm w-6 text-right">{voiceCounts[v]}</span>
                  <span className="text-ghost text-xs w-8 text-right">{pct}%</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Shows readiness tab ───────────────────────────────────────
function ShowsTab({ choirId }) {
  const { data: shows = [] } = useSupabaseQuery(async () => {
    let q = supabase.from('shows').select('*').order('created_at', { ascending: false })
    if (choirId) q = q.eq('choir_id', choirId)
    const { data } = await q
    return data ?? []
  }, [choirId])

  const { data: statsMap = {} } = useSupabaseQuery(async () => {
    if (!shows.length) return {}
    const showIds = shows.map(s => s.id)
    const { data: songData } = await supabase.from('songs').select('id, show_id').in('show_id', showIds)
    const songs = songData ?? []
    if (!songs.length) return {}
    const songIds = songs.map(s => s.id)
    const [momRes, cueRes] = await Promise.all([
      supabase.from('moments').select('id, song_id').in('song_id', songIds),
      supabase.from('light_cues').select('song_id').in('song_id', songIds),
    ])
    const moments = momRes.data ?? []
    const momentIds = moments.map(m => m.id)
    let positionedMomentIds = new Set()
    if (momentIds.length) {
      const { data: posData } = await supabase.from('positions').select('moment_id').in('moment_id', momentIds)
      positionedMomentIds = new Set((posData ?? []).map(p => p.moment_id))
    }
    const songsWithCues = new Set((cueRes.data ?? []).map(c => c.song_id))
    const result = {}
    for (const show of shows) {
      const showSongs = songs.filter(s => s.show_id === show.id)
      const showMoments = moments.filter(m => showSongs.some(s => s.id === m.song_id))
      const posPct = showMoments.length ? (showMoments.filter(m => positionedMomentIds.has(m.id)).length / showMoments.length) * 100 : 0
      const lightPct = showSongs.length ? (showSongs.filter(s => songsWithCues.has(s.id)).length / showSongs.length) * 100 : 0
      result[show.id] = { songs: showSongs.length, moments: showMoments.length, positions: posPct, lights: lightPct }
    }
    return result
  }, [shows.length])

  function Bar({ pct }) {
    const color = pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-gray-600'
    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-raised rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-medium ${pct >= 80 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-gray-500'}`}>{Math.round(pct)}%</span>
      </div>
    )
  }

  return (
    <div className="bg-pane border border-rim rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rim">
            <th className="text-left px-4 py-2.5 text-xs text-ghost font-medium">Espectacle</th>
            <th className="text-right px-4 py-2.5 text-xs text-ghost font-medium">Cançons</th>
            <th className="text-center px-4 py-2.5 text-xs text-ghost font-medium">Posicions</th>
            <th className="text-center px-4 py-2.5 text-xs text-ghost font-medium">Llums</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rim">
          {shows.map(s => {
            const st = statsMap[s.id]
            return (
              <tr key={s.id} className="hover:bg-fill/40">
                <td className="px-4 py-2.5">
                  <span className="text-body font-medium">{s.name}</span>
                  {s.date && <span className="ml-2 text-ghost text-xs">{new Date(s.date).toLocaleDateString('ca-ES')}</span>}
                </td>
                <td className="px-4 py-2.5 text-right text-muted">{st?.songs ?? '—'}</td>
                <td className="px-4 py-2.5"><div className="flex justify-center">{st ? <Bar pct={st.positions} /> : <span className="text-ghost">—</span>}</div></td>
                <td className="px-4 py-2.5"><div className="flex justify-center">{st ? <Bar pct={st.lights} /> : <span className="text-ghost">—</span>}</div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────
const TABS = [
  { id: 'attendance', label: 'Assistència', Icon: CalendarDays },
  { id: 'voices',     label: 'Veus',        Icon: Users },
  { id: 'shows',      label: 'Espectacles', Icon: Clapperboard },
]

export default function Analytics() {
  const { currentChoirId } = useChoir()
  const [tab, setTab] = useState('attendance')

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Analítica"
            icon={BarChart3}
            tabs={
              <div className="flex gap-1 pb-1">
                {TABS.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      tab === id ? ACCENT.activeNav : 'text-muted hover:text-body hover:bg-fill'
                    }`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            }
          />
        }
      >
        {tab === 'attendance' && <AttendanceTab choirId={currentChoirId} />}
        {tab === 'voices'     && <VoicesTab choirId={currentChoirId} />}
        {tab === 'shows'      && <ShowsTab choirId={currentChoirId} />}
      </PageContainer>
    </Layout>
  )
}
