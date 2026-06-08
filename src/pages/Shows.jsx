import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Layout from '../components/Layout'

function ShowForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [venue, setVenue] = useState(initial?.venue ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ name, date: date || null, venue })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Nom *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Condal 2026"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Sala</label>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="Gran Teatre del Liceu"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
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
  const { user } = useAuth()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchShows() }, [])

  async function fetchShows() {
    const { data } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })
    setShows(data ?? [])
    setLoading(false)
  }

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
    if (!confirm('Eliminar aquest espectacle?')) return
    await supabase.from('shows').delete().eq('id', id)
    setShows(prev => prev.filter(s => s.id !== id))
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Espectacles</h1>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
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
            <p className="text-4xl mb-4">🎭</p>
            <p>Encara no hi ha cap espectacle.</p>
            <p className="text-sm mt-1">Crea el primer amb el botó de dalt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shows.map(show => (
              <div key={show.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                {editingId === show.id ? (
                  <ShowForm
                    initial={show}
                    onSave={fields => handleUpdate(show.id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link to={`/show/${show.id}`} className="text-white font-semibold hover:text-blue-400 transition-colors">
                        {show.name}
                      </Link>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {show.date && <span>{new Date(show.date).toLocaleDateString('ca-ES')}</span>}
                        {show.venue && <span>{show.venue}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        to={`/show/${show.id}`}
                        className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Obrir
                      </Link>
                      <button
                        onClick={() => setEditingId(show.id)}
                        className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(show.id)}
                        className="text-xs text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
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
