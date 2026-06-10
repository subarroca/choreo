import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  useDroppable, DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, X, ChevronUp, ChevronDown, ChevronRight, ChevronsUp, ChevronsDown, Mic, Music, Plus, ArrowRight, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Layout from '../components/Layout'
import PersonProfileOverlay from '../components/PersonProfileOverlay'

// ─── Sortable moment row ──────────────────────────────────────
function SortableMomentRow({ moment, index, showId, songId, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: moment.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2 pl-8 pr-3 py-2 border-b border-gray-800/50 bg-black/20 hover:bg-black/40 border-l-2 border-l-gray-700/60 group transition-colors">
      <button {...attributes} {...listeners}
        className="text-gray-700 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 -ml-1 touch-none shrink-0">
        <GripVertical size={13} />
      </button>
      <span className="text-xs text-gray-600 w-5 text-center shrink-0 tabular-nums">{index + 1}</span>
      <Link to={`/show/${showId}/song/${songId}/moment/${moment.id}`} className="flex-1 min-w-0 py-0.5">
        <span className="text-sm text-gray-200 font-medium block truncate">{moment.title}</span>
        {moment.subtitle && <span className="text-xs text-gray-500 block truncate">{moment.subtitle}</span>}
      </Link>
      <Link to={`/show/${showId}/song/${songId}/moment/${moment.id}`}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-400 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
        <ArrowRight size={13} />
      </Link>
      <button onClick={() => onDelete(moment.id)}
        className="text-gray-700 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Droppable part zone ──────────────────────────────────────
function DroppableSongZone({ id, children, isEmpty }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef}
      className={`space-y-2 rounded-xl transition-colors ${isOver ? 'bg-blue-950/30 ring-1 ring-blue-700/50' : ''} ${isEmpty && isOver ? 'min-h-[60px]' : ''}`}>
      {children}
    </div>
  )
}

