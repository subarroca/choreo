import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, X, ChevronUp, ChevronDown, ChevronRight, ChevronsUp, ChevronsDown, Mic, Music, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'

// ─── Sortable song row ────────────────────────────────────────
function SortableSong({ song, moments, parts, expanded, onToggle, onEdit, onDelete, onGoToMoment, onAddMoment, onDeleteMoment, showId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button {...attributes} {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1 -ml-1 touch-none">
          <GripVertical size={14} />
        </button>
        <button onClick={onToggle} className="text-gray-500 hover:text-white transition-colors shrink-0">
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button onClick={() => moments.length > 0 ? onGoToMoment(song.id, moments[0].id) : onAddMoment(song.id, true)}
          className="flex-1 text-left text-white font-medium hover:text-blue-400 transition-colors text-sm truncate">
          {song.title}
          {song.notes && <span className="ml-2 text-xs text-gray-500 font-normal">{song.notes}</span>}
        </button>
        <span className="text-xs text-gray-600 shrink-0">{moments.length}m</span>
        <button onClick={() => onEdit(song)}
          className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors shrink-0"><Pencil size={12} /></button>
        <button onClick={() => onDelete(song.id)}
          className="text-gray-600 hover:text-red-500 p-1 rounded hover:bg-gray-800 transition-colors shrink-0"><X size={12} /></button>
      </div>
      {expanded && (
        <div className="border-t border-gray-800 px-3 py-2 bg-gray-950/50">
          {moments.length === 0
            ? <p className="text-xs text-gray-600 italic">Sense moments</p>
            : (
              <div className="flex flex-wrap gap-1.5">
                {moments.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-0 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600">
                    <button onClick={() => onGoToMoment(song.id, m.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-2.5 py-1 transition-colors leading-snug text-left">
                      <span className="text-gray-500 mr-1">{i + 1}.</span>{m.title}
                      {m.subtitle && <span className="ml-1.5 text-gray-500 text-[10px]">{m.subtitle}</span>}
                    </button>
                    <button onClick={() => onDeleteMoment(m.id)}
                      className="bg-gray-800 hover:bg-red-900/40 text-gray-600 hover:text-red-400 px-1.5 py-1 border-l border-gray-700 transition-colors flex items-center"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          <button onClick={() => onAddMoment(song.id, false)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-400 transition-colors mt-1.5">
            <Plus size={10} /> Moment
          </button>
        </div>
      )}
    </div>
  )
}

function SongForm({ initial, parts, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [partId, setPartId] = useState(initial?.part_id ?? '')
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title, notes, part_id: partId || null }) }} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1 md:col-span-1">
          <label className="text-xs text-gray-400">Títol *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Títol de la cançó"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        {parts.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Part</label>
            <select value={partId} onChange={e => setPartId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">Sense part</option>
              {parts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Guardar</button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Cancel·lar</button>
      </div>
    </form>
  )
}

// ─── Part section ─────────────────────────────────────────────
function PartSection({ part, songs, moments, parts, allParts, expanded, expandedSongs, onTogglePart, onToggleSong,
  onEditPart, onDeletePart, onEditSong, onDeleteSong, onGoToMoment, onAddMoment, onDeleteMoment, onReorderSongs, showId }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = songs.findIndex(s => s.id === active.id)
    const newIndex = songs.findIndex(s => s.id === over.id)
    onReorderSongs(arrayMove(songs, oldIndex, newIndex))
  }

  return (
    <div className="space-y-2">
      {/* Part header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${part ? 'bg-gray-900 border-gray-700' : 'bg-transparent border-transparent'}`}>
        {part && (
          <button onClick={onTogglePart} className="text-gray-500 hover:text-white">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
        <span className={`font-semibold text-sm ${part ? 'text-gray-200' : 'text-gray-500'}`}>
          {part ? part.title : 'Sense part'}
        </span>
        <span className="text-xs text-gray-600">{songs.length} cançó{songs.length !== 1 ? 'ns' : ''}</span>
        {part && (
          <div className="ml-auto flex gap-1">
            <button onClick={() => onEditPart(part)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"><Pencil size={12} /></button>
            <button onClick={() => onDeletePart(part.id)} className="text-gray-600 hover:text-red-500 p-1 rounded hover:bg-gray-800 transition-colors"><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Songs within part */}
      {(!part || expanded) && (
        <div className="space-y-2 pl-0">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {songs.map(song => (
                <SortableSong key={song.id} song={song}
                  moments={moments[song.id] ?? []}
                  parts={allParts}
                  expanded={!!expandedSongs[song.id]}
                  onToggle={() => onToggleSong(song.id)}
                  onEdit={onEditSong}
                  onDelete={onDeleteSong}
                  onGoToMoment={onGoToMoment}
                  onAddMoment={onAddMoment}
                  onDeleteMoment={onDeleteMoment}
                  showId={showId} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// ─── Cast panel ───────────────────────────────────────────────
function CastPanel({ showId, allMembers, exclusions, onToggle }) {
  if (allMembers.length === 0) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Membres d'aquest espectacle</h3>
        <Link to="/members" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Gestionar cor →</Link>
      </div>
      <p className="text-xs text-gray-600">Clica per excloure algú d'aquest espectacle.</p>
      <div className="flex flex-wrap gap-2">
        {allMembers.map(m => {
          const excluded = exclusions.has(m.id)
          const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
          return (
            <button key={m.id} onClick={() => onToggle(m.id, excluded)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${excluded ? 'opacity-30 border-gray-700 bg-transparent' : 'border-transparent'}`}
              style={excluded ? {} : { backgroundColor: c.bg + '22', color: c.fg === '#fff' ? c.bg : c.fg, borderColor: c.bg + '55' }}
              title={excluded ? `${m.name} exclòs` : `Exclou ${m.name}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                style={{ backgroundColor: excluded ? '#374151' : c.bg, color: excluded ? '#6b7280' : c.fg }}>
                {(m.initials || m.name.slice(0, 2)).toUpperCase()}
              </span>
              <span className={excluded ? 'text-gray-600 line-through' : ''}>{m.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function Setlist() {
  const { id: showId } = useParams()
  const navigate = useNavigate()

  const [show, setShow] = useState(null)
  const [parts, setParts] = useState([])
  const [songs, setSongs] = useState([])
  const [moments, setMoments] = useState({})
  const [allMembers, setAllMembers] = useState([])
  const [exclusions, setExclusions] = useState(new Set())
  const [expandedParts, setExpandedParts] = useState({})
  const [expandedSongs, setExpandedSongs] = useState({})
  const [allExpanded, setAllExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingPart, setCreatingPart] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [editingPart, setEditingPart] = useState(null)
  const [showCast, setShowCast] = useState(false)

  useEffect(() => {
    async function load() {
      const [showRes, partsRes, songsRes, membersRes, exclusionsRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('parts').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
      ])
      setShow(showRes.data)
      setParts(partsRes.data ?? [])
      const songList = songsRes.data ?? []
      setSongs(songList)
      setAllMembers(membersRes.data ?? [])
      setExclusions(new Set((exclusionsRes.data ?? []).map(e => e.member_id)))
      // Default all songs expanded
      const expInit = {}; for (const s of songList) expInit[s.id] = true
      setExpandedSongs(expInit)
      if (songList.length) {
        const { data: momentData } = await supabase
          .from('moments').select('*').in('song_id', songList.map(s => s.id)).order('order_index')
        const grouped = {}
        for (const s of songList) grouped[s.id] = []
        for (const m of (momentData ?? [])) grouped[m.song_id] = [...(grouped[m.song_id] ?? []), m]
        setMoments(grouped)
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
    if (!confirm('Eliminar aquesta part? Les cançons quedaran sense part.')) return
    await supabase.from('parts').delete().eq('id', partId)
    setSongs(prev => prev.map(s => s.part_id === partId ? { ...s, part_id: null } : s))
    setParts(prev => prev.filter(p => p.id !== partId))
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
    if (!confirm('Eliminar aquesta cançó i tots els seus moments?')) return
    await supabase.from('songs').delete().eq('id', songId)
    setSongs(prev => prev.filter(s => s.id !== songId))
    setMoments(prev => { const n = { ...prev }; delete n[songId]; return n })
  }

  // ─── Reorder songs within a section ─────────────────────
  async function handleReorderSongs(reordered) {
    // Merge reordered section songs back into full songs list preserving other sections
    const ids = new Set(reordered.map(s => s.id))
    const others = songs.filter(s => !ids.has(s.id))
    const updated = [
      ...others,
      ...reordered.map((s, i) => ({ ...s, order_index: others.length + i })),
    ].map((s, i) => ({ ...s, order_index: i }))
    setSongs(updated)
    await Promise.all(updated.map(s => supabase.from('songs').update({ order_index: s.order_index }).eq('id', s.id)))
  }

  // ─── Moments ─────────────────────────────────────────────
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
    if (!confirm('Eliminar aquest moment?')) return
    await supabase.from('moments').delete().eq('id', momentId)
    setMoments(prev => {
      const next = {}
      for (const [sid, list] of Object.entries(prev)) next[sid] = list.filter(m => m.id !== momentId)
      return next
    })
  }

  function goToMoment(songId, momentId) {
    navigate(`/show/${showId}/song/${songId}/moment/${momentId}`)
  }

  // ─── Cast ────────────────────────────────────────────────
  async function toggleExclusion(memberId, currentlyExcluded) {
    if (currentlyExcluded) {
      await supabase.from('show_exclusions').delete().eq('show_id', showId).eq('member_id', memberId)
      setExclusions(prev => { const n = new Set(prev); n.delete(memberId); return n })
    } else {
      await supabase.from('show_exclusions').insert({ show_id: showId, member_id: memberId })
      setExclusions(prev => new Set([...prev, memberId]))
    }
  }

  // ─── Group songs by part ─────────────────────────────────
  const songsByPart = {}
  for (const song of songs) {
    const key = song.part_id ?? '__none__'
    ;(songsByPart[key] ??= []).push(song)
  }

  // Build sections: parts in order, then unassigned
  const sections = [
    ...parts.map(p => ({ key: p.id, part: p, songs: songsByPart[p.id] ?? [] })),
    ...(songsByPart['__none__']?.length ? [{ key: '__none__', part: null, songs: songsByPart['__none__'] }] : []),
  ]
  if (!sections.length && !songs.length) {
    sections.push({ key: '__none__', part: null, songs: [] })
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-300">Espectacles</Link>
              <span>/</span>
              <span className="text-gray-300">{show?.name ?? '…'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{show?.name ?? 'Carregant…'}</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => {
              const next = !allExpanded
              setAllExpanded(next)
              const expAll = {}; for (const s of songs) expAll[s.id] = next
              setExpandedSongs(expAll)
            }}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title={allExpanded ? 'Replegar tot' : 'Expandir tot'}>
              {allExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
            </button>
            <button onClick={() => setShowCast(v => !v)}
              className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border transition-colors ${showCast ? 'border-blue-600 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Mic size={14} /> Membres {exclusions.size > 0 && <span className="ml-1 text-xs text-yellow-500">({allMembers.length - exclusions.size}/{allMembers.length})</span>}
            </button>
            {!creatingPart && (
              <button onClick={() => setCreatingPart(true)}
                className="text-sm text-purple-400 hover:text-purple-300 px-4 py-2 rounded-lg hover:bg-gray-800 border border-purple-800 transition-colors">
                + Nova part
              </button>
            )}
            {!creating && (
              <button onClick={() => setCreating(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                + Nova cançó
              </button>
            )}
          </div>
        </div>

        {/* Cast panel */}
        {showCast && <CastPanel showId={showId} allMembers={allMembers} exclusions={exclusions} onToggle={toggleExclusion} />}

        {/* New part form */}
        {creatingPart && (
          <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nova part</h3>
            <PartForm onSave={handleCreatePart} onCancel={() => setCreatingPart(false)} />
          </div>
        )}
        {editingPart && (
          <div className="bg-gray-900 border border-purple-800/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Editar part</h3>
            <PartForm initial={editingPart} onSave={f => handleUpdatePart(editingPart.id, f)} onCancel={() => setEditingPart(null)} />
          </div>
        )}

        {/* New song form */}
        {creating && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nova cançó</h3>
            <SongForm parts={parts} onSave={handleCreateSong} onCancel={() => setCreating(false)} />
          </div>
        )}
        {editingSong && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Editar cançó</h3>
            <SongForm initial={editingSong} parts={parts}
              onSave={fields => handleUpdateSong(editingSong.id, fields)}
              onCancel={() => setEditingSong(null)} />
          </div>
        )}

        {/* Sections */}
        {loading ? <p className="text-gray-500">Carregant...</p> : (
          <div className="space-y-4">
            {sections.map(({ key, part, songs: sectionSongs }) => (
              <PartSection key={key}
                part={part}
                songs={sectionSongs}
                moments={moments}
                parts={parts}
                allParts={parts}
                expanded={part ? expandedParts[part.id] !== false : true}
                expandedSongs={expandedSongs}
                onTogglePart={() => part && setExpandedParts(prev => ({ ...prev, [part.id]: !(prev[part.id] !== false) }))}
                onToggleSong={id => setExpandedSongs(prev => ({ ...prev, [id]: !prev[id] }))}
                onEditPart={setEditingPart}
                onDeletePart={handleDeletePart}
                onEditSong={setEditingSong}
                onDeleteSong={handleDeleteSong}
                onGoToMoment={goToMoment}
                onAddMoment={handleAddMoment}
                onDeleteMoment={handleDeleteMoment}
                onReorderSongs={handleReorderSongs}
                showId={showId} />
            ))}
            {songs.length === 0 && !creating && (
              <div className="text-center py-16 text-gray-500">
                <Music size={40} className="mx-auto mb-4 opacity-30" />
                <p>Afegeix les cançons del setlist.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

// ─── Part form ────────────────────────────────────────────────
function PartForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title }) }} className="flex gap-3 items-end">
      <div className="space-y-1 flex-1">
        <label className="text-xs text-gray-400">Títol *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Part 1, Acte 2…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
      </div>
      <button type="submit" className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
      <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel·lar</button>
    </form>
  )
}
