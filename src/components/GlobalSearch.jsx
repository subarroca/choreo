import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Clapperboard, Music, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { VOICE_COLORS, VOICE_LABELS } from '../lib/constants'
import Avatar from './ui/Avatar'

function useGlobalSearchData() {
  const [members, setMembers] = useState([])
  const [shows, setShows] = useState([])
  const [songs, setSongs] = useState([])
  const loaded = useRef(false)

  async function load() {
    if (loaded.current) return
    loaded.current = true
    const [memRes, showRes, songRes] = await Promise.all([
      supabase.from('members').select('id, first_name, last_name, name, voice, initials').eq('active', true),
      supabase.from('shows').select('id, name, date'),
      supabase.from('repertoire_songs').select('id, title, composer'),
    ])
    setMembers(memRes.data ?? [])
    setShows(showRes.data ?? [])
    setSongs(songRes.data ?? [])
  }

  return { members, shows, songs, load }
}

function highlight(text, query) {
  if (!query || !text) return text
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return text
  return <>{text.slice(0, i)}<mark className="bg-cyan-500/30 text-cyan-200 rounded-sm">{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>
}

export function GlobalSearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { members, shows, songs, load } = useGlobalSearchData()

  useEffect(() => {
    load()
    inputRef.current?.focus()
  }, [])

  const q = query.trim().toLowerCase()
  const memResults = q ? members.filter(m => {
    const full = [m.first_name, m.last_name, m.name].filter(Boolean).join(' ').toLowerCase()
    return full.includes(q)
  }).slice(0, 5) : []
  const showResults = q ? shows.filter(s => s.name.toLowerCase().includes(q)).slice(0, 4) : []
  const songResults = q ? songs.filter(s => s.title?.toLowerCase().includes(q) || s.composer?.toLowerCase().includes(q)).slice(0, 4) : []

  const hasResults = memResults.length + showResults.length + songResults.length > 0

  function go(path) { navigate(path); onClose() }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-pane border border-line rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-rim">
          <Search size={16} className="text-ghost shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
            placeholder="Cerca persones, espectacles, cançons…"
            className="flex-1 bg-transparent text-sm text-body placeholder-ghost outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ghost hover:text-body transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] text-ghost border border-rim rounded px-1.5 py-0.5 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        {q && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {!hasResults && (
              <p className="text-ghost text-sm text-center py-8">Cap resultat per "{query}"</p>
            )}

            {memResults.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] text-ghost uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={10} /> Persones
                </p>
                {memResults.map(m => {
                  const full = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.name || ''
                  const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
                  return (
                    <button key={m.id} onClick={() => go('/members')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-fill transition-colors">
                      <Avatar member={m} size="xs" />
                      <span className="text-body text-sm">{highlight(full, query)}</span>
                      {m.voice && <span className="text-xs ml-auto shrink-0" style={{ color: c.bg }}>{VOICE_LABELS[m.voice]}</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {showResults.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] text-ghost uppercase tracking-wider flex items-center gap-1.5">
                  <Clapperboard size={10} /> Espectacles
                </p>
                {showResults.map(s => (
                  <button key={s.id} onClick={() => go(`/show/${s.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-fill transition-colors">
                    <Clapperboard size={14} className="text-ghost shrink-0" />
                    <span className="text-body text-sm">{highlight(s.name, query)}</span>
                    {s.date && <span className="text-ghost text-xs ml-auto shrink-0">{new Date(s.date).getFullYear()}</span>}
                  </button>
                ))}
              </div>
            )}

            {songResults.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] text-ghost uppercase tracking-wider flex items-center gap-1.5">
                  <Music size={10} /> Cançons
                </p>
                {songResults.map(s => (
                  <button key={s.id} onClick={() => go('/songs')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-fill transition-colors">
                    <Music size={14} className="text-ghost shrink-0" />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-body text-sm truncate">{highlight(s.title, query)}</div>
                      {s.composer && <div className="text-ghost text-xs truncate">{highlight(s.composer, query)}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!q && (
          <div className="px-4 py-6 text-center text-ghost text-sm">
            Escriu per cercar persones, espectacles o cançons
          </div>
        )}
      </div>
    </div>
  )
}

const searchListeners = new Set()
function broadcastSearch(open) { searchListeners.forEach(fn => fn(open)) }

export function useGlobalSearch() {
  const [open, setOpenLocal] = useState(false)

  function setOpen(val) {
    const next = typeof val === 'function' ? val(open) : val
    broadcastSearch(next)
  }

  useEffect(() => {
    function onBroadcast(v) { setOpenLocal(v) }
    searchListeners.add(onBroadcast)
    return () => searchListeners.delete(onBroadcast)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        broadcastSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { open, setOpen }
}