// ─── Sortable song row ────────────────────────────────────────
function SortableSong({ song, moments, expanded, onToggle, onEdit, onDelete, onAddMoment, onDeleteMoment, onReorderMoments, showId, activeDragId, repSong }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id })
  const isOtherDragging = activeDragId && activeDragId !== song.id
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : isOtherDragging ? 0.4 : 1,
  }

  const momentSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleMomentDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = moments.findIndex(m => m.id === active.id)
    const newIndex = moments.findIndex(m => m.id === over.id)
    onReorderMoments(song.id, arrayMove(moments, oldIndex, newIndex))
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Song header */}
      <div className="flex items-center gap-1.5 px-2 min-h-[52px]">
        <button {...attributes} {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-2 touch-none shrink-0">
          <GripVertical size={15} />
        </button>
        <button onClick={onToggle} className="text-gray-500 hover:text-white p-1.5 transition-colors shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button onClick={onToggle}
          className="flex-1 text-left min-w-0 py-2">
          <span className="text-sm font-medium text-white block truncate">
            {repSong ? repSong.title : song.title}
          </span>
          <span className="text-xs text-gray-500 block truncate">
            {repSong?.composer && <span className="text-gray-600">{repSong.composer}</span>}
            {repSong?.composer && song.notes && <span className="text-gray-700"> · </span>}
            {song.notes}
          </span>
        </button>
        {song.duration_seconds > 0 && (
          <span className="text-xs text-gray-500 shrink-0 tabular-nums">{formatDuration(song.duration_seconds)}</span>
        )}
        <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full shrink-0 tabular-nums">
          {moments.length}m
        </span>
        <button onClick={() => onEdit(song)}
          className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(song.id)}
          className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
          <X size={13} />
        </button>
      </div>

      {/* Moments list */}
      {expanded && (
        <div className="border-t border-gray-800">
          {moments.length === 0
            ? <p className="px-4 py-3 text-xs text-gray-600 italic">Sense moments</p>
            : (
              <DndContext sensors={momentSensors} collisionDetection={closestCenter} onDragEnd={handleMomentDragEnd}>
                <SortableContext items={moments.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  {moments.map((m, i) => (
                    <SortableMomentRow key={m.id} moment={m} index={i}
                      showId={showId} songId={song.id}
                      onDelete={onDeleteMoment} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          <button onClick={() => onAddMoment(song.id, false)}
            className="flex items-center gap-1.5 w-full px-4 py-3 text-xs text-blue-600 hover:text-blue-400 hover:bg-gray-800 transition-colors border-t border-gray-800">
            <Plus size={12} /> Afegir moment
          </button>
          {song.lyrics && (
            <details className="border-t border-gray-800 group">
              <summary className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer list-none flex items-center gap-1.5 select-none">
                <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                Lletra
              </summary>
              <pre className="px-4 pb-4 text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">{song.lyrics}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Song form ────────────────────────────────────────────────
function parseDuration(str) {
  if (!str) return null
  const parts = str.split(':').map(s => parseInt(s, 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1]
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0]
  return null
}
function formatDuration(secs) {
  if (!secs) return ''
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

// ─── Repertoire combobox ──────────────────────────────────────
function RepPicker({ repertoire, value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)
  const inputRef          = useRef(null)

  const selected = repertoire.find(r => r.id === value)

  const filtered = query.trim()
    ? repertoire.filter(r => r.title.toLowerCase().includes(query.toLowerCase()))
    : repertoire

  useEffect(() => {
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function select(r) {
    onChange(r ? r.id : '')
    setQuery('')
    setOpen(false)
  }

  function handleInputClick() {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      {open ? (
        <div className="flex items-center gap-2 bg-gray-800 border border-blue-500 rounded-lg px-3 py-2">
          <Search size={13} className="text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca pel títol…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
          />
          <button type="button" onClick={() => setOpen(false)} className="text-gray-600 hover:text-white">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInputClick}
          className="w-full flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 text-left transition-colors"
        >
          <Search size={13} className="text-gray-500 shrink-0" />
          <span className={`flex-1 text-sm truncate ${selected ? 'text-white' : 'text-gray-500'}`}>
            {selected ? selected.title : 'Triar del repertori…'}
          </span>
          {selected && (
            <button type="button" onClick={e => { e.stopPropagation(); select(null) }}
              className="text-gray-600 hover:text-white shrink-0">
              <X size={12} />
            </button>
          )}
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {/* Clear option */}
          <button type="button" onClick={() => select(null)}
            className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors border-b border-gray-800">
            — Títol personalitzat —
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-600 italic">Cap resultat per "{query}"</p>
          ) : filtered.map(r => (
            <button key={r.id} type="button" onClick={() => select(r)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 ${r.id === value ? 'text-blue-400 bg-blue-900/20' : 'text-gray-200'}`}>
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SongForm({ initial, parts, repertoire = [], onSave, onCancel }) {
  const [repId, setRepId]           = useState(initial?.repertoire_song_id ?? '')
  const [customTitle, setCustomTitle] = useState(initial?.title ?? '')
  const [notes, setNotes]           = useState(initial?.notes ?? '')
  const [partId, setPartId]         = useState(initial?.part_id ?? '')
  const [durationStr, setDurationStr] = useState(formatDuration(initial?.duration_seconds))

  const selectedRep = repertoire.find(r => r.id === repId)
  const displayTitle = selectedRep ? selectedRep.title : customTitle

  function handleSubmit(e) {
    e.preventDefault()
    const title = displayTitle.trim()
    if (!title) return
    onSave({
      title,
      repertoire_song_id: repId || null,
      notes: notes.trim() || null,
      part_id: partId || null,
      duration_seconds: parseDuration(durationStr),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Repertoire picker */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Cançó del repertori</label>
        <RepPicker repertoire={repertoire} value={repId} onChange={setRepId} />
      </div>

      {/* Custom title (only shown if no rep selected) */}
      {!repId && (
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Títol *</label>
          <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
            required={!repId} placeholder="Títol de la cançó"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
      )}
      {/* Preview of selected rep title */}
      {selectedRep && (
        <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-800/50 rounded-lg px-3 py-2">
          <Music size={13} className="text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">{selectedRep.title}</p>
            {selectedRep.composer && <p className="text-xs text-gray-400">{selectedRep.composer}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Durada</label>
          <input value={durationStr} onChange={e => setDurationStr(e.target.value)} placeholder="3:45"
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
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel·lar</button>
      </div>
    </form>
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

const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']

// ─── Cast panel ───────────────────────────────────────────────
function MemberChip({ member, excluded, onToggle, onEdit }) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  return (
    <div className={`flex items-center gap-1.5 rounded-lg text-xs border transition-all ${excluded ? 'opacity-40 border-gray-700 bg-gray-800/30' : 'bg-gray-800 border-gray-700'}`}>
      <button onClick={() => onToggle(member.id, excluded)}
        className="flex items-center gap-1.5 px-2 py-2 flex-1 text-left min-w-0"
        title={excluded ? `Afegir ${member.name}` : `Treure ${member.name}`}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          style={{ backgroundColor: excluded ? '#374151' : c.bg, color: excluded ? '#6b7280' : c.fg }}>
          {(member.initials || member.name?.slice(0, 2) || '?').toUpperCase()}
        </span>
        <span className={`truncate ${excluded ? 'text-gray-600 line-through' : 'text-gray-200'}`}>{member.name}</span>
      </button>
      <button onClick={() => onEdit(member)}
        className="text-gray-600 hover:text-white p-1.5 rounded-r-lg hover:bg-gray-700 transition-colors shrink-0"
        title="Editar perfil">
        <Pencil size={10} />
      </button>
    </div>
  )
}

function CastPanel({ showId, allMembers, exclusions, onToggle, onEditMember }) {
  if (allMembers.length === 0) return null
  const byVoice = VOICE_ORDER
    .map(v => ({ voice: v, members: allMembers.filter(m => m.voice === v) }))
    .filter(g => g.members.length > 0)
  const ungrouped = allMembers.filter(m => !VOICE_ORDER.includes(m.voice))
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Membres d'aquest espectacle</h3>
        <Link to="/members" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">Gestionar cor →</Link>
      </div>
      <p className="text-xs text-gray-600">Clica el nom per incloure/excloure · <Pencil size={9} className="inline" /> per editar el perfil.</p>
      <div className="space-y-4">
        {byVoice.map(({ voice, members: vMembers }) => {
          const c = VOICE_COLORS[voice] ?? VOICE_COLORS.extra
          return (
            <div key={voice}>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: c.bg }}>
                {VOICE_LABELS[voice]}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {vMembers.map(m => (
                  <MemberChip key={m.id} member={m} excluded={exclusions.has(m.id)}
                    onToggle={onToggle} onEdit={onEditMember} />
                ))}
              </div>
            </div>
          )
        })}
        {ungrouped.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Altres</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ungrouped.map(m => (
                <MemberChip key={m.id} member={m} excluded={exclusions.has(m.id)}
                  onToggle={onToggle} onEdit={onEditMember} />
              ))}
            </div>
          </div>
        )}
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
        supabase.from('repertoire_songs').select('id, title, composer').order('title'),
      ])
      setRepertoire(repRes.data ?? [])
      setShow(showRes.data)
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
    if (!confirm('Eliminar aquest moment?')) return
    await supabase.from('moments').delete().eq('id', momentId)
    setMoments(prev => {
      const next = {}
      for (const [sid, list] of Object.entries(prev)) next[sid] = list.filter(m => m.id !== momentId)
      return next
    })
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
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
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
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title={allExpanded ? 'Replegar tot' : 'Expandir tot'}>
              {allExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
            </button>
            <Link to={`/show/${showId}/mics`}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Mic size={14} /> Micros
            </Link>
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
        {showCast && <CastPanel showId={showId} allMembers={allMembers} exclusions={exclusions} onToggle={toggleExclusion} onEditMember={setEditingMember} />}

        {/* Part forms */}
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

        {/* Song forms */}
        {creating && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nova cançó</h3>
            <SongForm parts={parts} repertoire={repertoire} onSave={handleCreateSong} onCancel={() => setCreating(false)} />
          </div>
        )}
        {editingSong && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Editar cançó</h3>
            <SongForm initial={editingSong} parts={parts} repertoire={repertoire}
              onSave={fields => handleUpdateSong(editingSong.id, fields)}
              onCancel={() => setEditingSong(null)} />
          </div>
        )}

        {/* Sections — single DndContext for cross-part song drag */}
        {loading ? <p className="text-gray-500">Carregant...</p> : (
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
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-gray-900 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                        <span className="text-gray-500 p-0.5 shrink-0">
                          {isPartExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <span className="font-semibold text-sm text-gray-200 flex-1">{part.title}</span>
                        <span className="text-xs text-gray-600">{sectionSongs.length} cançó{sectionSongs.length !== 1 ? 'ns' : ''}</span>
                        <button onClick={e => { e.stopPropagation(); setEditingPart(part) }}
                          className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><Pencil size={13} /></button>
                        <button onClick={e => { e.stopPropagation(); handleDeletePart(part.id) }}
                          className="text-gray-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"><X size={13} /></button>
                      </div>
                    ) : (
                      sectionSongs.length > 0 && (
                        <div className="px-1">
                          <span className="text-sm text-gray-500 font-medium">Sense part</span>
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
                              repSong={song.repertoire_song_id ? repMap[song.repertoire_song_id] : null} />
                          ))}
                        </SortableContext>
                        {sectionSongs.length === 0 && (
                          <div className="text-center py-6 text-gray-600 text-xs border-2 border-dashed border-gray-800 rounded-xl">
                            Arrossega cançons aquí
                          </div>
                        )}
                      </DroppableSongZone>
                    )}
                  </div>
                )
              })}

              {songs.length === 0 && !creating && (
                <div className="text-center py-16 text-gray-500">
                  <Music size={40} className="mx-auto mb-4 opacity-30" />
                  <p>Afegeix les cançons del setlist.</p>
                </div>
              )}
            </div>

            {/* Drag overlay — ghost card shown while dragging */}
            <DragOverlay dropAnimation={null}>
              {activeDragId ? (() => {
                const s = songs.find(s => s.id === activeDragId)
                if (!s) return null
                return (
                  <div className="bg-gray-900 border-2 border-blue-500 rounded-xl px-4 py-3 shadow-2xl opacity-95 pointer-events-none">
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    {s.notes && <p className="text-xs text-gray-500 mt-0.5">{s.notes}</p>}
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
          if (!confirm('Eliminar definitivament?')) return
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
