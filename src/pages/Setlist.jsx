import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Pencil, X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, MicVocal, Music, Plus } from '../lib/icons'
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
import { useSetlistData } from '../hooks/useSetlistData'

// ─── Main component ───────────────────────────────────────────
export default function Setlist() {
  const { id: showId } = useParams()
  const navigate = useNavigate()

  const {
    show, parts, songs, moments, micAssignments,
    allMembers, setAllMembers, exclusions, loading, repertoire,
    positionsByMoment, diffByMoment, soloistsByMoment,
    expandedParts, setExpandedParts, expandedSongs, setExpandedSongs,
    allExpanded, setAllExpanded, songSensors,
    sections,
    handleCreatePart, handleUpdatePart, handleDeletePart,
    handleCreateSong, handleUpdateSong, handleDeleteSong,
    handleSongDragEnd, handleReorderMoments,
    handleAddMoment, handleDeleteMoment, handlePasteMoment,
    toggleExclusion,
  } = useSetlistData({ showId, navigate })

  const [creating, setCreating] = useState(false)
  const [creatingPart, setCreatingPart] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [editingPart, setEditingPart] = useState(null)
  const [showCast, setShowCast] = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [copiedMoment, setCopiedMoment] = useState(null)

  const repMap = Object.fromEntries(repertoire.map(r => [r.id, r]))

  return (
    <>
    <Layout fullWidth>
      <div className="flex flex-col min-h-0 h-full">
        <ShowToolbar showId={showId} showName={show?.name} />

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-pane border-b border-rim shrink-0 flex-wrap">
          <button onClick={() => {
            const next = !allExpanded
            setAllExpanded(next)
            const expAll = {}; for (const s of songs) expAll[s.id] = next
            setExpandedSongs(expAll)
          }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-line text-muted hover:text-body hover:bg-fill transition-colors"
            title={allExpanded ? 'Replegar tot' : 'Expandir tot'}>
            {allExpanded ? <ChevronsUp size={13} /> : <ChevronsDown size={13} />}
          </button>
          <button onClick={() => setShowCast(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${showCast ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-line text-muted hover:text-body hover:bg-fill'}`}>
            <MicVocal size={13} /> Membres {exclusions.size > 0 && <span className="ml-1 text-yellow-500">({allMembers.length - exclusions.size}/{allMembers.length})</span>}
          </button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => setCreatingPart(true)}>
            <Plus size={ICON.sm} /> Nova part
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={ICON.sm} /> Nou element
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
        <div className="p-4 md:p-6 space-y-4">

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
            onSave={creatingPart
              ? async (f) => { if (await handleCreatePart(f)) setCreatingPart(false) }
              : async (f) => { if (await handleUpdatePart(editingPart.id, f)) setEditingPart(null) }
            }
            onCancel={() => { setCreatingPart(false); setEditingPart(null) }}
            onDelete={editingPart ? async () => { if (await handleDeletePart(editingPart.id)) setEditingPart(null) } : null}
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
            onSave={creating
              ? async (f) => { if (await handleCreateSong(f)) setCreating(false) }
              : async (f) => { if (await handleUpdateSong(editingSong.id, f)) setEditingSong(null) }
            }
            onCancel={() => { setCreating(false); setEditingSong(null) }}
            onDelete={editingSong ? async () => { if (await handleDeleteSong(editingSong.id)) setEditingSong(null) } : null}
          />
        </Modal>

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
                    {part ? (
                      <div
                        onClick={() => setExpandedParts(prev => ({ ...prev, [part.id]: !(prev[part.id] !== false) }))}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-pane border-line hover:border-wire cursor-pointer transition-colors">
                        <span className="text-faint p-0.5 shrink-0">
                          {isPartExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <span className="font-semibold text-sm text-body flex-1">{part.title}</span>
                        <span className="text-xs text-ghost">{sectionSongs.length} cançó{sectionSongs.length !== 1 ? 'ns' : ''}</span>
                        <button title="Editar part" onClick={e => { e.stopPropagation(); setEditingPart(part) }}
                          className="text-faint hover:text-body p-2.5 rounded-lg hover:bg-fill transition-colors"><Pencil size={15} /></button>
                        <button title="Eliminar part" onClick={e => { e.stopPropagation(); handleDeletePart(part.id) }}
                          className="text-ghost hover:text-red-500 p-2.5 rounded-lg hover:bg-fill transition-colors"><X size={15} /></button>
                      </div>
                    ) : (
                      sectionSongs.length > 0 && (
                        <div className="px-1">
                          <span className="text-sm text-faint font-medium">Sense part</span>
                        </div>
                      )
                    )}

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
                              onPasteMoment={songId => handlePasteMoment(songId, copiedMoment)}
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
        </div>
      </div>
    </Layout>

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
}
