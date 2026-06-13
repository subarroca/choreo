import { useState, useEffect, useRef } from 'react'
import { Search, X, Music, MessageSquare, AlertTriangle, Info } from 'lucide-react'

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

const ITEM_TYPES = [
  { id: 'song',        label: 'Cançó',       Icon: Music,          desc: 'Peça musical amb moments i posicions' },
  { id: 'text',        label: 'Text parlat',  Icon: MessageSquare,  desc: 'Fragment parlat per una o més persones' },
  { id: 'indication',  label: 'Indicació',    Icon: Info,           desc: 'Nota tècnica o de direcció' },
]

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

  function select(r) { onChange(r ? r.id : ''); setQuery(''); setOpen(false) }
  function handleInputClick() { setOpen(true); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0) }

  return (
    <div ref={ref} className="relative">
      {open ? (
        <div className="flex items-center gap-2 bg-fill border border-cyan-300 rounded-lg px-3 py-2">
          <Search size={13} className="text-faint shrink-0" />
          <input ref={inputRef} autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Cerca pel títol…"
            className="flex-1 bg-transparent text-sm text-body placeholder-gray-600 focus:outline-none" />
          <button type="button" onClick={() => setOpen(false)} className="text-ghost hover:text-body">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleInputClick}
          className="w-full flex items-center gap-2 bg-fill border border-line hover:border-gray-500 rounded-lg px-3 py-2 text-left transition-colors">
          <Search size={13} className="text-faint shrink-0" />
          <span className={`flex-1 text-sm truncate ${selected ? 'text-body' : 'text-faint'}`}>
            {selected ? selected.title : 'Triar del repertori…'}
          </span>
          {selected && (
            <button type="button" onClick={e => { e.stopPropagation(); select(null) }}
              className="text-ghost hover:text-body shrink-0"><X size={12} /></button>
          )}
        </button>
      )}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-pane border border-line rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          <button type="button" onClick={() => select(null)}
            className="w-full text-left px-3 py-2 text-xs text-faint hover:bg-fill hover:text-soft transition-colors border-b border-rim">
            — Títol personalitzat —
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ghost italic">Cap resultat per "{query}"</p>
          ) : filtered.map(r => (
            <button key={r.id} type="button" onClick={() => select(r)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-fill ${r.id === value ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-200'}`}>
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SpeakerPicker({ members, value, onChange }) {
  const selected = value ? JSON.parse(value) : []
  function toggle(id) {
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
    onChange(next.length ? JSON.stringify(next) : null)
  }
  const choir = members.filter(m => m.role !== 'director' && m.role !== 'musician')
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {choir.map(m => (
        <button key={m.id} type="button" onClick={() => toggle(m.id)}
          className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
            selected.includes(m.id)
              ? 'bg-emerald-700/30 border-emerald-500 text-emerald-200'
              : 'bg-fill border-line text-muted hover:text-body'
          }`}>
          {m.first_name || m.name.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}

export default function SongForm({ initial, parts, repertoire = [], members = [], onSave, onCancel }) {
  const initialType = initial?.type ?? 'song'
  const [type, setType] = useState(initialType)
  const [repId, setRepId] = useState(initial?.repertoire_song_id ?? '')
  const [customTitle, setCustomTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [partId, setPartId] = useState(initial?.part_id ?? '')
  const [durationStr, setDurationStr] = useState(formatDuration(initial?.duration_seconds))
  const [body, setBody] = useState(initial?.body ?? '')
  const [speakers, setSpeakers] = useState(initial?.speakers ?? null)

  const selectedRep = repertoire.find(r => r.id === repId)
  const displayTitle = selectedRep ? selectedRep.title : customTitle

  function handleSubmit(e) {
    e.preventDefault()
    if (type === 'song') {
      const title = displayTitle.trim()
      if (!title) return
      onSave({ type, title, repertoire_song_id: repId || null, notes: notes.trim() || null,
        part_id: partId || null, duration_seconds: parseDuration(durationStr), body: null, speakers: null })
    } else {
      const title = customTitle.trim() || (type === 'text' ? 'Text parlat' : 'Indicació')
      onSave({ type, title, body: body.trim() || null, speakers: speakers || null,
        part_id: partId || null, repertoire_song_id: null, notes: null, duration_seconds: null })
    }
  }

  const inputCls = 'w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Type selector */}
      {!initial && (
        <div className="grid grid-cols-3 gap-1.5">
          {ITEM_TYPES.map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setType(id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-colors ${
                type === id
                  ? 'border-cyan-600 text-cyan-300 bg-cyan-900/20'
                  : 'border-line text-muted hover:text-body hover:bg-fill'
              }`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}

      {type === 'song' && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-muted">Cançó del repertori</label>
            <RepPicker repertoire={repertoire} value={repId} onChange={setRepId} />
          </div>
          {!repId && (
            <div className="space-y-1">
              <label className="text-xs text-muted">Títol *</label>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                required={!repId} placeholder="Títol de la cançó" className={inputCls} />
            </div>
          )}
          {selectedRep && (
            <div className="flex items-center gap-2 bg-cyan-900/20 border border-cyan-800/50 rounded-lg px-3 py-2">
              <Music size={13} className="text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-body font-medium truncate">{selectedRep.title}</p>
                {selectedRep.composer && <p className="text-xs text-muted">{selectedRep.composer}</p>}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">Durada</label>
              <input value={durationStr} onChange={e => setDurationStr(e.target.value)} placeholder="3:45" className={inputCls} />
            </div>
            {parts.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-muted">Part</label>
                <select value={partId} onChange={e => setPartId(e.target.value)} className={inputCls}>
                  <option value="">Sense part</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}
          </div>
        </>
      )}

      {(type === 'text' || type === 'indication') && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-muted">Títol (opcional)</label>
            <input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
              placeholder={type === 'text' ? 'Presentació, diàleg…' : 'Canvi de posicions, teló…'}
              className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted">{type === 'text' ? 'Text' : 'Indicació'}</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder={type === 'text' ? 'El text que es dirà…' : 'Instrucció per al director o tècnic…'}
              className={inputCls + ' resize-y'} />
          </div>
          {type === 'text' && members.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted">Qui parla</label>
              <SpeakerPicker members={members} value={speakers} onChange={setSpeakers} />
            </div>
          )}
          {parts.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-muted">Part</label>
              <select value={partId} onChange={e => setPartId(e.target.value)} className={inputCls}>
                <option value="">Sense part</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button type="submit"
          className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          Guardar
        </button>
        <button type="button" onClick={onCancel}
          className="text-muted hover:text-body text-sm px-4 py-2 rounded-lg transition-colors">
          Cancel·lar
        </button>
      </div>
    </form>
  )
}
