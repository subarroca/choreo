import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clapperboard, Pencil, Trash2, ImageIcon, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import Layout from '../components/Layout'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'

function ShowForm({ initial, onSave, onCancel }) {
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted">Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Condal 2026"
            className="w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted">Sala</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Gran Teatre del Liceu"
            className="w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-300" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-xs text-muted">Poster</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-xs text-muted hover:text-body hover:border-wire transition-colors">
              <ImageIcon size={14} /> {uploading ? 'Pujant…' : 'Triar imatge'}
            </button>
            {posterPreview && (
              <button type="button" onClick={() => { setPosterUrl(''); setPosterPreview('') }}
                className="text-ghost hover:text-red-400 transition-colors p-2"><X size={14} /></button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
          </div>
        </div>
        {posterPreview && (
          <img src={posterPreview} alt="Poster" className="w-16 h-20 object-cover rounded-lg border border-line shrink-0" />
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="text-muted hover:text-body text-sm px-4 py-1.5 rounded-lg transition-colors">
          Cancel·lar
        </button>
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
              <Pencil size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-lg bg-page/80 text-faint hover:text-red-400 transition-colors backdrop-blur-sm">
              <Trash2 size={12} />
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
    if (!error) {
      setShows(prev => [data, ...prev])
      setFormShow(null)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase.from('shows').update(fields).eq('id', id).select().single()
    if (!error) {
      setShows(prev => prev.map(s => s.id === id ? data : s))
      setFormShow(null)
    }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquest espectacle?'))) return
    await supabase.from('shows').delete().eq('id', id)
    setShows(prev => prev.filter(s => s.id !== id))
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-body">Espectacles</h1>
          {!formShow && canEdit && (
            <button onClick={() => setFormShow('new')}
              className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              + Nou espectacle
            </button>
          )}
        </div>

        {formShow && (
          <div className="bg-pane border border-line rounded-xl p-4">
            <h3 className="text-sm font-medium text-soft mb-3">
              {formShow === 'new' ? 'Nou espectacle' : `Editar: ${formShow.name}`}
            </h3>
            <ShowForm
              initial={formShow === 'new' ? null : formShow}
              onSave={formShow === 'new' ? handleCreate : fields => handleUpdate(formShow.id, fields)}
              onCancel={() => setFormShow(null)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-faint">Carregant...</p>
        ) : shows.length === 0 ? (
          <div className="text-center py-16 text-faint">
            <Clapperboard size={40} className="mx-auto mb-4 opacity-30" />
            <p>Encara no hi ha cap espectacle.</p>
            <p className="text-sm mt-1">Crea el primer amb el botó de dalt.</p>
          </div>
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
      </div>
    </Layout>
  )
}
