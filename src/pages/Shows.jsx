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

function ShowCard({ show, canEdit, onEdit, onDelete, onClick }) {
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
      </div>
    </div>
  )
}

export default function Shows() {
  const { user, permissions, role } = useAuth()
  const { currentChoirId } = useChoir()
  const canEdit = role === 'admin' || role === 'director' || permissions?.shows?.edit
  const navigate = useNavigate()
  const [formShow, setFormShow] = useState(null) // null | 'new' | show_object

  const { data: shows = [], setData: setShows, loading } = useSupabaseQuery(async () => {
    let q = supabase.from('shows').select('*').order('created_at', { ascending: false })
    if (currentChoirId) q = q.eq('choir_id', currentChoirId)
    const { data } = await q
    return data ?? []
  }, [currentChoirId])

  useEffect(() => {
    if (!loading && shows.length === 1 && !canEdit) {
      navigate(`/show/${shows[0].id}`, { replace: true })
    }
  }, [loading])

  async function handleCreate(fields) {
    const payload = { ...fields, created_by: user.id }
    if (currentChoirId) payload.choir_id = currentChoirId
    const { data, error } = await supabase.from('shows').insert(payload).select().single()
    if (!error) { setShows(prev => [data, ...prev]); setFormShow(null) }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('shows').update(fields).eq('id', id).select().single()
    if (!error) { setShows(prev => prev.map(s => s.id === id ? data : s)); setFormShow(null) }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquest espectacle?'))) return
    await supabase.from('shows').delete().eq('id', id)
    setShows(prev => prev.filter(s => s.id !== id))
    setFormShow(null)
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
          <p className="text-faint text-sm py-8">Carregant...</p>
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
