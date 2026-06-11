import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Play, Pause, SkipBack, ChevronLeft, ChevronRight } from 'lucide-react'
import { lyricsLines, buildPlaybackSteps, sortCues, effectiveMomentId, formatCueNumber, cueSummary, lightColor } from '../../lib/lights'
import StageSim from './StageSim'

// Mode reproducció (karaoke): recorre la cançó pas a pas — línies de
// lletra i cues en ordre — mostrant llums i posicions a cada moment.
// GO manual (tap, fletxes, espai) o auto-play amb velocitat ajustable.
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

  // Estat actual: últim cue disparat fins al pas actual
  const currentCue = useMemo(() => {
    for (let i = stepIdx; i >= 0; i--) if (steps[i]?.cue) return steps[i].cue
    // Abans del primer cue de la cançó: estat de l'últim cue anterior del show
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

  // Finestra de lletra al voltant de la línia actual
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
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Aquesta cançó no té ni lletra ni cues per reproduir.</p>
        <button onClick={onClose} className="text-cyan-400 hover:text-cyan-300 text-sm">Tancar</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 shrink-0">
        <span className="text-sm font-semibold text-white truncate">{song.title}</span>
        <span className="text-xs text-gray-600 shrink-0">pas {stepIdx + 1}/{steps.length}</span>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Velocitat
          <select value={secondsPerStep} onChange={e => setSecondsPerStep(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-300">
            {[1.5, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{s}s</option>)}
          </select>
        </label>
        <button onClick={() => { setStepIdx(0); setPlaying(false) }}
          className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Torna a començar">
          <SkipBack size={16} />
        </button>
        <button onClick={() => setPlaying(v => !v)}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors ${
            playing ? 'bg-amber-600/40 text-amber-200 border border-amber-600' : 'bg-cyan-600 hover:bg-cyan-300 text-white'}`}>
          {playing ? <><Pause size={14} /> Pausa</> : <><Play size={14} /> Play</>}
        </button>
        <button onClick={onClose} className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Progrés */}
      <div className="h-1 bg-gray-900 shrink-0">
        <div className="h-full bg-cyan-600 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Escenari (tap = GO) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto"
        onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}>
        <div className="lg:flex-1 flex flex-col gap-2 min-w-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <StageSim show={show} members={members}
              placements={effMomentId ? (positionsByMoment[effMomentId] ?? {}) : {}}
              gridMode={effMoment?.grid_mode ?? 'alternate'} cue={currentCue ?? {}} className="w-full h-auto" />
          </div>
          {/* Estat de llums actual */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentCue ? (
              <>
                <span className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-white bg-gray-700 rounded-md px-1.5 py-0.5">{formatCueNumber(currentCue.cue_number)}</span>
                  {frontHex && <span className="w-3 h-3 rounded-full border border-gray-600" style={{ background: frontHex }} />}
                  <span className="text-xs text-gray-300">{cueSummary(currentCue)}</span>
                </span>
                {effMoment && <span className="text-xs text-gray-600">posicions: {effMoment.title}</span>}
              </>
            ) : (
              <span className="text-xs text-gray-600">Encara no s'ha disparat cap cue.</span>
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
            <p className="text-gray-600 text-sm">— sense lletra —</p>
          )}
          {windowLines.map(({ i, text }) => (
            <p key={i} className={`transition-all duration-200 leading-snug ${
              i === currentLine
                ? 'text-white text-2xl font-bold'
                : i < currentLine ? 'text-gray-600 text-base' : 'text-gray-500 text-base'
            }`}>
              {text || ' '}
            </p>
          ))}
        </div>
      </div>

      {/* Controls GO */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-800 shrink-0">
        <button onClick={() => setStepIdx(i => Math.max(0, i - 1))}
          className="flex items-center justify-center w-14 h-14 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
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
