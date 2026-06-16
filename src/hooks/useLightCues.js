import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { runMutation } from '../lib/mutate'
import { useHistory } from './useHistory'
import { sortCues } from '../lib/lights'

// Loads everything the lights view needs for a show and exposes
// CRUD for cues and presets, with optimistic updates like the rest of the pages.
export function useLightCues(showId) {
  const history = useHistory()
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
    const row = { id: crypto.randomUUID(), show_id: showId, ...fields }
    setSaving(true)
    let result = null
    await history.dispatch({
      label: 'create-cue',
      do: () => runMutation({
        optimistic: () => setCues(prev => sortCues([...prev, row])),
        persist: async () => {
          const res = await supabase.from('light_cues').insert(row).select().single()
          if (!res.error && res.data) result = res.data
          return res
        },
        rollback: () => setCues(prev => prev.filter(c => c.id !== row.id)),
        errorMsg: 'Error en crear el cue',
      }),
      undo: () => runMutation({
        optimistic: () => setCues(prev => prev.filter(c => c.id !== row.id)),
        persist: () => supabase.from('light_cues').delete().eq('id', row.id),
        rollback: () => setCues(prev => sortCues([...prev, row])),
        errorMsg: 'Error en desfer el cue',
      }),
    })
    setSaving(false)
    return result ?? row
  }

  async function updateCue(id, fields) {
    const prevCue = cues.find(c => c.id === id)
    const prevFields = prevCue ? Object.fromEntries(Object.keys(fields).map(k => [k, prevCue[k]])) : {}
    setSaving(true)
    await history.dispatch({
      label: 'update-cue',
      do: () => runMutation({
        optimistic: () => setCues(p => sortCues(p.map(c => c.id === id ? { ...c, ...fields } : c))),
        persist: () => supabase.from('light_cues').update(fields).eq('id', id),
        rollback: () => setCues(p => sortCues(p.map(c => c.id === id ? { ...c, ...prevFields } : c))),
        errorMsg: 'Error en desar el cue',
      }),
      undo: () => runMutation({
        optimistic: () => setCues(p => sortCues(p.map(c => c.id === id ? { ...c, ...prevFields } : c))),
        persist: () => supabase.from('light_cues').update(prevFields).eq('id', id),
        rollback: () => setCues(p => sortCues(p.map(c => c.id === id ? { ...c, ...fields } : c))),
        errorMsg: 'Error en desfer el cue',
      }),
    })
    setSaving(false)
  }

  async function deleteCue(id) {
    const row = cues.find(c => c.id === id)
    await history.dispatch({
      label: 'delete-cue',
      do: () => runMutation({
        optimistic: () => setCues(p => p.filter(c => c.id !== id)),
        persist: () => supabase.from('light_cues').delete().eq('id', id),
        rollback: () => row && setCues(p => sortCues([...p, row])),
        errorMsg: 'Error en eliminar el cue',
      }),
      undo: () => row ? runMutation({
        optimistic: () => setCues(p => sortCues([...p, row])),
        persist: () => supabase.from('light_cues').insert(row),
        rollback: () => setCues(p => p.filter(c => c.id !== id)),
        errorMsg: 'Error en desfer l\'eliminació',
      }) : Promise.resolve(),
    })
  }

  async function renumberCues() {
    const prev = cues
    const sorted = sortCues(cues)
    const updates = sorted.map((cue, index) => ({ id: cue.id, cue_number: index + 1 }))
    setSaving(true)
    await runMutation({
      optimistic: () => setCues(sorted.map((cue, index) => ({ ...cue, cue_number: index + 1 }))),
      persist: async () => {
        const results = await Promise.all(
          updates.map(({ id, cue_number }) =>
            supabase.from('light_cues').update({ cue_number }).eq('id', id))
        )
        return results.find(r => r.error) || {}
      },
      rollback: () => setCues(prev),
      errorMsg: 'Error en renumerar els cues',
    })
    setSaving(false)
  }

  // ─── Presets CRUD ─────────────────────────────────────────
  const sortPresets = list => [...list].sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''))

  async function createPreset(fields) {
    if (!fields.code) {
      const used = new Set(presets.map(p => p.code).filter(Boolean))
      for (let i = 0; i < 26; i++) {
        const c = String.fromCharCode(65 + i)
        if (!used.has(c)) { fields = { ...fields, code: c }; break }
      }
    }
    const row = { id: crypto.randomUUID(), show_id: showId, ...fields }
    await history.dispatch({
      label: 'create-preset',
      do: () => runMutation({
        optimistic: () => setPresets(prev => sortPresets([...prev, row])),
        persist: () => supabase.from('light_presets').insert(row),
        rollback: () => setPresets(prev => prev.filter(p => p.id !== row.id)),
        errorMsg: 'Error en crear el preset',
      }),
      undo: () => runMutation({
        optimistic: () => setPresets(prev => prev.filter(p => p.id !== row.id)),
        persist: () => supabase.from('light_presets').delete().eq('id', row.id),
        rollback: () => setPresets(prev => sortPresets([...prev, row])),
        errorMsg: 'Error en desfer el preset',
      }),
    })
    return row
  }

  function updatePreset(id, fields) {
    const prevPreset = presets.find(p => p.id === id)
    const prevFields = prevPreset ? Object.fromEntries(Object.keys(fields).map(k => [k, prevPreset[k]])) : {}
    history.dispatch({
      label: 'update-preset',
      do: () => runMutation({
        optimistic: () => setPresets(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p)),
        persist: () => supabase.from('light_presets').update(fields).eq('id', id),
        rollback: () => setPresets(prev => prev.map(p => p.id === id ? { ...p, ...prevFields } : p)),
        errorMsg: 'Error en desar el preset',
      }),
      undo: () => runMutation({
        optimistic: () => setPresets(prev => prev.map(p => p.id === id ? { ...p, ...prevFields } : p)),
        persist: () => supabase.from('light_presets').update(prevFields).eq('id', id),
        rollback: () => setPresets(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p)),
        errorMsg: 'Error en desfer el preset',
      }),
    })
  }

  function deletePreset(id) {
    const row = presets.find(p => p.id === id)
    history.dispatch({
      label: 'delete-preset',
      do: () => runMutation({
        optimistic: () => setPresets(prev => prev.filter(p => p.id !== id)),
        persist: () => supabase.from('light_presets').delete().eq('id', id),
        rollback: () => row && setPresets(prev => sortPresets([...prev, row])),
        errorMsg: 'Error en eliminar el preset',
      }),
      undo: () => row ? runMutation({
        optimistic: () => setPresets(prev => sortPresets([...prev, row])),
        persist: () => supabase.from('light_presets').insert(row),
        rollback: () => setPresets(prev => prev.filter(p => p.id !== id)),
        errorMsg: 'Error en desfer l\'eliminació',
      }) : Promise.resolve(),
    })
  }

  // ─── Lletres (al repertori global) ────────────────────────
  async function saveLyrics(repertoireSongId, lyrics) {
    setRepertoire(prev => ({ ...prev, [repertoireSongId]: { ...prev[repertoireSongId], lyrics } }))
    setSaving(true)
    await supabase.from('repertoire_songs').update({ lyrics }).eq('id', repertoireSongId)
    setSaving(false)
  }

  return {
    history,
    show, songs, repertoire, momentsBySong, positionsByMoment, members, cues, presets,
    loading, saving,
    loadMomentPositions, createCue, updateCue, deleteCue, renumberCues, createPreset, updatePreset, deletePreset, saveLyrics,
  }
}
