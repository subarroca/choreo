import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Pencil, X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, MicVocal, Music, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'
import PersonProfileOverlay from '../components/PersonProfileOverlay'
import DroppableSongZone from '../components/setlist/DroppableSongZone'
import SortableSong from '../components/setlist/SortableSong'
import SongForm from '../components/setlist/SongForm'
import PartForm from '../components/setlist/PartForm'
import CastPanel from '../components/setlist/CastPanel'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { ICON } from '../lib/ui'

// ─── Main component ───────────────────────────────────────────
export default function Setlist() {
  const { id: showId } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [parts, setParts] = useState([])
  const [songs, setSongs] = useState([])
  const [moments, setMoments] = useState({})
  const [micAssignments, setMicAssignments] = useState({})
  const [allMembers, setAllMembers] = useState([])
  const [exclusions, setExclusions] = useState(new Set())
  const [expandedParts, setExpandedParts] = useState({})
  const [expandedSongs, setExpandedSongs] = useState({})
  const [allExpanded, setAllExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingPart, setCreatingPart] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [editingPart, setEditingPart] = useState(null)
  const [showCast, setShowCast] = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [repertoire, setRepertoire] = useState([])
  const [copiedMoment, setCopiedMoment] = useState(null)
  const [positionsByMoment, setPositionsByMoment] = useState({})
  const [diffByMoment, setDiffByMoment] = useState({})
  const [soloistsByMoment, setSoloistsByMoment] = useState({})

  const songSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    async function load() {
      const [showRes, partsRes, songsRes, membersRes, exclusionsRes, repRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('parts').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('repertoire_songs').select('id, title, composer, type').order('title'),
      ])
      setRepertoire(repRes.data ?? [])
      const showData = showRes.data
      setShow(showData)
      if (showData?.mic_assignments) {
        setMicAssignments(typeof showData.mic_assignments === 'string'
          ? JSON.parse(showData.mic_assignments)
          : showData.mic_assignments)
      }
      const partList = partsRes.data ?? []
      setParts(partList)
      const partExp = {}; for (const p of partList) partExp[p.id] = false
      setExpandedParts(partExp)
      const songList = songsRes.data ?? []
      setSongs(songList)
      setAllMembers(membersRes.data ?? [])
      setExclusions(new Set((exclusionsRes.data ?? []).map(e => e.member_id)))
      const expInit = {}; for (const s of songList) expInit[s.id] = false
      setExpandedSongs(expInit)
      if (songList.length) {
        const { data: momentData } = await supabase
          .from('moments').select('*').in('song_id', songList.map(s => s.id)).order('order_index')
        const grouped = {}
        for (const s of songList) grouped[s.id] = []
        for (const m of (momentData ?? [])) grouped[m.song_id] = [...(grouped[m.song_id] ?? []), m]
        setMoments(grouped)

        const allMomentIds = (momentData ?? []).map(m => m.id)
        if (allMomentIds.length) {
          const { data: posData } = await supabase
            .from('positions').select('moment_id, grid_row, grid_col, member_id')
            .in('moment_id', allMomentIds)
          const memberVoice = {}
          for (const m of (membersRes.data ?? [])) memberVoice[m.id] = m.voice
          const posByMoment = {}
          for (const p of (posData ?? [])) {
            if (!posByMoment[p.moment_id]) posByMoment[p.moment_id] = []
            posByMoment[p.moment_id].push({ row: p.grid_row, col: p.grid_col, voice: memberVoice[p.member_id], memberId: p.member_id })
          }
          setPositionsByMoment(posByMoment)

          // Compute which members changed position vs previous moment per song
          const diffSet = {}
          for (const [songId, songMoments] of Object.entries(grouped)) {
            for (let i = 1; i < songMoments.length; i++) {
              const prevId = songMoments[i - 1].id
              const currId = songMoments[i].id
              const prev = posByMoment[prevId] ?? []
              const curr = posByMoment[currId] ?? []
              const prevMap = {}
              for (const p of prev) prevMap[p.memberId] = `${p.row},${p.col}`
              const changed = new Set()
              for (const p of curr) {
                if (prevMap[p.memberId] !== `${p.row},${p.col}`) changed.add(p.memberId)
              }
              for (const p of prev) {
                if (!curr.find(c => c.memberId === p.memberId)) changed.add(p.memberId)
              }
              if (changed.size) diffSet[currId] = changed
            }
          }
          setDiffByMoment(diffSet)

          // Parse soloists from each moment
          const soloistsMap = {}
          for (const m of (momentData ?? [])) {
            if (m.soloists) {
              try { soloistsMap[m.id] = JSON.parse(m.soloists) } catch { soloistsMap[m.id] = [] }
            }
          }
          setSoloistsByMoment(soloistsMap)
        }
      }
      setLoading(false)
    }
    load()
  }, [showId])

  // ─── Parts CRUD ──────────────────────────────────────────
  async function handleCreatePart({ title }) {
    const { data, error } = await supabase.from('parts')
      .insert({ show_id: showId, title, order_index: parts.length }).select().single()
    if (!error) { setParts(prev => [...prev, data]); setCreatingPart(false) }
  }

  async function handleUpdatePart(partId, { title }) {
    const { data, error } = await supabase.from('parts').update({ title }).eq('id', partId).select().single()
    if (!error) { setParts(prev => prev.map(p => p.id === partId ? data : p)); setEditingPart(null) }
  }

  async function handleDeletePart(partId) {
    if (!(await confirmDialog('Eliminar aquesta part? Les cançons quedaran sense part.'))) return
    await supabase.from('parts').delete().eq('id', partId)
    setSongs(prev => prev.map(s => s.part_id === partId ? { ...s, part_id: null } : s))
    setParts(prev => prev.filter(p => p.id !== partId))
    setEditingPart(null)
  }

  // ─── Songs CRUD ──────────────────────────────────────────
  async function handleCreateSong(fields) {
    const { data, error } = await supabase.from('songs')
      .insert({ ...fields, show_id: showId, order_index: songs.length }).select().single()
    if (!error) { setSongs(prev => [...prev, data]); setMoments(prev => ({ ...prev, [data.id]: [] })); setCreating(false) }
  }

  async function handleUpdateSong(songId, fields) {
    const { data, error } = await supabase.from('songs').update(fields).eq('id', songId).select().single()
    if (!error) { setSongs(prev => prev.map(s => s.id === songId ? data : s)); setEditingSong(null) }
  }

  async function handleDeleteSong(songId) {
    if (!(await confirmDialog('Eliminar aquesta cançó i tots els seus moments?'))) return
    await supabase.from('songs').delete().eq('id', songId)
    setSongs(prev => prev.filter(s => s.id !== songId))
    setMoments(prev => { const n = { ...prev }; delete n[songId]; return n })
    setEditingSong(null)
  }

  // ─── Song drag-and-drop (cross-part + reorder) ───────────
  async function handleSongDragEnd({ active, over }) {
    if (!over) return
    const activeSong = songs.find(s => s.id === active.id)
    if (!activeSong) return

    // Dropped onto a part drop zone → move to that part
    if (String(over.id).startsWith('drop-part-')) {
      const targetPartId = over.id === 'drop-part-none' ? null : over.id.replace('drop-part-', '')
      if (targetPartId !== activeSong.part_id) {
        const { data, error } = await supabase.from('songs').update({ part_id: targetPartId }).eq('id', activeSong.id).select().single()
        if (!error) setSongs(prev => prev.map(s => s.id === activeSong.id ? data : s))
      }
      return
    }

    // Dropped onto another song → reorder within same part, or move cross-part
    const overSong = songs.find(s => s.id === over.id)
    if (!overSong) return

    if (activeSong.part_id !== overSong.part_id) {
      const { data, error } = await supabase.from('songs').update({ part_id: overSong.part_id }).eq('id', activeSong.id).select().single()
      if (!error) setSongs(prev => prev.map(s => s.id === activeSong.id ? data : s))
      return
    }

    const partSongs = songs.filter(s => s.part_id === activeSong.part_id)
    const oldIndex = partSongs.findIndex(s => s.id === activeSong.id)
    const newIndex = partSongs.findIndex(s => s.id === overSong.id)
    if (oldIndex === newIndex) return

    const reordered = arrayMove(partSongs, oldIndex, newIndex)
    const otherSongs = songs.filter(s => s.part_id !== activeSong.part_id)
    const updated = [...otherSongs, ...reordered].map((s, i) => ({ ...s, order_index: i }))
    setSongs(updated)
    await Promise.all(reordered.map((s, i) => supabase.from('songs').update({ order_index: otherSongs.length + i }).eq('id', s.id)))
  }

  // ─── Moment reorder ──────────────────────────────────────
  async function handleReorderMoments(songId, reordered) {
    setMoments(prev => ({ ...prev, [songId]: reordered }))
    await Promise.all(reordered.map((m, i) => supabase.from('moments').update({ order_index: i }).eq('id', m.id)))
  }

  // ─── Moments CRUD ────────────────────────────────────────
  async function handleAddMoment(songId, navigateAfter = false) {
    const existing = moments[songId] ?? []
    const { data, error } = await supabase.from('moments')
      .insert({ song_id: songId, title: `Moment ${existing.length + 1}`, order_index: existing.length, grid_mode: 'alternate' })
      .select().single()
    if (!error) {
      setMoments(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), data] }))
      setExpandedSongs(prev => ({ ...prev, [songId]: true }))
      setAllExpanded(true)
      if (navigateAfter) navigate(`/show/${showId}/song/${songId}/moment/${data.id}`)
    }
  }

  async function handleDeleteMoment(momentId) {
    if (!(await confirmDialog('Eliminar aquest moment?'))) return
    await supabase.from('moments').delete().eq('id', momentId)
    setMoments(prev => {
      const next = {}
      for (const [sid, list] of Object.entries(prev)) next[sid] = list.filter(m => m.id !== momentId)
      return next
    })
  }

  // ─── Copy/paste moments ──────────────────────────────────
  async function handlePasteMoment(targetSongId) {
    if (!copiedMoment) return
    const existing = moments[targetSongId] ?? []
    const { data: newMom, error } = await supabase.from('moments')
      .insert({ song_id: targetSongId, title: copiedMoment.title, order_index: existing.length, grid_mode: copiedMoment.grid_mode ?? 'alternate' })
      .select().single()
    if (error || !newMom) return
    const { data: srcPos } = await supabase.from('positions').select('*').eq('moment_id', copiedMoment.id)
    if (srcPos?.length) {
      await supabase.from('positions').insert(srcPos.map(p => ({
        moment_id: newMom.id, member_id: p.member_id,
        grid_row: p.grid_row, grid_col: p.grid_col, free_x: p.free_x, free_y: p.free_y,
      })))
    }
    setMoments(prev => ({ ...prev, [targetSongId]: [...(prev[targetSongId] ?? []), newMom] }))
    setExpandedSongs(prev => ({ ...prev, [targetSongId]: true }))
  }

  // ─── Repertoire map (id → song) ──────────────────────────
  const repMap = Object.fromEntries(repertoire.map(r => [r.id, r]))

  // ─── Group songs by part ─────────────────────────────────
  const songsByPart = {}
  for (const song of songs) {
    const key = song.part_id ?? '__none__'
    ;(songsByPart[key] ??= []).push(song)
  }

  const sections = [
    ...parts.map(p => ({ key: p.id, part: p, songs: songsByPart[p.id] ?? [] })),
    ...(songsByPart['__none__']?.length ? [{ key: '__none__', part: null, songs: songsByPart['__none__'] }] : []),
  ]
  if (!sections.length && !songs.length) {
    sections.push({ key: '__none__', part: null, songs: [] })
  }

  return (
    <>
    <Layout>
      <div className="space-y-5">
        {/* Toolbar */}
        <ShowToolbar showId={showId} showName={show?.name} />

        {/* Action bar */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => {
            const next = !allExpanded
            setAllExpanded(next)
            const expAll = {}; for (const s of songs) expAll[s.id] = next
            setExpandedSongs(expAll)
          }}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-line text-muted hover:text-body hover:bg-fill transition-colors"
            title={allExpanded ? 'Replegar tot' : 'Expandir tot'}>
            {allExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
          </button>
          <button onClick={() => setShowCast(v => !v)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors ${showCast ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-muted hover:text-body hover:bg-fill'}`}>
            <MicVocal size={14} /> Membres {exclusions.size > 0 && <span className="ml-1 text-xs text-yellow-500">({allMembers.length - exclusions.size}/{allMembers.length})</span>}
          </button>
          <Button variant="ghost" onClick={() => setCreatingPart(true)}>
            <Plus size={ICON.sm} /> Nova part
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus size={ICON.sm} /> Nou element
          </Button>
        </div>

        {/* Cast panel */}
        {showCast && <CastPanel showId={showId} allMembers={allMembers} exclusions={exclusions} onToggle={toggleExclusion} onEditMember={setEditingMember} />}

        {/* Part modal */}
        <Modal
          open={creatingPart || !!editingPart}
          onClose={() => { setCreatingPart(false); setEditingPart(null) }}
          title={creatingPart ? 'Nova part' : 'Editar part'}
          width="sm"
        >
          <PartForm
            initial={editingPart ?? undefined}
            onSave={creatingPart ? handleCreatePart : f => handleUpdatePart(editingPart.id, f)}
            onCancel={() => { setCreatingPart(false); setEditingPart(null) }}
            onDelete={editingPart ? () => handleDeletePart(editingPart.id) : null}
          />
        </Modal>

        {/* Song modal */}
        <Modal
          open={creating || !!editingSong}
          onClose={() => { setCreating(false); setEditingSong(null) }}
          title={creating ? 'Nou element' : 'Editar element'}
          width="lg"
        >
          <SongForm
            initial={editingSong ?? undefined}
            parts={parts}
            repertoire={repertoire}
            members={allMembers}
            onSave={creating ? handleCreateSong : fields => handleUpdateSong(editingSong.id, fields)}
            onCancel={() => { setCreating(false); setEditingSong(null) }}
            onDelete={editingSong ? () => handleDeleteSong(editingSong.id) : null}
          />
        </Modal>

        {/* Sections — single DndContext for cross-part song drag */}
        {loading ? <p className="text-faint">Carregant...</p> : (
          <DndContext sensors={songSensors} collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveDragId(active.id)}
            onDragEnd={(e) => { setActiveDragId(null); handleSongDragEnd(e) }}
            onDragCancel={() => setActiveDragId(null)}>
            <div className="space-y-6">
              {sections.map(({ key, part, songs: sectionSongs }) => {
                const dropId = part ? `drop-part-${part.id}` : 'drop-part-none'
                const isPartExpanded = part ? expandedParts[part.id] !== false : true

                return (
                  <div key={key} className="space-y-2">
                    {/* Part header */}
                    {part ? (
                      <div
                        onClick={() => setExpandedParts(prev => ({ ...prev, [part.id]: !(prev[part.id] !== false) }))}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-pane border-line hover:border-wire cursor-pointer transition-colors">
                        <span className="text-faint p-0.5 shrink-0">
                          {isPartExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <span className="font-semibold text-sm text-gray-200 flex-1">{part.title}</span>
                        <span className="text-xs text-ghost">{sectionSongs.length} cançó{sectionSongs.length !== 1 ? 'ns' : ''}</span>
                        <button onClick={e => { e.stopPropagation(); setEditingPart(part) }}
                          className="text-faint hover:text-body p-2.5 rounded-lg hover:bg-fill transition-colors"><Pencil size={15} /></button>
                        <button onClick={e => { e.stopPropagation(); handleDeletePart(part.id) }}
                          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors"><X size={15} /></button>
                      </div>
                    ) : (
                      sectionSongs.length > 0 && (
                        <div className="px-1">
                          <span className="text-sm text-faint font-medium">Sense part</span>
                        </div>
                      )
                    )}

                    {/* Song list (droppable zone) */}
                    {isPartExpanded && (
                      <DroppableSongZone id={dropId} isEmpty={sectionSongs.length === 0}>
                        <SortableContext items={sectionSongs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                          {sectionSongs.map(song => (
                            <SortableSong key={song.id} song={song}
                              moments={moments[song.id] ?? []}
                              expanded={!!expandedSongs[song.id]}
                              onToggle={() => setExpandedSongs(prev => ({ ...prev, [song.id]: !prev[song.id] }))}
                              onEdit={setEditingSong}
                              onDelete={handleDeleteSong}
                              onAddMoment={handleAddMoment}
                              onDeleteMoment={handleDeleteMoment}
                              onReorderMoments={handleReorderMoments}
                              showId={showId}
                              activeDragId={activeDragId}
                              repSong={song.repertoire_song_id ? repMap[song.repertoire_song_id] : null}
                              micAssignments={micAssignments}
                              members={allMembers}
                              copiedMoment={copiedMoment}
                              onCopyMoment={setCopiedMoment}
                              onPasteMoment={handlePasteMoment}
                              positionsByMoment={positionsByMoment}
                              diffByMoment={diffByMoment}
                              soloistsByMoment={soloistsByMoment}
                              allMembers={allMembers}
                              gridRows={show?.grid_rows?.length ?? 8}
                              gridCols={show?.grid_cols ?? 14} />
                          ))}
                        </SortableContext>
                        {sectionSongs.length === 0 && (
                          <div className="text-center py-6 text-ghost text-xs border-2 border-dashed border-rim rounded-xl">
                            Arrossega cançons aquí
                          </div>
                        )}
                      </DroppableSongZone>
                    )}
                  </div>
                )
              })}

              {songs.length === 0 && !creating && (
                <EmptyState icon={Music} title="Afegeix les cançons del setlist." />
              )}
            </div>

            {/* Drag overlay — ghost card shown while dragging */}
            <DragOverlay dropAnimation={null}>
              {activeDragId ? (() => {
                const s = songs.find(s => s.id === activeDragId)
                if (!s) return null
                return (
                  <div className="bg-pane border-2 border-cyan-300 rounded-xl px-4 py-3 shadow-2xl opacity-95 pointer-events-none">
                    <p className="text-sm font-medium text-body">{s.title}</p>
                    {s.notes && <p className="text-xs text-faint mt-0.5">{s.notes}</p>}
                  </div>
                )
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </Layout>

    {/* Member profile overlay */}
    {editingMember && (
      <PersonProfileOverlay
        member={editingMember}
        isNew={false}
        onClose={() => setEditingMember(null)}
        onSave={async (fields) => {
          const { data, error } = await supabase.from('members').update(fields).eq('id', editingMember.id).select().single()
          if (!error) {
            setAllMembers(prev => prev.map(m => m.id === editingMember.id ? data : m))
            setEditingMember(data)
          }
        }}
        onSetActive={async (id, active) => {
          const fields = active ? { active: true, left_at: null } : { active: false, left_at: new Date().toISOString() }
          const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
          if (!error) { setAllMembers(prev => prev.map(m => m.id === id ? data : m)); setEditingMember(data) }
        }}
        onDelete={async (id) => {
          if (!(await confirmDialog('Eliminar definitivament?'))) return
          await supabase.from('members').delete().eq('id', id)
          setAllMembers(prev => prev.filter(m => m.id !== id))
          setEditingMember(null)
        }} />
    )}
    </>
  )

  async function toggleExclusion(memberId, currentlyExcluded) {
    if (currentlyExcluded) {
      await supabase.from('show_exclusions').delete().eq('show_id', showId).eq('member_id', memberId)
      setExclusions(prev => { const n = new Set(prev); n.delete(memberId); return n })
    } else {
      await supabase.from('show_exclusions').insert({ show_id: showId, member_id: memberId })
      setExclusions(prev => new Set([...prev, memberId]))
    }
  }
}
