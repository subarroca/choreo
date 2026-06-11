import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { useLightCues } from '../hooks/useLightCues'
import { formatCueNumber, cueSummary, sideColorHex, cueEffects, sortCues } from '../lib/lights'
import ShowToolbar from '../components/ShowToolbar'

// Rider tècnic imprimible: portada + cue sheet de llums per cançó
// (amb plànols d'escenari) + annex de micròfons.
// «Imprimir» → el navegador genera el PDF.
export default function Rider() {
  const { id: showId } = useParams()
  const {
    show, songs, members, cues, loading,
  } = useLightCues(showId)

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Carregant…</div>
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
      <div className="no-print sticky top-0 z-10 bg-gray-900 text-white">
        <ShowToolbar showId={showId} showName={show?.name} />
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800">
          <span className="text-sm text-gray-500 truncate">Rider tècnic</span>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="rider-sheet max-w-3xl mx-auto my-6 bg-white shadow-xl px-10 py-12 print:px-0 print:py-0">
        {/* Portada */}
        <div className="text-center pb-10 mb-10 border-b-2 border-gray-900">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Rider tècnic — Llums</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{show?.name}</h1>
          {dateStr && <p className="text-sm text-gray-600">{dateStr}</p>}
          {show?.venue && <p className="text-sm text-gray-600">{show.venue}</p>}
          <div className="flex justify-center gap-8 mt-6 text-xs text-gray-500">
            <span><strong className="text-gray-900 text-base block">{cues.length}</strong> memòries</span>
            <span><strong className="text-gray-900 text-base block">{songs.length}</strong> cançons</span>
            <span><strong className="text-gray-900 text-base block">{mics.length}</strong> micròfons</span>
          </div>
        </div>

        {/* Cue sheet */}
        <h2 className="text-lg font-bold mb-4">Memòries de llum</h2>
        {groups.length === 0 && <p className="text-sm text-gray-500">Encara no hi ha cues definits.</p>}
        {groups.map((g, gi) => (
          <div key={gi} className="mb-6">
            {g.title
              ? <h3 className="text-sm font-bold bg-gray-900 text-white px-3 py-1.5 rounded">{g.title}</h3>
              : <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1.5 border-y border-gray-300 bg-gray-50">Estructura</h3>}
            <table className="w-full text-xs mt-1">
              <tbody>
                {g.cues.map(cue => {
                  const frontHex = sideColorHex(cue, 'front')
                  const backHex = sideColorHex(cue, 'back')
                  const fosc = cueEffects(cue).includes('fosc')
                  return (
                    <tr key={cue.id} className="border-b border-gray-200 align-top">
                      <td className="py-2 pr-2 w-12">
                        <span className={`inline-block min-w-[30px] text-center font-bold rounded px-1 py-0.5 ${fosc ? 'bg-gray-900 text-white' : 'border border-gray-400'}`}>
                          {formatCueNumber(cue.cue_number)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 w-[45%]">
                        <span className={cue.trigger_type === 'lyric' ? 'italic' : 'font-medium uppercase text-[11px]'}>
                          {cue.trigger_type === 'lyric' && cue.trigger_text ? `«${cue.trigger_text}»` : cue.trigger_text}
                        </span>
                        {cue.notes && <span className="block text-gray-500 mt-0.5">{cue.notes}</span>}
                      </td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {frontHex && <span className="w-3 h-3 rounded-full inline-block border border-gray-400" style={{ background: frontHex }} />}
                          {backHex && <span className="w-3 h-3 rounded-full inline-block border border-gray-400" style={{ background: backHex }} />}
                          {cueSummary(cue)}
                        </span>
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
                      <span className="text-gray-500">{m.song_title}</span> — {m.title}
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

        <p className="text-[10px] text-gray-400 mt-10 pt-4 border-t border-gray-200 text-center">
          Generat amb Choir Positions — {new Date().toLocaleDateString('ca-ES')}
        </p>
      </div>
    </div>
  )
}
