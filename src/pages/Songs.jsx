import { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, Pencil, Trash2, ExternalLink, Music, Globe, Lock, FileText, Upload, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Layout from '../components/Layout'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600'
const labelCls = 'text-xs text-gray-400 mb-1 block'

const ATTACHMENT_TYPES = [
  { value: 'reference', label: 'Referència / Link', icon: ExternalLink, color: 'text-blue-400' },
  { value: 'score',     label: 'Partitura',          icon: FileText,     color: 'text-purple-400' },
  { value: 'audio',     label: 'Àudio',              icon: Music,        color: 'text-green-400' },
]

function AttachmentIcon({ type, size = 12 }) {
  const t = ATTACHMENT_TYPES.find(t => t.value === type) ?? ATTACHMENT_TYPES[0]
  const Icon = t.icon
  return <Icon size={size} className={t.color} />
}

// ── AttachmentEditor ──────────────────────────────────────────
function AttachmentEditor({ attachments, onChange }) {
  const [adding, setAdding] = useState(false)
  const [type, setType]     = useState('reference')
  const [label, setLabel]   = useState('')
  const [url, setUrl]       = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  function addAttachment() {
    if (!url.trim()) return
    onChange([...attachments, { type, label: label.trim() || ATTACHMENT_TYPES.find(t => t.value === type).label, url: url.trim() }])
    setAdding(false); setLabel(''); setUrl(''); setType('reference')
  }

  function removeAttachment(i) {
    onChange(attachments.filter((_, idx) => idx !== i))
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('repertoire-files').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('repertoire-files').getPublicUrl(data.path)
      setUrl(publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <AttachmentIcon type={a.type} size={13} />
              <span className="text-xs text-gray-300 flex-1 truncate">{a.label}</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-blue-400 truncate max-w-[140px] transition-colors">
                {a.url.replace(/^https?:\/\//, '').slice(0, 30)}…
              </a>
              <button type="button" onClick={() => removeAttachment(i)}
                className="text-gray-600 hover:text-red-500 transition-colors shrink-0">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Tipus</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500">
                {ATTACHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Etiqueta</label>
              <input value={label} onChange={e => setLabel(e.target.value)}
                placeholder="ex. Soprano, YouTube…" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>URL o fitxer</label>
            <div className="flex gap-2">
              <input value={url} onChange={e => setUrl(e.target.value)} type="url"
                placeholder="https://…" className={inputCls} />
              {!DEV_MODE && (
                <>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="shrink-0 flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                    <Upload size={12} /> {uploading ? 'Pujant…' : 'Pujar'}
                  </button>
                </>
              )}
            </div>
            {DEV_MODE && <p className="text-xs text-gray-600 mt-1">Upload desactivat en mode dev — afegeix una URL manualment.</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addAttachment}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              Afegir
            </button>
            <button type="button" onClick={() => { setAdding(false); setLabel(''); setUrl(''); setType('reference') }}
              className="text-gray-500 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              Cancel·lar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors border border-dashed border-gray-700 hover:border-blue-600 rounded-lg px-3 py-2 w-full">
          <Plus size={12} /> Afegir recurs (link o fitxer)
        </button>
      )}
    </div>
  )
}

// ── SongForm ──────────────────────────────────────────────────
function SongForm({ initial, onSave, onCancel }) {
  const [title, setTitle]           = useState(initial?.title ?? '')
  const [composer, setComposer]     = useState(initial?.composer ?? '')
  const [notes, setNotes]           = useState(initial?.notes ?? '')
  const [isPublic, setIsPublic]     = useState(initial?.is_public ?? false)
  const [attachments, setAttachments] = useState(() => {
    // Migrate legacy URL fields → attachments array
    if (initial?.attachments) {
      try { return JSON.parse(initial.attachments) } catch { return [] }
    }
    const legacy = []
    if (initial?.source_url) legacy.push({ type: 'reference', label: 'Referència', url: initial.source_url })
    if (initial?.score_url)  legacy.push({ type: 'score',     label: 'Partitura',  url: initial.score_url })
    if (initial?.audio_url)  legacy.push({ type: 'audio',     label: 'Àudio',      url: initial.audio_url })
    return legacy
  })

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      composer: composer.trim() || null,
      notes: notes.trim() || null,
      is_public: isPublic,
      attachments: JSON.stringify(attachments),
      // Keep legacy fields null (migration)
      source_url: null, score_url: null, audio_url: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Títol *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="El nom de la cançó" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Compositor / autor</label>
          <input value={composer} onChange={e => setComposer(e.target.value)}
            placeholder="Bach, Verdi…" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Observacions, arranjador…" className={inputCls} />
      </div>

      <div className="border-t border-gray-800 pt-4 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Recursos</p>
        <AttachmentEditor attachments={attachments} onChange={setAttachments} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => setIsPublic(v => !v)}
          className={`w-9 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-green-600' : 'bg-gray-700'}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isPublic ? 'left-4' : 'left-0.5'}`} />
        </div>
        <span className="text-sm text-gray-400">{isPublic ? 'Pública' : 'Privada'}</span>
      </label>

      <div className="flex gap-2">
        <button type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          Guardar
        </button>
        <button type="button" onClick={onCancel}
          className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">
          Cancel·lar
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Songs() {
  const { user } = useAuth()
  const [songs, setSongs]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchSongs() }, [])

  async function fetchSongs() {
    const { data } = await supabase.from('repertoire_songs').select('*').order('title')
    setSongs(data ?? [])
    setLoading(false)
  }

  async function handleCreate(fields) {
    const { data, error } = await supabase
      .from('repertoire_songs')
      .insert({ ...fields, created_by: user?.id })
      .select().single()
    if (!error) {
      setSongs(prev => [...prev, data].sort((a, b) => a.title.localeCompare(b.title, 'ca')))
      setCreating(false)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase
      .from('repertoire_songs').update(fields).eq('id', id).select().single()
    if (!error) {
      setSongs(prev => prev.map(s => s.id === id ? data : s))
      setEditingId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminar aquesta cançó del repertori?')) return
    await supabase.from('repertoire_songs').delete().eq('id', id)
    setSongs(prev => prev.filter(s => s.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function parseAttachments(song) {
    if (song.attachments) {
      try { return JSON.parse(song.attachments) } catch { return [] }
    }
    // Legacy fields
    const a = []
    if (song.source_url) a.push({ type: 'reference', label: 'Referència', url: song.source_url })
    if (song.score_url)  a.push({ type: 'score',     label: 'Partitura',  url: song.score_url })
    if (song.audio_url)  a.push({ type: 'audio',     label: 'Àudio',      url: song.audio_url })
    return a
  }

  return (
    <Layout narrow>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Repertori</h1>
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} /> Nova cançó
            </button>
          )}
        </div>

        {creating && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nova cançó al repertori</h3>
            <SongForm onSave={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Carregant...</p>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p>El repertori és buit.</p>
            <p className="text-sm mt-1">Afegeix la primera cançó amb el botó de dalt.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map(song => {
              const atts = parseAttachments(song)
              const isExpanded = expandedId === song.id
              return (
                <div key={song.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {editingId === song.id ? (
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Editar cançó</h3>
                      <SongForm initial={song}
                        onSave={fields => handleUpdate(song.id, fields)}
                        onCancel={() => setEditingId(null)} />
                    </div>
                  ) : (
                    <>
                      <div onClick={() => setExpandedId(isExpanded ? null : song.id)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition-colors">
                        <Music size={14} className="text-gray-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-white font-medium text-sm">{song.title}</p>
                            {song.is_public
                              ? <span className="flex items-center gap-1 text-xs text-green-500 bg-green-900/30 px-1.5 py-0.5 rounded shrink-0">
                                  <Globe size={9} /> Pública
                                </span>
                              : <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                                  <Lock size={9} /> Privada
                                </span>
                            }
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {song.composer && <p className="text-xs text-gray-500 truncate">{song.composer}</p>}
                            {atts.length > 0 && (
                              <span className="text-xs text-gray-600 shrink-0">{atts.length} recurs{atts.length !== 1 ? 'os' : ''}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={e => { e.stopPropagation(); setEditingId(song.id) }}
                            className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(song.id) }}
                            className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Trash2 size={13} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-800 px-4 py-3 space-y-2 bg-black/20">
                          {song.notes && <p className="text-xs text-gray-400">{song.notes}</p>}
                          {atts.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {atts.map((a, i) => (
                                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors">
                                  <AttachmentIcon type={a.type} size={11} />
                                  <span className="text-gray-300">{a.label}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600 italic">Sense recursos afegits</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
