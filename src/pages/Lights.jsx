import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Menu, ListOrdered, AlignLeft, Play, Hash } from 'lucide-react'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { inputCls } from '../components/ui/Input'
import { ICON } from '../lib/ui'
import { useLightCues } from '../hooks/useLightCues'
import { nextCueNumber, sortCues, lyricsLines } from '../lib/lights'
import { isSongType, repertoireType } from '../lib/repertoireTypes'
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

function LyricsEditor({ repSong, onSave, onClose }) {
  const [text, setText] = useState(repSong?.lyrics ?? '')
  return (
    <Modal open onClose={onClose} title={`Lletra — ${repSong.title}`} width="lg"
      footer={
        <div className="flex gap-2">
          <Button onClick={() => { onSave(text); onClose() }}>Guardar</Button>
          <Button variant="ghost" onClick={onClose}>Cancel·lar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 h-full">
        <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
          placeholder={'Una línia per vers.\nLes línies buides separen estrofes.'}
          className={inputCls + ' flex-1 min-h-[400px] resize-none leading-relaxed'} />
        <p className="text-xs text-ghost">Els cues queden ancorats al número de línia: si afegeixes o esborres línies enmig, revisa els ancoratges.</p>
      </div>
    </Modal>
  )
}

export default function Lights() {
  const { id: showId } = useParams()
  const {
    show, songs, repertoire, momentsBySong, positionsByMoment, members, cues, presets,
    loading, saving,
    loadMomentPositions, createCue, updateCue, deleteCue, renumberCues, createPreset, deletePreset, saveLyrics,
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
  const repSong = selectedSong?.repertoire_song_id ? repertoire[selectedSong.repertoire_song_id] : null
  const selectedCue = cues.find(c => c.id === selectedCueId)
  const songCues = sortCues(cues.filter(c => c.song_id === selectedSongId))
  const cueCountBySong = {}
  for (const c of cues) cueCountBySong[c.song_id ?? '__none__'] = (cueCountBySong[c.song_id ?? '__none__'] ?? 0) + 1

  function suggestCueNumber() {
    return nextCueNumber(cues)
  }

  async function handleCreateCueAtLine(lineIdx, lineText) {
    const data = await createCue({
      ...NEW_CUE_DEFAULTS,
      song_id: selectedSongId, cue_number: suggestCueNumber(),
      trigger_type: isSongType(repSong?.type) ? 'lyric' : 'action',
      trigger_text: lineText.trim(), lyric_line: lineIdx,
    })
    if (data) setSelectedCueId(data.id)
  }

  async function handleCreateCue() {
    const songId = selectedSongId || songs[0]?.id
    if (!songId) return
    const data = await createCue({
      ...NEW_CUE_DEFAULTS,
      song_id: songId,
      trigger_type: 'action',
      cue_number: suggestCueNumber(),
    })
    if (data) {
      setSelectedCueId(data.id)
      if (!selectedSongId) setSelectedSongId(songId)
    }
  }

  async function handleDeleteCue() {
    if (!selectedCue) return
    if (!(await confirmDialog('Eliminar aquest cue de llums?'))) return
    await deleteCue(selectedCue.id)
    setSelectedCueId(null)
  }

  async function handleDeleteCueById(cue) {
    if (!(await confirmDialog('Eliminar aquest cue de llums?'))) return
    await deleteCue(cue.id)
    if (selectedCueId === cue.id) setSelectedCueId(null)
  }

  async function handleDuplicateCue(cue) {
    const { id, created_at, ...fields } = cue
    const newCueNumber = suggestCueNumber()
    const data = await createCue({ ...fields, cue_number: newCueNumber })
    if (data) setSelectedCueId(data.id)
  }

  function handleMoveCueToLine(cueId, lineIdx, lineText) {
    const updates = { lyric_line: lineIdx }
    if (lineIdx != null && lineText) {
      const cue = cues.find(c => c.id === cueId)
      if (cue?.trigger_type === 'lyric') updates.trigger_text = lineText
    }
    updateCue(cueId, updates)
  }

  function selectCue(cue) {
    setSelectedCueId(cue.id)
    if (cue.song_id) setSelectedSongId(cue.song_id)
  }

  const naturalTriggerText = selectedCue?.lyric_line != null && repSong?.lyrics
    ? (lyricsLines(repSong.lyrics)[selectedCue.lyric_line] ?? '').trim()
    : ''

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-full">
        <ShowToolbar showId={showId} showName={show?.name} />

        {/* View controls */}
        <div className="flex items-center gap-2 px-4 py-2 bg-pane border-b border-rim shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-1.5 rounded-lg text-muted hover:text-body hover:bg-fill transition-colors shrink-0">
            <Menu size={ICON.lg} />
          </button>
          <div className="flex rounded-lg border border-line overflow-hidden">
            <button onClick={() => setView('score')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${view === 'score' ? 'bg-cyan-700/40 text-cyan-300' : 'text-muted hover:text-white'}`}>
              <AlignLeft size={ICON.sm} /> Partitura
            </button>
            <button onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-l border-line ${view === 'table' ? 'bg-cyan-700/40 text-cyan-300' : 'text-muted hover:text-white'}`}>
              <ListOrdered size={ICON.sm} /> Taula
            </button>
          </div>
          {saving && <span className="text-xs text-ghost">Guardant…</span>}
          <div className="ml-auto flex items-center gap-2">
            {cues.length > 0 && (
              <button onClick={renumberCues} title="Reassignar memòries consecutivament (1, 2, 3...)"
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-line text-muted hover:text-body hover:bg-fill transition-colors">
                <Hash size={ICON.sm} /> Renumerar
              </button>
            )}
            {selectedSong && (
              <button onClick={() => setPlayerOpen(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-line text-muted hover:text-body hover:bg-fill transition-colors">
                <Play size={ICON.sm} /> Reproduir
              </button>
            )}
            <Button onClick={handleCreateCue}>
              <Plus size={ICON.sm} /> Cue
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative overflow-hidden">
          {/* Backdrop sidebar (mòbil) */}
          {sidebarOpen && <div className="absolute inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar: cançons */}
          {view === 'score' && (
            <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-64 lg:w-56 shrink-0 border-r border-rim bg-page flex flex-col p-3 gap-1 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <p className="text-xs text-faint uppercase tracking-wider font-medium mb-1 px-1">Setlist</p>
              {songs.map((s, i) => {
                const rep = s.repertoire_song_id ? repertoire[s.repertoire_song_id] : null
                const rt = repertoireType(rep?.type)
                const isSection = !isSongType(rep?.type)
                const Icon = rt.icon
                return (
                  <button key={s.id} onClick={() => { setSelectedSongId(s.id); setSelectedCueId(null); setSidebarOpen(false) }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                      s.id === selectedSongId ? 'bg-cyan-700/30 text-cyan-200' : 'text-muted hover:text-white hover:bg-fill'}`}>
                    <span className="text-xs text-ghost w-5 shrink-0">{i + 1}.</span>
                    {isSection && <Icon size={ICON.sm} className={`shrink-0 ${rt.color}`} />}
                    <span className="flex-1 truncate">{s.title}</span>
                    {cueCountBySong[s.id] > 0 && (
                      <span className="text-xs text-faint bg-fill rounded-full px-1.5 py-0.5 shrink-0">{cueCountBySong[s.id]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Contingut central */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? <p className="text-faint text-sm">Carregant…</p> : view === 'score' ? (
              selectedSong ? (
                <ScoreView song={selectedSong} repSong={repSong} cues={songCues}
                  moments={momentsBySong[selectedSongId]}
                  selectedCueId={selectedCueId} onSelectCue={selectCue}
                  onDuplicateCue={handleDuplicateCue}
                  onDeleteCue={handleDeleteCueById}
                  onMoveCueToLine={handleMoveCueToLine}
                  onCreateCueAtLine={handleCreateCueAtLine}
                  onEditLyrics={() => setEditingLyrics(true)} />
              ) : (
                <div className="text-ghost text-sm mt-8 text-center">Aquest espectacle encara no té cançons.</div>
              )
            ) : (
              <CueTable cues={cues} songs={songs} selectedCueId={selectedCueId} onSelectCue={selectCue} />
            )}
          </div>

          {/* Panell d'edició del cue */}
          {selectedCue && (
            <>
              <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSelectedCueId(null)} />
              <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-page border-l border-rim shadow-2xl lg:static lg:z-auto lg:w-[440px] lg:max-w-none lg:shadow-none lg:shrink-0">
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
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-page border border-rim rounded-xl p-6 max-w-sm text-sm text-muted">
            Aquesta cançó no està enllaçada al repertori. Enllaça-la des del setlist per poder editar-ne la lletra.
            <button onClick={() => setEditingLyrics(false)} className="block mt-4 text-cyan-400 hover:text-cyan-300">Entesos</button>
          </div>
        </>
      )}
    </Layout>
  )
}
