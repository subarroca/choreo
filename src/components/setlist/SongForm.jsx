import { useState, useEffect, useRef } from 'react'
import { Search, X, Music } from 'lucide-react'

export function parseDuration(str) {
  if (!str) return null
  const parts = str.split(':').map(s => parseInt(s, 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1]
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0]
  return null
}

export function formatDuration(secs) {
  if (!secs) return ''
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

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
        <div className="flex items-center gap-2 bg-gray-800 border border-cyan-300 rounded-lg px-3 py-2">
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
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-gray-800 ${r.id === value ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-200'}`}>
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SongForm({ initial, parts, repertoire = [], onSave, onCancel }) {
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
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
      )}
      {/* Preview of selected rep title */}
      {selectedRep && (
        <div className="flex items-center gap-2 bg-cyan-900/20 border border-cyan-800/50 rounded-lg px-3 py-2">
          <Music size={13} className="text-cyan-400 shrink-0" />
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
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Durada</label>
          <input value={durationStr} onChange={e => setDurationStr(e.target.value)} placeholder="3:45"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
        {parts.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Part</label>
            <select value={partId} onChange={e => setPartId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300">
              <option value="">Sense part</option>
              {parts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel·lar</button>
      </div>
    </form>
  )
}
