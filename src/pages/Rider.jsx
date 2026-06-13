import { useParams } from 'react-router-dom'
import { Printer, Moon, Wind, Sparkles, Move, Pause, Theater, ScanFace, Spotlight } from 'lucide-react'
import Button from '../components/ui/Button'
import { ICON } from '../lib/ui'
import { useLightCues } from '../hooks/useLightCues'
import { formatCueNumber, cueSummary, sideColorHexes, cueEffects, effectIcon, sortCues } from '../lib/lights'
import ShowToolbar from '../components/ShowToolbar'

// Mapa d'icones per efectes
const EFFECT_ICONS = {
  Moon, Wind, Sparkles, Move, Pause, Theater, ScanFace
}

// Rider tècnic imprimible: portada + cue sheet de llums per cançó
// (amb plànols d'escenari) + annex de micròfons.
// «Imprimir» → el navegador genera el PDF.
export default function Rider() {
  const { id: showId } = useParams()
  const {
    show, songs, members, cues, presets, loading,
  } = useLightCues(showId)

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-muted text-sm">Carregant…</div>
  }

  const songMap = Object.fromEntries(songs.map(s => [s.id, s]))
  const mics = Array.isArray(show?.mics) ? show.mics : (show?.mics ? JSON.parse(show.mics) : [])
  const micAssignments = show?.mic_assignments
    ? (typeof show.mic_assignments === 'string' ? JSON.parse(show.mic_assignments) : show.mic_assignments)
    : {}
  const memberName = (id) => members.find(m => m.id === id)?.name ?? ''
  const momentsBySong = {}
  const allMoments = []
  const hasMicData = mics.length > 0 && Object.keys(micAssignments).length > 0

  // Agrupa cues per cançó en ordre de número (les estructurals fan de separadors)
  const groups = []
  let current = null
  for (const cue of sortCues(cues)) {
    const key = cue.song_id ?? '__none__'
    if (!current || current.key !== key) {
      current = { key, title: cue.song_id ? (songMap[cue.song_id]?.title ?? '?') : null, cues: [] }
      groups.push(current)
    }
    current.cues.push(cue)
  }

  const dateStr = show?.date
    ? new Date(show.date + 'T12:00:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .rider-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .page-break { break-before: page; }
          tr, .plot-card { break-inside: avoid; }
          @page { margin: 14mm; }
        }
      `}</style>

      {/* Barra superior (no s'imprimeix) */}
      <div className="no-print sticky top-0 z-10 bg-pane text-body">
        <ShowToolbar showId={showId} showName={show?.name} />
        <div className="flex items-center justify-between px-4 py-2 border-t border-rim">
          <span className="text-sm text-faint truncate">Rider tècnic</span>
          <Button onClick={() => window.print()}>
            <Printer size={ICON.sm} /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <div className="rider-sheet max-w-3xl mx-auto my-6 bg-white shadow-xl px-10 py-12 print:px-0 print:py-0">
        {/* Portada */}
        <div className="text-center pb-10 mb-10 border-b-2 border-gray-900">
          <p className="text-xs uppercase tracking-[0.3em] text-faint mb-3">Rider tècnic — Llums</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{show?.name}</h1>
          {dateStr && <p className="text-sm text-ghost">{dateStr}</p>}
          {show?.venue && <p className="text-sm text-ghost">{show.venue}</p>}
          <div className="flex justify-center gap-8 mt-6 text-xs text-faint">
            <span><strong className="text-gray-900 text-base block">{cues.length}</strong> memòries</span>
            <span><strong className="text-gray-900 text-base block">{songs.length}</strong> cançons</span>
            <span><strong className="text-gray-900 text-base block">{mics.length}</strong> micròfons</span>
          </div>
        </div>

        {/* Llegenda d'efectes */}
        <div className="mb-10 grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <Moon size={12} className="text-faint" />
            <span className="text-ghost">Blackout</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind size={12} className="text-faint" />
            <span className="text-ghost">Sweep</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-faint" />
            <span className="text-ghost">Chase</span>
          </div>
          <div className="flex items-center gap-2">
            <Move size={12} className="text-faint" />
            <span className="text-ghost">Movers</span>
          </div>
          <div className="flex items-center gap-2">
            <Pause size={12} className="text-faint" />
            <span className="text-ghost">Freeze</span>
          </div>
          <div className="flex items-center gap-2">
            <Theater size={12} className="text-faint" />
            <span className="text-ghost">Llums de sala</span>
          </div>
          <div className="flex items-center gap-2">
            <ScanFace size={12} className="text-faint" />
            <span className="text-ghost">Públic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-ghost border border-gray-400 rounded px-1">F</span>
            <span className="text-ghost">Frontal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-ghost border border-gray-400 rounded px-1">C</span>
            <span className="text-ghost">Contra</span>
          </div>
        </div>

        {/* Definició de presets */}
        {presets.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4">Presets de llum</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-1.5 px-2 w-12">Codi</th>
                  <th className="text-left py-1.5 px-2">Nom</th>
                  <th className="text-left py-1.5 px-2">Descripció</th>
                </tr>
              </thead>
              <tbody>
                {presets.map(p => {
                  const frontHexes = sideColorHexes(p, 'front')
                  const backHexes = sideColorHexes(p, 'back')
                  return (
                    <tr key={p.id} className="border-b border-gray-200">
                      <td className="py-2 px-2"><span className="font-bold">{p.code ?? '—'}</span></td>
                      <td className="py-2 px-2 font-medium">{p.name}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {frontHexes.length > 0 && (
                            <div className="inline-flex items-center gap-0.5">
                              <span className="text-[9px] font-bold text-ghost mr-0.5">F</span>
                              {frontHexes.map((hex, i) => (
                                <span key={i} className="w-3 h-3 rounded-full border border-gray-400" style={{ background: hex }} />
                              ))}
                            </div>
                          )}
                          {backHexes.length > 0 && (
                            <div className="inline-flex items-center gap-0.5">
                              <span className="text-[9px] font-bold text-ghost mr-0.5">C</span>
                              {backHexes.map((hex, i) => (
                                <span key={i} className="w-3 h-3 rounded-full border border-gray-400" style={{ background: hex }} />
                              ))}
                            </div>
                          )}
                          <span className="text-ghost">{cueSummary(p)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Cue sheet */}
        <h2 className="text-lg font-bold mb-4">Memòries de llum</h2>
        {groups.length === 0 && <p className="text-sm text-faint">Encara no hi ha cues definits.</p>}
        {groups.map((g, gi) => (
          <div key={gi} className="mb-6">
            {g.title
              ? <h3 className="text-sm font-bold bg-pane text-body px-3 py-1.5 rounded">{g.title}</h3>
              : <h3 className="text-xs font-semibold text-faint uppercase tracking-wider px-3 py-1.5 border-y border-gray-300 bg-gray-50">Estructura</h3>}
            <table className="w-full text-xs mt-1">
              <tbody>
                {g.cues.map(cue => {
                  const frontHexes = sideColorHexes(cue, 'front')
                  const backHexes = sideColorHexes(cue, 'back')
                  const effects = cueEffects(cue)
                  const fosc = effects.includes('fosc')
                  return (
                    <tr key={cue.id} className="border-b border-gray-200 align-top">
                      <td className="py-2 pr-2 w-12">
                        <span className={`inline-block min-w-[30px] text-center font-bold rounded px-1 py-0.5 ${fosc ? 'bg-pane text-body' : 'border border-gray-400'}`}>
                          {formatCueNumber(cue.cue_number)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 w-[45%]">
                        <span className={cue.trigger_type === 'lyric' ? 'italic' : 'font-medium uppercase text-[11px]'}>
                          {cue.trigger_type === 'lyric' && cue.trigger_text ? `«${cue.trigger_text}»` : cue.trigger_text}
                        </span>
                        {cue.notes && <span className="block text-faint mt-0.5">{cue.notes}</span>}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 font-medium">
                            {frontHexes.length > 0 && (
                              <div className="inline-flex items-center gap-0.5">
                                <span className="text-[9px] font-bold text-ghost mr-0.5">F</span>
                                {frontHexes.map((hex, i) => (
                                  <span key={i} className="w-3 h-3 rounded-full border border-gray-400" style={{ background: hex }} />
                                ))}
                              </div>
                            )}
                            {backHexes.length > 0 && (
                              <div className="inline-flex items-center gap-0.5">
                                <span className="text-[9px] font-bold text-ghost mr-0.5">C</span>
                                {backHexes.map((hex, i) => (
                                  <span key={i} className="w-3 h-3 rounded-full border border-gray-400 ring-1 ring-gray-300" style={{ background: hex }} />
                                ))}
                              </div>
                            )}
                            <span>{cueSummary(cue)}</span>
                          </div>
                          {effects.length > 0 && (
                            <div className="inline-flex items-center gap-1 ml-1">
                              {effects.map((eff, i) => {
                                const iconName = effectIcon(eff)
                                const Icon = iconName ? EFFECT_ICONS[iconName] : null
                                return Icon ? <Icon key={i} size={12} className="text-faint" title={eff} /> : null
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Annex: micròfons */}
        {hasMicData && (
          <div className="page-break pt-6">
            <h2 className="text-lg font-bold mb-4">Annex — Assignació de micròfons</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-1.5 px-2 border-b-2 border-gray-900">Moment</th>
                  {mics.map(mic => (
                    <th key={mic} className="text-center py-1.5 px-2 border-b-2 border-gray-900 border-l border-gray-300">{mic.replace(/^[Mm]/, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allMoments.filter(m => micAssignments[m.id] && Object.keys(micAssignments[m.id]).length).map(m => (
                  <tr key={m.id} className="border-b border-gray-200">
                    <td className="py-1.5 px-2">
                      <span className="text-faint">{m.song_title}</span> — {m.title}
                    </td>
                    {mics.map(mic => (
                      <td key={mic} className="py-1.5 px-2 text-center border-l border-gray-200">
                        {memberName(micAssignments[m.id]?.[mic])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[10px] text-muted mt-10 pt-4 border-t border-gray-200 text-center">
          Generat amb Choir Positions — {new Date().toLocaleDateString('ca-ES')}
        </p>
      </div>
    </div>
  )
}
