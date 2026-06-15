import { useState, useRef } from 'react'
import { BookOpen, Plus, Pencil, ExternalLink, Music, Globe, Lock, FileText, Upload, X, Search, Archive } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import Layout from '../components/Layout'
import Modal from '../components/ui/Modal'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ListRow from '../components/ui/ListRow'
import Button from '../components/ui/Button'
import { inputCls, labelCls } from '../components/ui/Input'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { SkeletonRow } from '../components/ui/Skeleton'
import { ICON } from '../lib/ui'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const ATTACHMENT_TYPES = [
  { value: 'reference', label: 'Referència / Link', icon: ExternalLink, color: 'text-blue-400' },
  { value: 'score',     label: 'Partitura',          icon: FileText,     color: 'text-purple-400' },
  { value: 'audio',     label: 'Àudio',              icon: Music,        color: 'text-green-400' },
]

function AttachmentIcon({ type, size = ICON.xs }) {
  const t = ATTACHMENT_TYPES.find(t => t.value === type) ?? ATTACHMENT_TYPES[0]
  const Icon = t.icon
  return <Icon size={size} className={t.color} />
}

function AttachmentEditor({ attachments, onChange }) {
  const [adding, setAdding]   = useState(false)
  const [type, setType]       = useState('reference')
  const [label, setLabel]     = useState('')
  const [url, setUrl]         = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  function addAttachment() {
    if (!url.trim()) return
    onChange([...attachments, { type, label: label.trim() || ATTACHMENT_TYPES.find(t => t.value === type).label, url: url.trim() }])
    setAdding(false); setLabel(''); setUrl(''); setType('reference')
  }

  function removeAttachment(i) { onChange(attachments.filter((_, idx) => idx !== i)) }

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
              <AttachmentIcon type={a.type} size={ICON.xs + 1} />
              <span className="text-xs text-soft flex-1 truncate">{a.label}</span>
              <a href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-faint hover:text-blue-400 truncate max-w-[140px] transition-colors">
                {a.url.replace(/^https?:\/\//, '').slice(0, 30)}…
              </a>
              <button type="button" onClick={() => removeAttachment(i)}
                className="text-ghost hover:text-red-500 transition-colors shrink-0 p-2 -my-1.5 -mr-1.5">
                <X size={ICON.sm} />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="bg-fill/60 border border-line rounded-xl p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Select label="Tipus" value={type} onChange={e => setType(e.target.value)}>
              {ATTACHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
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
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="shrink-0 flex items-center gap-1 bg-raised hover:bg-fill text-soft text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                    <Upload size={ICON.xs} /> {uploading ? 'Pujant…' : 'Pujar'}
                  </button>
                </>
              )}
            </div>
            {DEV_MODE && <p className="text-xs text-ghost mt-1">Upload desactivat en mode dev — afegeix una URL manualment.</p>}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={addAttachment} className="text-xs px-3 py-1.5 min-h-0 h-auto">Afegir</Button>
            <Button type="button" variant="ghost" onClick={() => { setAdding(false); setLabel(''); setUrl(''); setType('reference') }}
              className="text-xs px-3 py-1.5 min-h-0 h-auto">Cancel·lar</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-faint hover:text-blue-400 transition-colors border border-dashed border-line hover:border-blue-600 rounded-lg px-3 py-2 w-full">
          <Plus size={ICON.xs} /> Afegir recurs (link o fitxer)
        </button>
      )}
    </div>
  )
}

function SongForm({ initial, onSave, onCancel, onDelete }) {
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [composer, setComposer]   = useState(initial?.composer ?? '')
  const [notes, setNotes]         = useState(initial?.notes ?? '')
  const [lyrics, setLyrics]       = useState(initial?.lyrics ?? '')
  const [isPublic, setIsPublic]   = useState(initial?.is_public ?? false)
  const [archived, setArchived]   = useState(initial?.archived ?? false)
  const [attachments, setAttachments] = useState(() => {
    if (initial?.attachments) { try { return JSON.parse(initial.attachments) } catch { return [] } }
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
      archived,
      attachments: JSON.stringify(attachments),
      source_url: null, score_url: null, audio_url: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelCls}>Títol *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="El nom de la cançó" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Compositor / autor</label>
          <input value={composer} onChange={e => setComposer(e.target.value)}
            placeholder="Bach, Verdi…" className={inputCls} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelCls}>Notes</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Observacions, arranjador…" className={inputCls} />
      </div>
      <Textarea label="Lletra" value={lyrics} onChange={e => setLyrics(e.target.value)} rows={6}
        placeholder="Una línia per vers. Serveix per ancorar els cues de llum."
        className="leading-relaxed" />
      <div className="border-t border-rim pt-4 space-y-2">
        <p className="text-xs text-faint uppercase tracking-wider">Recursos</p>
        <AttachmentEditor attachments={attachments} onChange={setAttachments} />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setIsPublic(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-green-600' : 'bg-raised'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isPublic ? 'left-4' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-muted">{isPublic ? 'Pública' : 'Privada'}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div onClick={() => setArchived(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors relative ${archived ? 'bg-amber-600' : 'bg-raised'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${archived ? 'left-4' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-muted">{archived ? 'Arxivada' : 'Activa'}</span>
        </label>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel·lar</Button>
        {onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} className="ml-auto">
            Eliminar
          </Button>
        )}
      </div>
    </form>
  )
}

function SongMeta({ song, atts, usage }) {
  const parts = []
  if (song.composer) parts.push(song.composer)
  if (atts.length > 0) parts.push(`${atts.length} recurs${atts.length !== 1 ? 'os' : ''}`)
  if (usage?.length > 0) parts.push(`Usat a: ${usage.map(s => s.name).join(', ')}`)
  return parts.join(' · ') || null
}

