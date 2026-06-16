import { useState, useMemo, useEffect } from 'react'
import { parseJsonArray } from '../../lib/parseJson'
import { formatDate } from '../../lib/formatters'
import { ChevronDown, ChevronUp, Check, Clock, AlertTriangle, Clapperboard } from '../../lib/icons'
import { supabase } from '../../lib/supabase'
import { inputCls, labelCls } from '../ui/Input'
import Badge from '../ui/Badge'

// ─── TargetInput ────────────────────────────────────────────────
function TargetInput({ songId, initial, onChange }) {
  const [val, setVal] = useState(initial ?? '')

  useEffect(() => { setVal(initial ?? '') }, [initial])

  async function commit(raw) {
    const num = raw === '' ? null : Math.max(0, parseInt(raw, 10))
    if (num === initial) return
    await supabase.from('repertoire_songs').update({ target_rehearsals: num }).eq('id', songId)
    onChange(songId, num)
  }

  return (
    <input
      type="number" min="0" max="99"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={e => commit(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
      placeholder="—"
      title="Assajos objectiu"
      className="w-12 text-center text-xs bg-fill border border-line rounded-md px-1 py-0.5 text-body focus:outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}

// ─── Status chip ────────────────────────────────────────────────
function StatusChip({ done, planned, target, futureTotal }) {
  if (target == null) return <span className="text-xs text-ghost">—</span>
  const total = done + planned
  if (total >= target) return <Badge color="green"><Check size={10} /> Cobert</Badge>
  const remaining = target - total
  if (remaining <= futureTotal) return <Badge color="amber"><Clock size={10} /> En curs</Badge>
  return <Badge color="red"><AlertTriangle size={10} /> Falta temps</Badge>
}

// ─── Main component ─────────────────────────────────────────────
export default function SongCoverageView({ rehearsals, allSongs: initialSongs, shows = [] }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  // Date range state
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().slice(0, 10)
  })

  const [sortKey, setSortKey] = useState('done')   // 'done' | 'left' | 'title'
  const [sortAsc, setSortAsc] = useState(true)
  const [songs, setSongs] = useState(initialSongs)
  useMemo(() => setSongs(initialSongs), [initialSongs])

  // Next upcoming concert
  const nextShow = useMemo(() =>
    shows.filter(s => s.date >= todayStr).sort((a, b) => a.date > b.date ? 1 : -1)[0] ?? null
  , [shows, todayStr])

  function applyNextConcert() {
    if (!nextShow) return
    setFromDate(todayStr)
    setToDate(nextShow.date)
  }

  // Split rehearsals into past / future within range
  const inRange = useMemo(() =>
    rehearsals.filter(r => r.date >= fromDate && r.date <= toDate)
  , [rehearsals, fromDate, toDate])

  const pastInRange   = useMemo(() => inRange.filter(r => r.date <= todayStr), [inRange, todayStr])
  const futureInRange = useMemo(() => inRange.filter(r => r.date >  todayStr), [inRange, todayStr])

  // Per-song stats
  const songStats = useMemo(() => {
    const map = {}
    for (const s of songs) map[s.id] = { song: s, done: 0, planned: 0, lastDate: null }

    for (const r of pastInRange) {
      for (const id of parseJsonArray(r.song_ids)) {
        if (!map[id]) continue
        map[id].done++
        if (!map[id].lastDate || r.date > map[id].lastDate) map[id].lastDate = r.date
      }
    }
    for (const r of futureInRange) {
      for (const id of parseJsonArray(r.song_ids)) {
        if (map[id]) map[id].planned++
      }
    }
    return Object.values(map)
  }, [songs, pastInRange, futureInRange])

  const sorted = useMemo(() => {
    return [...songStats].sort((a, b) => {
      let diff = 0
      if (sortKey === 'done')  diff = a.done - b.done
      if (sortKey === 'left') {
        const leftA = a.song.target_rehearsals != null ? Math.max(0, a.song.target_rehearsals - a.done - a.planned) : -1
        const leftB = b.song.target_rehearsals != null ? Math.max(0, b.song.target_rehearsals - b.done - b.planned) : -1
        diff = leftB - leftA  // most urgent first when ascending
      }
      if (sortKey === 'title') diff = (a.song.title ?? '').localeCompare(b.song.title ?? '')
      if (diff !== 0) return sortAsc ? diff : -diff
      return (a.song.title ?? '').localeCompare(b.song.title ?? '')
    })
  }, [songStats, sortKey, sortAsc])

  function toggleSort(key) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(key === 'left' ? false : true) }
  }

  function SortBtn({ col, children }) {
    const active = sortKey === col
    return (
      <button onClick={() => toggleSort(col)}
        className={`flex items-center gap-0.5 transition-colors ${active ? 'text-body' : 'hover:text-body'}`}>
        {children}
        {active ? (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : null}
      </button>
    )
  }

  function handleTargetChange(songId, newTarget) {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, target_rehearsals: newTarget } : s))
  }

  if (!songs.length) return (
    <p className="text-sm text-ghost py-8 text-center">No hi ha cançons al repertori.</p>
  )

  return (
    <div className="space-y-5">

      {/* ── Date range controls ── */}
      <div className="rounded-xl border border-rim bg-pane p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Des de</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Fins a</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
          </div>
          {nextShow && (
            <button onClick={applyNextConcert}
              className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-700/20 border border-cyan-200 dark:border-cyan-700/40 px-3 py-2 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-700/30 transition-colors">
              <Clapperboard size={14} /> Fins al proper concert: {nextShow.name} ({formatDate(nextShow.date)})
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-4 text-xs text-muted pt-1 border-t border-rim">
          <span><span className="font-semibold text-body">{pastInRange.length}</span> assaig{pastInRange.length !== 1 ? 's' : ''} passats al rang</span>
          <span><span className="font-semibold text-body">{futureInRange.length}</span> assaig{futureInRange.length !== 1 ? 's' : ''} futurs al rang</span>
          {nextShow && toDate >= nextShow.date && (
            <span className="ml-auto text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clapperboard size={13} /> {nextShow.name}: {formatDate(nextShow.date)}
            </span>
          )}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="flex items-center gap-2 px-3 text-xs text-ghost">
        <div className="flex-1">
          <SortBtn col="title">Cançó</SortBtn>
        </div>
        <div className="w-10 text-center shrink-0">
          <SortBtn col="done">Fet</SortBtn>
        </div>
        <div className="w-12 text-center text-ghost shrink-0" title="Assajos futurs ja planificats">Planif.</div>
        <div className="w-14 text-center shrink-0" title="Assajos objectiu — editable">Objectiu</div>
        <div className="w-12 text-center shrink-0">
          <SortBtn col="left">Per fer</SortBtn>
        </div>
        <div className="w-20 text-right shrink-0">Estat</div>
      </div>

      {/* ── Song rows ── */}
      <div className="rounded-xl border border-rim overflow-hidden divide-y divide-rim">
        {sorted.map(({ song, done, planned, lastDate }) => {
          const target = song.target_rehearsals ?? null
          const left   = target != null ? Math.max(0, target - done - planned) : null
          const pct    = target ? Math.min(100, Math.round(((done + planned) / target) * 100)) : null

          // Bar color
          const barCls = pct == null ? ''
            : pct >= 100 ? 'bg-green-400/80 dark:bg-green-500/60'
            : pct >= 50  ? 'bg-amber-400/80 dark:bg-amber-500/60'
            : 'bg-red-400/70 dark:bg-red-500/50'

          return (
            <div key={song.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-fill/40 transition-colors">

              {/* Progress bar accent */}
              <div className="w-1 self-stretch rounded-full shrink-0 bg-rim overflow-hidden">
                {pct != null && (
                  <div className={`w-full rounded-full ${barCls}`} style={{ height: `${pct}%` }} />
                )}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-body truncate font-medium">{song.title}</p>
                {song.composer && <p className="text-xs text-muted truncate">{song.composer}</p>}
              </div>

              {/* Done */}
              <div className="w-10 text-center shrink-0">
                <span className="text-sm font-bold text-body tabular-nums">{done}</span>
                {planned > 0 && (
                  <span className="text-xs text-cyan-500 dark:text-cyan-400"> +{planned}</span>
                )}
              </div>

              {/* Planned (future) only if non-zero, else dash */}
              <div className="w-12 text-center text-xs text-muted shrink-0">
                {planned > 0
                  ? <span className="text-cyan-600 dark:text-cyan-400 font-medium">{planned} fut.</span>
                  : <span className="text-ghost">—</span>}
              </div>

              {/* Editable target */}
              <div className="w-14 flex justify-center shrink-0">
                <TargetInput songId={song.id} initial={target} onChange={handleTargetChange} />
              </div>

              {/* Left to do */}
              <div className="w-12 text-center shrink-0">
                {left == null
                  ? <span className="text-xs text-ghost">—</span>
                  : left === 0
                  ? <Check size={14} className="text-green-600 dark:text-green-400 mx-auto" />
                  : <span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">{left}</span>}
              </div>

              {/* Status */}
              <div className="w-20 flex justify-end shrink-0">
                <StatusChip done={done} planned={planned} target={target} futureTotal={futureInRange.length} />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-ghost text-center">
        «Fet» = assajos passats · <span className="text-cyan-500">+N</span> = futurs ja assignats · «Per fer» = assajos que encara falten assignar
      </p>
    </div>
  )
}
