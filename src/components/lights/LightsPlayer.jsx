import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Play, Pause, SkipBack, ChevronLeft, ChevronRight } from '../../lib/icons'
import { lyricsLines, buildPlaybackSteps, sortCues, effectiveMomentId, formatCueNumber, cueSummary, lightColor } from '../../lib/lights'
import StageSim from './StageSim'

// Playback mode (karaoke): steps through a song — lyric lines and cues
// in order — showing lights and positions at each moment.
// Manual GO (tap, arrows, space) or auto-play with adjustable speed.
export default function LightsPlayer({
  song, repSong, cues, allCues, show, members, momentsBySong,
  positionsByMoment, loadMomentPositions, onClose,
}) {
  const lines = useMemo(() => lyricsLines(repSong?.lyrics), [repSong?.lyrics])
  const steps = useMemo(() => buildPlaybackSteps(lines, cues), [lines, cues])
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [secondsPerStep, setSecondsPerStep] = useState(3)
  const timerRef = useRef(null)

  // Current state: last cue fired up to the current step
  const currentCue = useMemo(() => {
    for (let i = stepIdx; i >= 0; i--) if (steps[i]?.cue) return steps[i].cue
    // Before the first cue of the song: state of the last preceding cue in the show
    const first = sortCues(cues)[0]
    if (!first) return null
    const n = Number(first.cue_number) || 0
    const prev = sortCues(allCues).filter(c => (Number(c.cue_number) || 0) < n)
    return prev.length ? prev[prev.length - 1] : null
  }, [stepIdx, steps, cues, allCues])

  const flatMoments = useMemo(() => Object.values(momentsBySong).flat(), [momentsBySong])
  const effMomentId = currentCue
    ? effectiveMomentId(currentCue, allCues)
    : (momentsBySong[song.id]?.[0]?.id ?? null)
  const effMoment = flatMoments.find(m => m.id === effMomentId)

  useEffect(() => {
    if (effMomentId) loadMomentPositions(effMomentId)
  }, [effMomentId])

  // Auto-play
  useEffect(() => {
    if (!playing) return
    timerRef.current = setInterval(() => {
      setStepIdx(i => {
        if (i >= steps.length - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, secondsPerStep * 1000)
    return () => clearInterval(timerRef.current)
  }, [playing, secondsPerStep, steps.length])

  // Teclat: espai/dreta = GO, esquerra = enrere, Esc = tancar
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); setStepIdx(i => Math.min(steps.length - 1, i + 1)) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setStepIdx(i => Math.max(0, i - 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps.length, onClose])

  const step = steps[stepIdx]
  const currentLine = step?.line ?? (() => {
    for (let i = stepIdx; i >= 0; i--) if (steps[i]?.line != null) return steps[i].line
    return null
  })()

  // Lyric window around the current line
  const windowLines = []
  if (currentLine != null) {
    for (let i = currentLine - 2; i <= currentLine + 3; i++) {
      if (i >= 0 && i < lines.length) windowLines.push({ i, text: lines[i] })
    }
  }

  const frontHex = lightColor(currentCue?.front_color)?.hex
  const progress = steps.length > 1 ? stepIdx / (steps.length - 1) : 0

  if (!steps.length) {
    return (
      <div className="fixed inset-0 z-50 bg-page flex flex-col items-center justify-center gap-4">
        <p className="text-faint text-sm">Aquesta cançó no té ni lletra ni cues per reproduir.</p>
        <button onClick={onClose} className="text-cyan-400 hover:text-cyan-300 text-sm">Tancar</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-page flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-rim shrink-0">
        <span className="text-sm font-semibold text-body truncate">{song.title}</span>
        <span className="text-xs text-ghost shrink-0">pas {stepIdx + 1}/{steps.length}</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-faint">
          Velocitat
          <select value={secondsPerStep} onChange={e => setSecondsPerStep(Number(e.target.value))}
            className="bg-fill border border-line rounded-lg px-2 py-1.5 text-xs text-body focus:outline-none focus:border-cyan-500">
            {[1.5, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s}s</option>)}
          </select>
        </label>
        <button onClick={() => { setStepIdx(0); setPlaying(false) }}
          className="p-2.5 rounded-lg text-muted hover:text-body hover:bg-fill transition-colors" title="Torna a començar">
          <SkipBack size={16} />
        </button>
        <button onClick={() => setPlaying(v => !v)}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors ${
            playing ? 'bg-amber-600/40 text-amber-200 border border-amber-600' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
          {playing ? <><Pause size={14} /> Pausa</> : <><Play size={14} /> Play</>}
        </button>
        <button onClick={onClose} className="p-2.5 rounded-lg text-muted hover:text-body hover:bg-fill transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Progrés — clicable amb indicadors de cues */}
      <div className="h-3 bg-pane shrink-0 relative cursor-pointer group"
        onClick={e => {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
          setStepIdx(Math.round(pct * (steps.length - 1)))
        }}>
        <div className="absolute inset-y-0 left-0 bg-cyan-600 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        {steps.map((s, i) => s.cue ? (
          <div key={i} className="absolute top-0 bottom-0 w-0.5 bg-amber-400/70"
            title={`Cue ${formatCueNumber(s.cue.cue_number)}: ${s.cue.trigger_text || ''}`}
            style={{ left: `${steps.length > 1 ? (i / (steps.length - 1)) * 100 : 0}%` }} />
        ) : null)}
        <div className="absolute top-0 h-full w-1.5 -translate-x-1/2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `${progress * 100}%` }} />
      </div>

      {/* Escenari (tap = GO) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto"
        onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}>
        <div className="lg:flex-1 flex flex-col gap-2 min-w-0">
          <div className="bg-pane border border-rim rounded-xl p-3">
            <StageSim show={show} members={members}
              placements={effMomentId ? (positionsByMoment[effMomentId] ?? {}) : {}}
              gridMode={effMoment?.grid_mode ?? 'alternate'} cue={currentCue ?? {}} className="w-full h-auto" />
          </div>
          {/* Current light state */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentCue ? (
              <>
                <span className="inline-flex items-center gap-2 bg-pane border border-line rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-body bg-raised rounded-md px-1.5 py-0.5">{formatCueNumber(currentCue.cue_number)}</span>
                  {frontHex && <span className="w-3 h-3 rounded-full border border-wire" style={{ background: frontHex }} />}
                  <span className="text-xs text-soft">{cueSummary(currentCue)}</span>
                </span>
                {effMoment && <span className="text-xs text-ghost">posicions: {effMoment.title}</span>}
              </>
            ) : (
              <span className="text-xs text-ghost">Encara no s'ha disparat cap cue.</span>
            )}
          </div>
        </div>

        {/* Lletra karaoke */}
        <div className="lg:w-[40%] shrink-0 flex flex-col justify-center gap-1 min-h-[200px]">
          {step?.cue && step.line == null && (
            <p className="text-amber-400 text-sm font-medium uppercase tracking-wide mb-2">
              ⚡ {step.cue.trigger_text || `Cue ${formatCueNumber(step.cue.cue_number)}`}
            </p>
          )}
          {windowLines.length === 0 && step?.line == null && !step?.cue && (
            <p className="text-ghost text-sm">— sense lletra —</p>
          )}
          {windowLines.map(({ i, text }) => (
            <p key={i} className={`transition-all duration-200 leading-snug ${
              i === currentLine
                ? 'text-body text-2xl font-bold'
                : i < currentLine ? 'text-ghost text-base' : 'text-faint text-base'
            }`}>
              {text || ' '}
            </p>
          ))}
        </div>
      </div>

      {/* Controls GO */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-rim shrink-0">
        <button onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          className="flex items-center justify-center w-14 h-14 rounded-xl border border-line text-muted hover:text-body hover:bg-fill transition-colors">
          <ChevronLeft size={22} />
        </button>
        <button onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
          className="flex-1 h-14 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold tracking-widest transition-colors">
          GO
          <ChevronRight size={20} className="inline ml-2 -mt-0.5" />
        </button>
      </div>
    </div>
  )
}
