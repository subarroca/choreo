import { useState, useRef } from 'react'
import { BookOpen, Plus, Pencil, ExternalLink, Music, Globe, Lock, FileText, Upload, X, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import Layout from '../components/Layout'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { isSongType } from '../lib/repertoireTypes'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const inputCls = 'w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300 placeholder-gray-600'
const labelCls = 'text-xs text-muted mb-1 block'

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
            <div key={i} className="flex items-center gap-2 bg-fill rounded-lg px-3 py-2">
              <AttachmentIcon type={a.type} size={13} />
              <span className="text-xs text-soft flex-1 truncate">{a.label}</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-faint hover:text-blue-400 truncate max-w-[140px] transition-colors">
                {a.url.replace(/^https?:\/\//, '').slice(0, 30)}…
              </a>
              <button type="button" onClick={() => removeAttachment(i)}
                className="text-ghost hover:text-red-500 transition-colors shrink-0 p-2 -my-1.5 -mr-1.5">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="bg-fill/60 border border-line rounded-xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Tipus</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-fill border border-line rounded-lg px-2 py-1.5 text-sm text-body focus:outline-none focus:border-cyan-300">
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
                    className="shrink-0 flex items-center gap-1 bg-raised hover:bg-gray-600 text-soft text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                    <Upload size={12} /> {uploading ? 'Pujant…' : 'Pujar'}
                  </button>
                </>
              )}
            </div>
            {DEV_MODE && <p className="text-xs text-ghost mt-1">Upload desactivat en mode dev — afegeix una URL manualment.</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addAttachment}
              className="bg-cyan-600 hover:bg-cyan-300 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              Afegir
            </button>
            <button type="button" onClick={() => { setAdding(false); setLabel(''); setUrl(''); setType('reference') }}
              className="text-faint hover:text-body text-xs px-3 py-1.5 rounded-lg transition-colors">
              Cancel·lar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-faint hover:text-blue-400 transition-colors border border-dashed border-line hover:border-blue-600 rounded-lg px-3 py-2 w-full">
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
  const [lyrics, setLyrics]         = useState(initial?.lyrics ?? '')
  const [isPublic, setIsPublic]     = useState(initial?.is_public ?? false)
  const [attachments, setAttachments] = useState(() => {
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
      type: 'song',
      title: title.trim(),
      composer: composer.trim() || null,
      notes: notes.trim() || null,
      lyrics: lyrics.trim() || null,
      is_public: isPublic,
      attachments: JSON.stringify(attachments),
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
      <div>
        <label className={labelCls}>Lletra</label>
        <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={6}
          placeholder={'Una línia per vers. Serveix per ancorar els cues de llum.'}
          className={inputCls + ' resize-y leading-relaxed'} />
      </div>

      <div className="border-t border-rim pt-4 space-y-2">
        <p className="text-xs text-faint uppercase tracking-wider">Recursos</p>
        <AttachmentEditor attachments={attachments} onChange={setAttachments} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div onClick={() => setIsPublic(v => !v)}
          className={`w-9 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-green-600' : 'bg-raised'}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isPublic ? 'left-4' : 'left-0.5'}`} />
        </div>
        <span className="text-sm text-muted">{isPublic ? 'Pública' : 'Privada'}</span>
      </label>

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

// ── SongSheet (sidesheet) ─────────────────────────────────────
function SongSheet({ song, isNew, onSave, onDelete, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-page border-l border-rim flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim shrink-0">
          <h2 className="text-base font-semibold text-body">
            {isNew ? 'Nova cançó' : 'Editar cançó'}
          </h2>
          <button onClick={onClose} className="text-faint hover:text-body p-1.5 rounded-lg hover:bg-fill transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <SongForm initial={isNew ? undefined : song} onSave={onSave} onCancel={onClose} />
          {!isNew && onDelete && (
            <div className="mt-6 pt-4 border-t border-rim">
              <button onClick={onDelete}
                className="text-sm text-red-500 hover:text-red-400 transition-colors">
                Eliminar cançó del repertori
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function Songs() {
  const { user } = useAuth()
  const { currentChoirId } = useChoir()
  const [sheetSong, setSheetSong] = useState(null) // song obj | 'new' | null
  const [search, setSearch]     = useState('')

  const { data: songs = [], setData: setSongs, loading } = useSupabaseQuery(async () => {
    let q = supabase.from('repertoire_songs').select('*').eq('type', 'song').order('title')
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  async function handleCreate(fields) {
    const payload = { ...fields, created_by: user?.id }
    if (currentChoirId) payload.choir_id = currentChoirId
    const { data, error } = await supabase
      .from('repertoire_songs')
      .insert(payload)
      .select().single()
    if (!error) {
      setSongs(prev => [...prev, data].sort((a, b) => a.title.localeCompare(b.title, 'ca')))
      setSheetSong(null)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase
      .from('repertoire_songs').update(fields).eq('id', id).select().single()
    if (!error) {
      setSongs(prev => prev.map(s => s.id === id ? data : s))
      setSheetSong(null)
    }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquesta cançó del repertori?'))) return
    await supabase.from('repertoire_songs').delete().eq('id', id)
    setSongs(prev => prev.filter(s => s.id !== id))
    setSheetSong(null)
  }

  function parseAttachments(song) {
    if (song.attachments) {
      try { return JSON.parse(song.attachments) } catch { return [] }
    }
    const a = []
    if (song.source_url) a.push({ type: 'reference', label: 'Referència', url: song.source_url })
    if (song.score_url)  a.push({ type: 'score',     label: 'Partitura',  url: song.score_url })
    if (song.audio_url)  a.push({ type: 'audio',     label: 'Àudio',      url: song.audio_url })
    return a
  }

  const searchLower = search.toLowerCase()
  const visibleSongs = search
    ? songs.filter(s =>
        s.title?.toLowerCase().includes(searchLower) ||
        s.composer?.toLowerCase().includes(searchLower)
      )
    : songs

  const isNew = sheetSong === 'new'

  return (
    <Layout narrow>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-body">Cançons</h1>
          <button onClick={() => setSheetSong('new')}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors shrink-0">
            <Plus size={14} /> Nova cançó
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per títol o compositor…"
            className="w-full bg-fill border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-body placeholder-gray-600 focus:outline-none focus:border-cyan-300" />
        </div>

        {loading ? (
          <p className="text-faint">Carregant...</p>
        ) : visibleSongs.length === 0 ? (
          <div className="text-center py-16 text-faint">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p>{search ? 'Cap resultat per aquesta cerca.' : 'Encara no hi ha cançons.'}</p>
            {!search && <p className="text-sm mt-1">Afegeix la primera cançó amb el botó de dalt.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSongs.map(song => {
              const atts = parseAttachments(song)
              return (
                <button key={song.id} onClick={() => setSheetSong(song)}
                  className="w-full bg-pane border border-rim rounded-xl px-4 py-3 hover:border-line hover:bg-fill/30 transition-colors text-left flex items-center gap-3">
                  <Music size={14} className="text-cyan-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-body font-medium text-sm">{song.title}</p>
                      {song.is_public
                        ? <span className="flex items-center gap-1 text-xs text-green-500 shrink-0"><Globe size={9} /> Pública</span>
                        : <span className="flex items-center gap-1 text-xs text-ghost shrink-0"><Lock size={9} /> Privada</span>
                      }
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {song.composer && <p className="text-xs text-faint truncate">{song.composer}</p>}
                      {atts.length > 0 && (
                        <span className="text-xs text-ghost shrink-0">{atts.length} recurs{atts.length !== 1 ? 'os' : ''}</span>
                      )}
                    </div>
                  </div>
                  <Pencil size={12} className="text-ghost shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {sheetSong && (
        <SongSheet
          song={isNew ? null : sheetSong}
          isNew={isNew}
          onSave={isNew ? handleCreate : fields => handleUpdate(sheetSong.id, fields)}
          onDelete={isNew ? null : () => handleDelete(sheetSong.id)}
          onClose={() => setSheetSong(null)} />
      )}
    </Layout>
  )
}
