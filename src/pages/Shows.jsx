import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clapperboard, Pencil, Trash2, MapPin, ImageIcon, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
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
    // Local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPosterPreview(localUrl)
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
          <label className="text-xs text-gray-400">Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Condal 2026"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Sala</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Gran Teatre del Liceu"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300" />
        </div>
      </div>

      {/* Poster */}
      <div className="flex items-start gap-3">
        <div className="space-y-1 flex-1">
          <label className="text-xs text-gray-400">Poster</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
              <ImageIcon size={14} /> {uploading ? 'Pujant…' : 'Triar imatge'}
            </button>
            {posterPreview && (
              <button type="button" onClick={() => { setPosterUrl(''); setPosterPreview('') }}
                className="text-gray-600 hover:text-red-400 transition-colors p-2"><X size={14} /></button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
          </div>
        </div>
        {posterPreview && (
          <img src={posterPreview} alt="Poster" className="w-16 h-20 object-cover rounded-lg border border-gray-700 shrink-0" />
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
          Cancel·lar
        </button>
      </div>
    </form>
  )
}

export default function Shows() {
  const { user, permissions, role } = useAuth()
  const canEdit = role === 'admin' || role === 'director' || permissions?.shows?.edit
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { data: shows = [], setData: setShows, loading } = useSupabaseQuery(async () => {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  }, [])

  // Auto-navigate when there is exactly one show and the user isn't an editor
  useEffect(() => {
    if (!loading && shows.length === 1 && !canEdit) {
      navigate(`/show/${shows[0].id}`, { replace: true })
    }
  }, [loading])

  async function handleCreate(fields) {
    const { data, error } = await supabase
      .from('shows')
      .insert({ ...fields, created_by: user.id })
      .select()
      .single()
    if (!error) {
      setShows(prev => [data, ...prev])
      setCreating(false)
    }
  }

  async function handleUpdate(id, fields) {
    const { data, error } = await supabase
      .from('shows')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      setShows(prev => prev.map(s => s.id === id ? data : s))
      setEditingId(null)
    }
  }

  async function handleDelete(id) {
    if (!(await confirmDialog('Eliminar aquest espectacle?'))) return
    await supabase.from('shows').delete().eq('id', id)
    setShows(prev => prev.filter(s => s.id !== id))
  }

  return (
    <Layout narrow>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Espectacles</h1>
          {!creating && canEdit && (
            <button
              onClick={() => setCreating(true)}
              className="bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              + Nou espectacle
            </button>
          )}
        </div>

        {creating && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Nou espectacle</h3>
            <ShowForm onSave={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Carregant...</p>
        ) : shows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Clapperboard size={40} className="mx-auto mb-4 opacity-30" />
            <p>Encara no hi ha cap espectacle.</p>
            <p className="text-sm mt-1">Crea el primer amb el botó de dalt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shows.map(show => (
              <div key={show.id}
                onClick={() => navigate(`/show/${show.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-gray-800/30 transition-colors cursor-pointer">
                {editingId === show.id ? (
                  <ShowForm
                    initial={show}
                    onSave={fields => handleUpdate(show.id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    {show.poster_url && (
                      <img src={show.poster_url} alt="Poster" className="w-10 h-12 object-cover rounded-lg border border-gray-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{show.name}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500 items-center">
                        {show.date && <span>{new Date(show.date).toLocaleDateString('ca-ES')}</span>}
                        {show.venue && (
                          <span className="flex items-center gap-1">
                            {show.venue}
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(show.venue)}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-gray-600 hover:text-cyan-400 transition-colors p-1.5 -m-1" title="Veure al mapa">
                              <MapPin size={13} />
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingId(show.id) }}
                          className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(show.id) }}
                          className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
