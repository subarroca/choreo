import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Menu, ListOrdered, AlignLeft, X, Play } from 'lucide-react'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'
import { useLightCues } from '../hooks/useLightCues'
import { nextCueNumber, sortCues, lyricsLines } from '../lib/lights'
import ScoreView from '../components/lights/ScoreView'
import CueTable from '../components/lights/CueTable'
import CueEditPanel from '../components/lights/CueEditPanel'
import LightsPlayer from '../components/lights/LightsPlayer'

const NEW_CUE_DEFAULTS = {
  trigger_type: 'lyric', trigger_text: '', lyric_line: null,
  front_levels: '{"esquerra":2,"centre":2,"dreta":2}',
  back_levels: '{"esquerra":0,"centre":0,"dreta":0}',
  front_color: null, back_color: null, scope: 'tots',
  effects: '[]', followspots: '[]', transition: 'tall', transition_seconds: null, notes: '',
}

// Editor de lletra d'una cançó del repertori (modal)
function LyricsEditor({ repSong, onSave, onClose }) {
  const [text, setText] = useState(repSong?.lyrics ?? '')
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Lletra — {repSong.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 p-5 flex flex-col gap-3">
          <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
            placeholder={'Una línia per vers.\nLes línies buides separen estrofes.'}
            className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300 placeholder-gray-600 resize-none leading-relaxed" />
          <p className="text-xs text-gray-600">Els cues queden ancorats al número de línia: si afegeixes o esborres línies enmig, revisa els ancoratges.</p>
          <div className="flex gap-2">
            <button onClick={() => { onSave(text); onClose() }}
              className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel·lar</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Lights() {
  const { id: showId } = useParams()
  const {
    show, songs, repertoire, momentsBySong, positionsByMoment, members, cues, presets,
    loading, saving,
    loadMomentPositions, createCue, updateCue, deleteCue, createPreset, deletePreset, saveLyrics,
  } = useLightCues(showId)

  const [view, setView] = useState(() => localStorage.getItem('lightsView') || 'score')
  const [selectedSongId, setSelectedSongId] = useState(null)
  const [selectedCueId, setSelectedCueId] = useState(null)
  const [editingLyrics, setEditingLyrics] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)

  useEffect(() => { localStorage.setItem('lightsView', view) }, [view])
  useEffect(() => {
    if (!selectedSongId && songs.length) setSelectedSongId(songs[0].id)
  }, [songs, selectedSongId])

  const selectedSong = songs.find(s => s.id === selectedSongId)
  const selectedCue = cues.find(c => c.id === selectedCueId)
  const songCues = sortCues(cues.filter(c => c.song_id === selectedSongId))
  const cueCountBySong = {}
  for (const c of cues) cueCountBySong[c.song_id ?? '__none__'] = (cueCountBySong[c.song_id ?? '__none__'] ?? 0) + 1

  // Proposa un número després de l'últim cue de la cançó, sense xocar
  // amb el primer de la següent (sub-cue tipus 16.5 si cal).
  function suggestCueNumber(songId) {
    const sc = cues.filter(c => c.song_id === songId)
    if (!sc.length) return nextCueNumber(cues)
    const max = Math.max(...sc.map(c => Number(c.cue_number) || 0))
    const higher = cues.map(c => Number(c.cue_number) || 0).filter(n => n > max)
    if (!higher.length) return Math.floor(max) + 1
    const next = Math.min(...higher)
    return max + 0.5 < next ? max + 0.5 : Math.round((max + next) / 2 * 100) / 100
  }

  async function handleCreateCueAtLine(lineIdx, lineText) {
    const data = await createCue({
      ...NEW_CUE_DEFAULTS,
      song_id: selectedSongId, cue_number: suggestCueNumber(selectedSongId),
      trigger_type: 'lyric', trigger_text: lineText.trim(), lyric_line: lineIdx,
    })
    if (data) setSelectedCueId(data.id)
  }

  async function handleCreateCue() {
    const inSong = view === 'score' && selectedSongId
    const data = await createCue({
      ...NEW_CUE_DEFAULTS,
      song_id: inSong ? selectedSongId : null,
      trigger_type: inSong ? 'action' : 'structural',
      cue_number: inSong ? suggestCueNumber(selectedSongId) : nextCueNumber(cues),
    })
    if (data) setSelectedCueId(data.id)
  }

  async function handleDeleteCue() {
    if (!selectedCue) return
    await deleteCue(selectedCue.id)
    setSelectedCueId(null)
  }

  function selectCue(cue) {
    setSelectedCueId(cue.id)
    if (cue.song_id) setSelectedSongId(cue.song_id)
  }

  const repSong = selectedSong?.repertoire_song_id ? repertoire[selectedSong.repertoire_song_id] : null
  const naturalTriggerText = selectedCue?.lyric_line != null && repSong?.lyrics
    ? (lyricsLines(repSong.lyrics)[selectedCue.lyric_line] ?? '').trim()
    : ''

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <ShowToolbar showId={showId} showName={show?.name} />

        {/* View controls */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0">
            <Menu size={18} />
          </button>
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            <button onClick={() => setView('score')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${view === 'score' ? 'bg-cyan-700/40 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>
              <AlignLeft size={13} /> Partitura
            </button>
            <button onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-l border-gray-700 ${view === 'table' ? 'bg-cyan-700/40 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>
              <ListOrdered size={13} /> Taula
            </button>
          </div>
          {saving && <span className="text-xs text-gray-600">Guardant…</span>}
          <div className="ml-auto flex items-center gap-2">
            {selectedSong && (
              <button onClick={() => setPlayerOpen(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <Play size={13} /> Reproduir
              </button>
            )}
            <button onClick={handleCreateCue}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-300 text-white text-xs px-3 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Cue
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {/* Backdrop sidebar (mòbil) */}
          {sidebarOpen && <div className="absolute inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar: cançons */}
          {view === 'score' && (
            <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-64 lg:w-56 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col p-3 gap-1 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 px-1">Cançons</p>
              {songs.map((s, i) => (
                <button key={s.id} onClick={() => { setSelectedSongId(s.id); setSelectedCueId(null); setSidebarOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    s.id === selectedSongId ? 'bg-cyan-700/30 text-cyan-200' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                  <span className="text-xs text-gray-600 w-5 shrink-0">{i + 1}.</span>
                  <span className="flex-1 truncate">{s.title}</span>
                  {cueCountBySong[s.id] > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-1.5 py-0.5 shrink-0">{cueCountBySong[s.id]}</span>
                  )}
                </button>
              ))}
              {cueCountBySong['__none__'] > 0 && (
                <p className="text-xs text-gray-600 px-1 mt-2">{cueCountBySong['__none__']} cues estructurals (vista taula)</p>
              )}
            </div>
          )}

          {/* Contingut central */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? <p className="text-gray-500 text-sm">Carregant…</p> : view === 'score' ? (
              selectedSong ? (
                <ScoreView song={selectedSong} repSong={repSong} cues={songCues}
                  selectedCueId={selectedCueId} onSelectCue={selectCue}
                  onCreateCueAtLine={handleCreateCueAtLine}
                  onEditLyrics={() => setEditingLyrics(true)} />
              ) : (
                <div className="text-gray-600 text-sm mt-8 text-center">Aquest espectacle encara no té cançons.</div>
              )
            ) : (
              <CueTable cues={cues} songs={songs} selectedCueId={selectedCueId} onSelectCue={selectCue} />
            )}
          </div>

          {/* Panell d'edició del cue */}
          {selectedCue && (
            <>
              <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSelectedCueId(null)} />
              <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-gray-950 border-l border-gray-800 shadow-2xl lg:static lg:z-auto lg:w-[440px] lg:max-w-none lg:shadow-none lg:shrink-0">
                <CueEditPanel
                  cue={selectedCue} show={show} songs={songs} momentsBySong={momentsBySong}
                  members={members} presets={presets} allCues={cues}
                  positionsByMoment={positionsByMoment} loadMomentPositions={loadMomentPositions}
                  naturalTriggerText={naturalTriggerText}
                  onChange={fields => updateCue(selectedCue.id, fields)}
                  onDelete={handleDeleteCue} onClose={() => setSelectedCueId(null)}
                  onCreatePreset={createPreset} onDeletePreset={deletePreset} />
              </div>
            </>
          )}
        </div>
      </div>

      {playerOpen && selectedSong && (
        <LightsPlayer
          song={selectedSong} repSong={repSong} cues={songCues} allCues={cues}
          show={show} members={members} momentsBySong={momentsBySong}
          positionsByMoment={positionsByMoment} loadMomentPositions={loadMomentPositions}
          onClose={() => setPlayerOpen(false)} />
      )}

      {editingLyrics && repSong && (
        <LyricsEditor repSong={repSong}
          onSave={text => saveLyrics(repSong.id, text)}
          onClose={() => setEditingLyrics(false)} />
      )}
      {editingLyrics && !repSong && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingLyrics(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-950 border border-gray-800 rounded-xl p-6 max-w-sm text-sm text-gray-400">
            Aquesta cançó no està enllaçada al repertori. Enllaça-la des del setlist per poder editar-ne la lletra.
            <button onClick={() => setEditingLyrics(false)} className="block mt-4 text-cyan-400 hover:text-cyan-300">Entesos</button>
          </div>
        </>
      )}
    </Layout>
  )
}
