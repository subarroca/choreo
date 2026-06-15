import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sortCues } from '../lib/lights'

// Loads everything the lights view needs for a show and exposes
// CRUD for cues and presets, with optimistic updates like the rest of the pages.
export function useLightCues(showId) {
  const [show, setShow] = useState(null)
  const [songs, setSongs] = useState([])              // ordenades per order_index
  const [repertoire, setRepertoire] = useState({})    // { repertoire_song_id: { lyrics, title } }
  const [momentsBySong, setMomentsBySong] = useState({})
  const [positionsByMoment, setPositionsByMoment] = useState({})
  const [members, setMembers] = useState([])
  const [cues, setCues] = useState([])
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [showRes, songsRes, membersRes, exclusionsRes, cuesRes, presetsRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('light_cues').select('*').eq('show_id', showId).order('cue_number'),
        supabase.from('light_presets').select('*').eq('show_id', showId).order('name'),
      ])
      setShow(showRes.data)
      const songList = songsRes.data ?? []
      setSongs(songList)
      const excludedIds = new Set((exclusionsRes.data ?? []).map(e => e.member_id))
      setMembers((membersRes.data ?? []).filter(m => m.active !== false && !excludedIds.has(m.id)))
      setCues(sortCues(cuesRes.data ?? []))
      setPresets(presetsRes.data ?? [])

      const repIds = [...new Set(songList.map(s => s.repertoire_song_id).filter(Boolean))]
      if (repIds.length) {
        const { data: reps } = await supabase.from('repertoire_songs').select('*').in('id', repIds)
        setRepertoire(Object.fromEntries((reps ?? []).map(r => [r.id, r])))
      }
      if (songList.length) {
        const { data: moms } = await supabase.from('moments').select('*')
          .in('song_id', songList.map(s => s.id)).order('order_index')
        const grouped = {}
        for (const m of (moms ?? [])) (grouped[m.song_id] ??= []).push(m)
        setMomentsBySong(grouped)
      }
      setLoading(false)
    }
    load()
  }, [showId])

  // Posicions d'un moment, carregades sota demanda i memoitzades (per al mini-escenari)
  async function loadMomentPositions(momentId) {
    if (!momentId || positionsByMoment[momentId]) return
    const { data } = await supabase.from('positions').select('*').eq('moment_id', momentId)
    const placements = {}
    for (const pos of (data ?? [])) {
      if (pos.free_x != null && pos.free_y != null) placements[pos.member_id] = { free: true, x: pos.free_x, y: pos.free_y }
      else if (pos.grid_row != null) placements[pos.member_id] = { row: pos.grid_row, col: pos.grid_col }
    }
    setPositionsByMoment(prev => ({ ...prev, [momentId]: placements }))
  }

  // ─── Cues CRUD ────────────────────────────────────────────
  async function createCue(fields) {
    setSaving(true)
    const { data, error } = await supabase.from('light_cues')
      .insert({ show_id: showId, ...fields }).select().single()
    setSaving(false)
    if (!error && data) setCues(prev => sortCues([...prev, data]))
    return error ? null : data
  }

  async function updateCue(id, fields) {
    setCues(prev => sortCues(prev.map(c => c.id === id ? { ...c, ...fields } : c)))
    setSaving(true)
    await supabase.from('light_cues').update(fields).eq('id', id)
    setSaving(false)
  }

  async function deleteCue(id) {
    setCues(prev => prev.filter(c => c.id !== id))
    await supabase.from('light_cues').delete().eq('id', id)
  }

  async function renumberCues() {
    const sorted = sortCues(cues)
    const updates = sorted.map((cue, index) => ({
      id: cue.id,
      cue_number: index + 1
    }))

    // Optimistic update
    setCues(sorted.map((cue, index) => ({ ...cue, cue_number: index + 1 })))

    // Database update
    setSaving(true)
    for (const { id, cue_number } of updates) {
      await supabase.from('light_cues').update({ cue_number }).eq('id', id)
    }
    setSaving(false)
  }

  // ─── Presets CRUD ─────────────────────────────────────────
  async function createPreset(fields) {
    if (!fields.code) {
      const used = new Set(presets.map(p => p.code).filter(Boolean))
      for (let i = 0; i < 26; i++) {
        const c = String.fromCharCode(65 + i)
        if (!used.has(c)) { fields = { ...fields, code: c }; break }
      }
    }
    const { data, error } = await supabase.from('light_presets')
      .insert({ show_id: showId, ...fields }).select().single()
    if (!error && data) setPresets(prev => [...prev, data].sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '')))
    return error ? null : data
  }

  async function updatePreset(id, fields) {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    await supabase.from('light_presets').update(fields).eq('id', id)
  }

  async function deletePreset(id) {
    setPresets(prev => prev.filter(p => p.id !== id))
    await supabase.from('light_presets').delete().eq('id', id)
  }

  // ─── Lletres (al repertori global) ────────────────────────
  async function saveLyrics(repertoireSongId, lyrics) {
    setRepertoire(prev => ({ ...prev, [repertoireSongId]: { ...prev[repertoireSongId], lyrics } }))
    setSaving(true)
    await supabase.from('repertoire_songs').update({ lyrics }).eq('id', repertoireSongId)
    setSaving(false)
  }

  return {
    show, songs, repertoire, momentsBySong, positionsByMoment, members, cues, presets,
    loading, saving,
    loadMomentPositions, createCue, updateCue, deleteCue, renumberCues, createPreset, updatePreset, deletePreset, saveLyrics,
  }
}
