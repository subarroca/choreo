import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ImageIcon, Upload, X, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import ShowToolbar from '../components/ShowToolbar'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'
const DIN_RATIO = 420 / 297

export default function Poster() {
  const { id: showId } = useParams()
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    supabase.from('shows').select('*').eq('id', showId).single()
      .then(({ data }) => { setShow(data); setLoading(false) })
  }, [showId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `shows/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('show-posters').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('show-posters').getPublicUrl(path)
      await supabase.from('shows').update({ poster_url: publicUrl }).eq('id', showId)
      setShow(prev => ({ ...prev, poster_url: publicUrl }))
    }
    setUploading(false)
  }

  async function handleRemove() {
    await supabase.from('shows').update({ poster_url: null }).eq('id', showId)
    setShow(prev => ({ ...prev, poster_url: null }))
  }

  const dateStr = show?.date
    ? new Date(show.date + 'T12:00:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <Layout fullWidth>
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <ShowToolbar showId={showId} showName={show?.name} />

        <div className="flex-1 overflow-y-auto flex flex-col items-center p-6 gap-6">
          {loading ? (
            <p className="text-faint text-sm mt-8">Carregant…</p>
          ) : (
            <>
              {/* DIN vertical canvas */}
              <div className="relative border-2 border-dashed border-line rounded-lg overflow-hidden bg-pane"
                style={{ width: '100%', maxWidth: 360, aspectRatio: `1 / ${DIN_RATIO}` }}>
                {show?.poster_url ? (
                  <img src={show.poster_url} alt="Pòster" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ghost">
                    <ImageIcon size={48} className="opacity-30" />
                    <p className="text-sm">DIN vertical — {Math.round(297)}×{Math.round(420)} mm</p>
                    <p className="text-xs">Puja una imatge per al rètol</p>
                  </div>
                )}
                {/* Overlay with show info */}
                {!show?.poster_url && (
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-body font-bold text-lg">{show?.name}</p>
                    {dateStr && <p className="text-soft text-sm">{dateStr}</p>}
                    {show?.venue && <p className="text-muted text-xs">{show.venue}</p>}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {DEV_MODE ? (
                  <p className="text-xs text-ghost">Upload desactivat en mode dev.</p>
                ) : (
                  <>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-300 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                      <Upload size={14} /> {uploading ? 'Pujant…' : show?.poster_url ? 'Canviar imatge' : 'Pujar imatge'}
                    </button>
                  </>
                )}
                {show?.poster_url && (
                  <>
                    <a href={show.poster_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-muted hover:text-body px-3 py-2 rounded-lg border border-line hover:bg-fill transition-colors">
                      <Download size={14} /> Descarregar
                    </a>
                    <button onClick={handleRemove}
                      className="text-ghost hover:text-red-400 p-2 rounded-lg hover:bg-fill transition-colors">
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* DIN info */}
              <p className="text-xs text-ghost text-center max-w-xs">
                Format DIN vertical (A3: 297×420 mm). La imatge es retallarà per ajustar-se al format.
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
