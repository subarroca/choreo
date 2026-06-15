import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clapperboard, Pencil, Trash2, ImageIcon, X, Plus } from 'lucide-react'
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
import { toast } from '../components/ui/Toast'

function ShowForm({ initial, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [venue, setVenue] = useState(initial?.venue ?? '')
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
    onSave({ name, date: date || null, venue, poster_url: posterUrl || null })
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

      <div className="flex items-start gap-3">
        <div className="space-y-1 flex-1">
          <label className={labelCls}>Poster</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-xs text-muted hover:text-body hover:border-wire transition-colors">
              <ImageIcon size={ICON.sm} /> {uploading ? 'Pujant…' : 'Triar imatge'}
            </button>
            {posterPreview && (
              <button type="button" onClick={() => { setPosterUrl(''); setPosterPreview('') }}
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
            <button onClick={e => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded-lg bg-page/80 text-muted hover:text-body transition-colors backdrop-blur-sm">
              <Pencil size={ICON.xs} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }}
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

  async function handleCreate(fields) {
    const payload = { ...fields, created_by: user.id }
    if (currentChoirId) payload.choir_id = currentChoirId
    const { data, error } = await supabase.from('shows').insert(payload).select().single()
    if (error) { toast.error('Error en crear l\'espectacle'); return }
    setShows(prev => [data, ...prev]); setFormShow(null)
    toast('Espectacle creat')
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('shows').update(fields).eq('id', id).select().single()
    if (error) { toast.error('Error en desar'); return }
    setShows(prev => prev.map(s => s.id === id ? data : s)); setFormShow(null)
    toast('Canvis desats')
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquest espectacle?'))) return
    await supabase.from('shows').delete().eq('id', id)
    setShows(prev => prev.filter(s => s.id !== id))
    setFormShow(null)
    toast('Espectacle eliminat', 'warn')
  }

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Espectacles"
            icon={Clapperboard}
            actions={canEdit && (
              <Button onClick={() => setFormShow('new')}>
                <Plus size={ICON.sm} /> Nou espectacle
              </Button>
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
