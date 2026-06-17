import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clapperboard, Pencil, Trash2, ImageIcon, X, Plus, Undo2, Redo2, ExternalLink } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import Layout from '../components/Layout'
import Modal from '../components/ui/Modal'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { inputCls, labelCls } from '../components/ui/Input'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { ICON } from '../lib/ui'
import { SkeletonCard } from '../components/ui/Skeleton'
import { runMutation } from '../lib/mutate'
import { useHistory, useHistoryHotkeys } from '../hooks/useHistory'

function ShowForm({ initial, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [venue, setVenue] = useState(initial?.venue ?? '')
  const [photosUrl, setPhotosUrl] = useState(initial?.photos_url ?? '')
  const [posterUrl, setPosterUrl] = useState(initial?.poster_url ?? '')
  const [posterPreview, setPosterPreview] = useState(initial?.poster_url ?? '')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  async function handlePosterChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `shows/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('show-posters').upload(path, file, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('show-posters').getPublicUrl(path)
        setPosterUrl(publicUrl)
        setPosterPreview(publicUrl)
      }
    } catch (_) {}
    setUploading(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ name, date: date || null, venue, poster_url: posterUrl || null, photos_url: photosUrl || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={labelCls}>Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            placeholder="Condal 2026" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Sala</label>
          <input value={venue} onChange={e => setVenue(e.target.value)}
            placeholder="Gran Teatre del Liceu" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelCls}>Fotos (Google Photos)</label>
        <input value={photosUrl} onChange={e => setPhotosUrl(e.target.value)}
          placeholder="https://photos.google.com/share/…" className={inputCls} />
      </div>

      <div className="flex items-start gap-3">
        <div className="space-y-1 flex-1">
          <label className={labelCls}>Poster</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-xs text-muted hover:text-body hover:border-wire transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <ImageIcon size={ICON.sm} /> {uploading ? 'Pujant…' : 'Triar imatge'}
            </button>
            {posterPreview && (
              <button type="button" title="Treure imatge" onClick={() => { setPosterUrl(''); setPosterPreview('') }}
                className="text-ghost hover:text-red-400 transition-colors p-2">
                <X size={ICON.sm} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
          </div>
        </div>
        {posterPreview && (
          <img src={posterPreview} alt="Poster"
            className="w-16 h-20 object-cover rounded-lg border border-line shrink-0" />
        )}
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

function ShowProgressBar({ pct, color = 'bg-cyan-500' }) {
  return (
    <div className="flex-1 h-1 bg-raised rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ShowCard({ show, stats, canEdit, onEdit, onDelete, onClick }) {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-rim group-hover:border-wire transition-colors">
        {show.poster_url ? (
          <img src={show.poster_url} alt={show.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-800 to-gray-900 p-4">
            <Clapperboard size={28} className="text-ghost" />
            <p className="text-body text-sm font-semibold text-center leading-snug">{show.name}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {stats && (
          <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-gray-400 w-5">Pos</span>
              <ShowProgressBar pct={stats.positions} color={stats.positions >= 80 ? 'bg-green-500' : stats.positions >= 40 ? 'bg-amber-500' : 'bg-gray-600'} />
              <span className="text-[9px] text-gray-300 w-6 text-right">{Math.round(stats.positions)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-gray-400 w-5">Llum</span>
              <ShowProgressBar pct={stats.lights} color={stats.lights >= 80 ? 'bg-green-500' : stats.lights >= 40 ? 'bg-amber-500' : 'bg-gray-600'} />
              <span className="text-[9px] text-gray-300 w-6 text-right">{Math.round(stats.lights)}%</span>
            </div>
          </div>
        )}
        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button title="Editar espectacle" onClick={e => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded-lg bg-page/80 text-muted hover:text-body transition-colors backdrop-blur-sm">
              <Pencil size={ICON.xs} />
            </button>
            <button title="Eliminar espectacle" onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-lg bg-page/80 text-faint hover:text-red-400 transition-colors backdrop-blur-sm">
              <Trash2 size={ICON.xs} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5 space-y-0.5">
        <p className="text-body text-sm font-medium truncate">{show.name}</p>
        <p className="text-xs text-faint truncate">
          {show.date && new Date(show.date).toLocaleDateString('ca-ES')}
          {show.date && show.venue && ' · '}
          {show.venue}
        </p>
        {stats && (
          <div className="flex gap-3 pt-0.5">
            <span className="text-[10px] text-ghost">{stats.songCount} {stats.songCount === 1 ? 'cançó' : 'cançons'}</span>
            <span className="text-[10px] text-ghost">{stats.momentCount} moments</span>
          </div>
        )}
        {show.photos_url && (
          <a href={show.photos_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors mt-0.5">
            <ExternalLink size={9} /> Fotos
          </a>
        )}
      </div>
    </div>
  )
}

export default function Shows() {
  const { user, can } = useAuth()
  const { currentChoirId } = useChoir()
  const canEdit = can('shows', 'edit')
  const navigate = useNavigate()
  const [formShow, setFormShow] = useState(null) // null | 'new' | show_object

  const { data: shows = [], setData: setShows, loading } = useSupabaseQuery(async () => {
    let q = supabase.from('shows').select('*').order('created_at', { ascending: false })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  const { data: showStatsMap = {} } = useSupabaseQuery(async () => {
    if (!shows.length) return {}
    const showIds = shows.map(s => s.id)
    const { data: songData } = await supabase.from('songs').select('id, show_id').in('show_id', showIds)
    const songs = songData ?? []
    if (!songs.length) return {}
    const songIds = songs.map(s => s.id)
    const [momRes, cueRes] = await Promise.all([
      supabase.from('moments').select('id, song_id').in('song_id', songIds),
      supabase.from('light_cues').select('song_id').in('song_id', songIds),
    ])
    const moments = momRes.data ?? []
    const momentIds = moments.map(m => m.id)
    let positionedMomentIds = new Set()
    if (momentIds.length) {
      const { data: posData } = await supabase.from('positions').select('moment_id').in('moment_id', momentIds)
      positionedMomentIds = new Set((posData ?? []).map(p => p.moment_id))
    }
    const songsWithCues = new Set((cueRes.data ?? []).map(c => c.song_id))
    const result = {}
    for (const show of shows) {
      const showSongs = songs.filter(s => s.show_id === show.id)
      const showMoments = moments.filter(m => showSongs.some(s => s.id === m.song_id))
      const positionedCount = showMoments.filter(m => positionedMomentIds.has(m.id)).size ?? showMoments.filter(m => positionedMomentIds.has(m.id)).length
      const cueCount = showSongs.filter(s => songsWithCues.has(s.id)).length
      result[show.id] = {
        songCount: showSongs.length,
        momentCount: showMoments.length,
        positions: showMoments.length ? (showMoments.filter(m => positionedMomentIds.has(m.id)).length / showMoments.length) * 100 : 0,
        lights: showSongs.length ? (cueCount / showSongs.length) * 100 : 0,
      }
    }
    return result
  }, [shows.length])

  useEffect(() => {
    if (!loading && shows.length === 1 && !canEdit) {
      navigate(`/show/${shows[0].id}`, { replace: true })
    }
  }, [loading])

  const history = useHistory()
  useHistoryHotkeys(history)

  function insertShowCmd(row, msg) {
    return runMutation({
      optimistic: () => setShows(prev => [row, ...prev]),
      persist: () => supabase.from('shows').insert(row),
      rollback: () => setShows(prev => prev.filter(s => s.id !== row.id)),
      errorMsg: 'Error en crear l\'espectacle', successMsg: msg,
    })
  }
  function deleteShowCmd(row, msg) {
    return runMutation({
      optimistic: () => { setShows(prev => prev.filter(s => s.id !== row.id)); setFormShow(null) },
      persist: () => supabase.from('shows').delete().eq('id', row.id),
      rollback: () => setShows(prev => [row, ...prev]),
      errorMsg: 'Error en eliminar l\'espectacle', successMsg: msg,
    })
  }
  function updateShowCmd(id, fields, prevFields, msg) {
    return runMutation({
      optimistic: () => setShows(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s)),
      persist: async () => {
        const res = await supabase.from('shows').update(fields).eq('id', id).select().single()
        if (!res.error) setShows(prev => prev.map(s => s.id === id ? res.data : s))
        return res
      },
      rollback: () => setShows(prev => prev.map(s => s.id === id ? { ...s, ...prevFields } : s)),
      errorMsg: 'Error en desar', successMsg: msg,
    })
  }

  function handleCreate(fields) {
    const row = { id: crypto.randomUUID(), created_by: user.id, ...fields }
    if (currentChoirId) row.choir_id = currentChoirId
    history.dispatch({
      label: 'create-show',
      do: () => insertShowCmd(row, 'Espectacle creat'),
      undo: () => deleteShowCmd(row, 'Creació desfeta'),
    })
    setFormShow(null)
  }

  function handleUpdate(id, fields) {
    const prev = shows.find(s => s.id === id)
    if (!prev) return
    const prevFields = Object.fromEntries(Object.keys(fields).map(k => [k, prev[k]]))
    history.dispatch({
      label: 'update-show',
      do: () => updateShowCmd(id, fields, prevFields, 'Canvis desats'),
      undo: () => updateShowCmd(id, prevFields, fields, 'Canvi desfet'),
    })
    setFormShow(null)
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquest espectacle?'))) return
    const row = shows.find(s => s.id === id)
    if (!row) return
    history.dispatch({
      label: 'delete-show',
      do: () => deleteShowCmd(row, 'Espectacle eliminat'),
      undo: () => insertShowCmd(row, 'Eliminació desfeta'),
    })
  }

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Espectacles"
            icon={Clapperboard}
            actions={canEdit && (
              <div className="flex items-center gap-1.5">
                <button onClick={history.undo} disabled={!history.canUndo}
                  aria-label="Desfés" aria-keyshortcuts="Control+Z Meta+Z" title="Desfés (Ctrl/Cmd+Z)"
                  className="p-2 rounded-lg text-faint hover:text-body hover:bg-fill disabled:opacity-30 disabled:hover:bg-transparent">
                  <Undo2 size={ICON.sm} />
                </button>
                <button onClick={history.redo} disabled={!history.canRedo}
                  aria-label="Refés" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" title="Refés (Ctrl/Cmd+Shift+Z)"
                  className="p-2 rounded-lg text-faint hover:text-body hover:bg-fill disabled:opacity-30 disabled:hover:bg-transparent">
                  <Redo2 size={ICON.sm} />
                </button>
                <Button onClick={() => setFormShow('new')}>
                  <Plus size={ICON.sm} /> Nou espectacle
                </Button>
              </div>
            )}
          />
        }
      >
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length: 5}, (_,i) => <SkeletonCard key={i} />)}
          </div>
        ) : shows.length === 0 ? (
          <EmptyState
            icon={Clapperboard}
            title="Encara no hi ha cap espectacle."
            hint={canEdit ? 'Crea el primer amb el botó de dalt.' : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shows.map(show => (
              <ShowCard
                key={show.id}
                show={show}
                stats={showStatsMap[show.id]}
                canEdit={canEdit}
                onEdit={() => setFormShow(show)}
                onDelete={() => handleDelete(show.id)}
                onClick={() => navigate(`/show/${show.id}`)}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <Modal
        open={!!formShow}
        onClose={() => setFormShow(null)}
        title={formShow === 'new' ? 'Nou espectacle' : 'Editar espectacle'}
      >
        <ShowForm
          initial={formShow === 'new' ? null : formShow}
          onSave={formShow === 'new' ? handleCreate : fields => handleUpdate(formShow?.id, fields)}
          onCancel={() => setFormShow(null)}
          onDelete={formShow && formShow !== 'new' ? () => handleDelete(formShow.id) : undefined}
        />
      </Modal>
    </Layout>
  )
}