export default function Songs() {
  const { user } = useAuth()
  const { currentChoirId } = useChoir()
  const [sheetSong, setSheetSong] = useState(null) // song obj | 'new' | null
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const { data: songs = [], setData: setSongs, loading } = useSupabaseQuery(async () => {
    let q = supabase.from('repertoire_songs').select('*').eq('type', 'song').order('title')
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    const all = data ?? []
    return showArchived ? all : all.filter(s => !s.archived)
  }, [currentChoirId, showArchived])

  const { data: usageMap = {} } = useSupabaseQuery(async () => {
    if (!songs.length) return {}
    const { data: showSongs } = await supabase.from('songs').select('repertoire_song_id, show_id')
    if (!showSongs?.length) return {}
    const showIds = [...new Set(showSongs.filter(s => s.show_id).map(s => s.show_id))]
    if (!showIds.length) return {}
    const { data: showData } = await supabase.from('shows').select('id, name').in('id', showIds)
    const showMap = Object.fromEntries((showData ?? []).map(s => [s.id, s]))
    const result = {}
    for (const ss of showSongs) {
      if (!ss.repertoire_song_id || !ss.show_id) continue
      if (!result[ss.repertoire_song_id]) result[ss.repertoire_song_id] = []
      const show = showMap[ss.show_id]
      if (show && !result[ss.repertoire_song_id].some(s => s.id === show.id)) {
        result[ss.repertoire_song_id].push(show)
      }
    }
    return result
  }, [songs.length])

  async function handleCreate(fields) {
    const payload = { ...fields, created_by: user?.id }
    if (currentChoirId) payload.choir_id = currentChoirId
    const { data, error } = await supabase.from('repertoire_songs').insert(payload).select().single()
    if (!error) { setSongs(prev => [...prev, data].sort((a, b) => a.title.localeCompare(b.title, 'ca'))); setSheetSong(null) }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('repertoire_songs').update(fields).eq('id', id).select().single()
    if (!error) { setSongs(prev => prev.map(s => s.id === id ? data : s)); setSheetSong(null) }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquesta cançó del repertori?'))) return
    await supabase.from('repertoire_songs').delete().eq('id', id)
    setSongs(prev => prev.filter(s => s.id !== id))
    setSheetSong(null)
  }

  function parseAttachments(song) {
    if (song.attachments) { try { return JSON.parse(song.attachments) } catch { return [] } }
    const a = []
    if (song.source_url) a.push({ type: 'reference', label: 'Referència', url: song.source_url })
    if (song.score_url)  a.push({ type: 'score',     label: 'Partitura',  url: song.score_url })
    if (song.audio_url)  a.push({ type: 'audio',     label: 'Àudio',      url: song.audio_url })
    return a
  }

  const searchLower = search.toLowerCase()
  const visibleSongs = search
    ? songs.filter(s => s.title?.toLowerCase().includes(searchLower) || s.composer?.toLowerCase().includes(searchLower))
    : songs

  const isNew = sheetSong === 'new'

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Cançons"
            icon={BookOpen}
            actions={
              <Button onClick={() => setSheetSong('new')}>
                <Plus size={ICON.sm} /> Nova cançó
              </Button>
            }
            tabs={
              <div className="space-y-2 py-2">
                <div className="relative">
                  <Search size={ICON.sm} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cerca per títol o compositor…"
                    className="w-full bg-fill border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowArchived(v => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      showArchived ? 'border-amber-600 text-amber-400 bg-amber-900/10' : 'border-line text-faint hover:text-body'
                    }`}>
                    <Archive size={ICON.xs} /> {showArchived ? 'Amagar arxivades' : 'Mostrar arxivades'}
                  </button>
                </div>
              </div>
            }
          />
        }
      >
        {loading ? (
          <div className="space-y-2 py-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : visibleSongs.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? 'Cap resultat per aquesta cerca.' : 'Encara no hi ha cançons.'}
            hint={!search ? 'Afegeix la primera cançó amb el botó de dalt.' : undefined}
          />
        ) : (
          <div className="divide-y divide-rim">
            {visibleSongs.map(song => {
              const atts = parseAttachments(song)
              return (
                <ListRow
                  key={song.id}
                  onClick={() => setSheetSong(song)}
                  className={song.archived ? 'opacity-60' : ''}
                  leading={<Music size={ICON.sm} className="text-cyan-500" />}
                  title={
                    <span className="flex items-center gap-2">
                      {song.title}
                      {song.archived && <Archive size={9} className="text-amber-400" />}
                      {song.is_public
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-500"><Globe size={9} /> Pública</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-ghost"><Lock size={9} /> Privada</span>
                      }
                    </span>
                  }
                  meta={<SongMeta song={song} atts={atts} usage={usageMap[song.id]} />}
                  trailing={<Pencil size={ICON.xs} className="text-ghost" />}
                />
              )
            })}
          </div>
        )}
      </PageContainer>

      <Modal
        open={!!sheetSong}
        onClose={() => setSheetSong(null)}
        title={isNew ? 'Nova cançó' : 'Editar cançó'}
        width="half"
      >
        <SongForm
          initial={isNew ? undefined : sheetSong}
          onSave={isNew ? handleCreate : fields => handleUpdate(sheetSong.id, fields)}
          onCancel={() => setSheetSong(null)}
          onDelete={isNew ? null : () => handleDelete(sheetSong.id)}
        />
      </Modal>
    </Layout>
  )
}
