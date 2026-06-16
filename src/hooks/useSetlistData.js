import { useState, useEffect } from 'react'
import {
  useSensor, useSensors, PointerSensor, KeyboardSensor,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { runMutation } from '../lib/mutate'
import { useHistory } from './useHistory'
import { parseJsonArray, parseJson } from '../lib/parseJson'

export function useSetlistData({ showId, navigate }) {
  const history = useHistory()
  const [show, setShow] = useState(null)
  const [parts, setParts] = useState([])
  const [songs, setSongs] = useState([])
  const [moments, setMoments] = useState({})
  const [micAssignments, setMicAssignments] = useState({})
  const [allMembers, setAllMembers] = useState([])
  const [exclusions, setExclusions] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [repertoire, setRepertoire] = useState([])
  const [positionsByMoment, setPositionsByMoment] = useState({})
  const [diffByMoment, setDiffByMoment] = useState({})
  const [soloistsByMoment, setSoloistsByMoment] = useState({})

  // Expand/collapse state lives here because handleAddMoment mutates it
  const [expandedParts, setExpandedParts] = useState({})
  const [expandedSongs, setExpandedSongs] = useState({})
  const [allExpanded, setAllExpanded] = useState(false)

  const songSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    async function load() {
      const [showRes, partsRes, songsRes, membersRes, exclusionsRes, repRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('parts').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('songs').select('*').eq('show_id', showId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('repertoire_songs').select('id, title, composer, type').order('title'),
      ])
      setRepertoire(repRes.data ?? [])
      const showData = showRes.data
      setShow(showData)
      if (showData?.mic_assignments) {
        setMicAssignments(parseJson(showData.mic_assignments, {}))
      }
      const partList = partsRes.data ?? []
      setParts(partList)
      const partExp = {}; for (const p of partList) partExp[p.id] = true
      setExpandedParts(partExp)
      const songList = songsRes.data ?? []
      setSongs(songList)
      setAllMembers(membersRes.data ?? [])
      setExclusions(new Set((exclusionsRes.data ?? []).map(e => e.member_id)))
      const expInit = {}; for (const s of songList) expInit[s.id] = false
      setExpandedSongs(expInit)
      if (songList.length) {
        const { data: momentData } = await supabase
          .from('moments').select('*').in('song_id', songList.map(s => s.id)).order('order_index')
        const grouped = {}
        for (const s of songList) grouped[s.id] = []
        for (const m of (momentData ?? [])) grouped[m.song_id] = [...(grouped[m.song_id] ?? []), m]
        setMoments(grouped)

        const allMomentIds = (momentData ?? []).map(m => m.id)
        if (allMomentIds.length) {
          const { data: posData } = await supabase
            .from('positions').select('moment_id, grid_row, grid_col, member_id')
            .in('moment_id', allMomentIds)
          const memberVoice = {}
          for (const m of (membersRes.data ?? [])) memberVoice[m.id] = m.voice
          const posByMoment = {}
          for (const p of (posData ?? [])) {
            if (!posByMoment[p.moment_id]) posByMoment[p.moment_id] = []
            posByMoment[p.moment_id].push({ row: p.grid_row, col: p.grid_col, voice: memberVoice[p.member_id], memberId: p.member_id })
          }
          setPositionsByMoment(posByMoment)

          const diffSet = {}
          for (const [, songMoments] of Object.entries(grouped)) {
            for (let i = 1; i < songMoments.length; i++) {
              const prevId = songMoments[i - 1].id
              const currId = songMoments[i].id
              const prev = posByMoment[prevId] ?? []
              const curr = posByMoment[currId] ?? []
              const prevMap = {}
              for (const p of prev) prevMap[p.memberId] = `${p.row},${p.col}`
              const changed = new Set()
              for (const p of curr) {
                if (prevMap[p.memberId] !== `${p.row},${p.col}`) changed.add(p.memberId)
              }
              for (const p of prev) {
                if (!curr.find(c => c.memberId === p.memberId)) changed.add(p.memberId)
              }
              if (changed.size) diffSet[currId] = changed
            }
          }
          setDiffByMoment(diffSet)

          const soloistsMap = {}
          for (const m of (momentData ?? [])) {
            if (m.soloists) {
              soloistsMap[m.id] = parseJsonArray(m.soloists)
            }
          }
          setSoloistsByMoment(soloistsMap)
        }
      }
      setLoading(false)
    }
    load()
  }, [showId])

  // ─── Parts CRUD ──────────────────────────────────────────
  function handleCreatePart({ title }) {
    const row = { id: crypto.randomUUID(), show_id: showId, title, order_index: parts.length }
    history.dispatch({
      label: 'create-part',
      do: () => runMutation({
        optimistic: () => setParts(prev => [...prev, row]),
        persist: () => supabase.from('parts').insert(row),
        rollback: () => setParts(prev => prev.filter(p => p.id !== row.id)),
        errorMsg: 'Error en crear la part', successMsg: 'Part creada',
      }),
      undo: () => runMutation({
        optimistic: () => setParts(prev => prev.filter(p => p.id !== row.id)),
        persist: () => supabase.from('parts').delete().eq('id', row.id),
        rollback: () => setParts(prev => [...prev, row]),
        errorMsg: 'Error en desfer la part',
      }),
    })
    return true
  }

  function handleUpdatePart(partId, { title }) {
    const prev = parts.find(p => p.id === partId)
    const prevTitle = prev?.title
    history.dispatch({
      label: 'update-part',
      do: () => runMutation({
        optimistic: () => setParts(p => p.map(x => x.id === partId ? { ...x, title } : x)),
        persist: () => supabase.from('parts').update({ title }).eq('id', partId),
        rollback: () => setParts(p => p.map(x => x.id === partId ? { ...x, title: prevTitle } : x)),
        errorMsg: 'Error en desar la part', successMsg: 'Part desada',
      }),
      undo: () => runMutation({
        optimistic: () => setParts(p => p.map(x => x.id === partId ? { ...x, title: prevTitle } : x)),
        persist: () => supabase.from('parts').update({ title: prevTitle }).eq('id', partId),
        rollback: () => setParts(p => p.map(x => x.id === partId ? { ...x, title } : x)),
        errorMsg: 'Error en desfer el canvi',
      }),
    })
    return true
  }

  async function handleDeletePart(partId) {
    if (!(await confirmDialog('Eliminar aquesta part? Les cançons quedaran sense part.'))) return false
    const row = parts.find(p => p.id === partId)
    const prevSongs = songs
    history.dispatch({
      label: 'delete-part',
      do: () => runMutation({
        optimistic: () => { setParts(p => p.filter(x => x.id !== partId)); setSongs(s => s.map(x => x.part_id === partId ? { ...x, part_id: null } : x)) },
        persist: () => supabase.from('parts').delete().eq('id', partId),
        rollback: () => { if (row) setParts(p => [...p, row]); setSongs(prevSongs) },
        errorMsg: 'Error en eliminar la part', successMsg: 'Part eliminada',
      }),
      undo: () => runMutation({
        optimistic: () => { if (row) setParts(p => [...p, row]); setSongs(prevSongs) },
        persist: async () => {
          if (!row) return {}
          const res = await supabase.from('parts').insert(row)
          if (!res.error) await supabase.from('songs').update({ part_id: partId }).in('id', prevSongs.filter(s => s.part_id === partId).map(s => s.id))
          return res
        },
        rollback: () => { setParts(p => p.filter(x => x.id !== partId)); setSongs(s => s.map(x => x.part_id === partId ? { ...x, part_id: null } : x)) },
        errorMsg: 'Error en desfer l\'eliminació',
      }),
    })
    return true
  }

  // ─── Songs CRUD ──────────────────────────────────────────
  function handleCreateSong(fields) {
    const row = { id: crypto.randomUUID(), ...fields, show_id: showId, order_index: songs.length }
    history.dispatch({
      label: 'create-song',
      do: () => runMutation({
        optimistic: () => { setSongs(prev => [...prev, row]); setMoments(prev => ({ ...prev, [row.id]: [] })) },
        persist: () => supabase.from('songs').insert(row),
        rollback: () => { setSongs(prev => prev.filter(s => s.id !== row.id)); setMoments(prev => { const n = { ...prev }; delete n[row.id]; return n }) },
        errorMsg: 'Error en afegir la cançó', successMsg: 'Cançó afegida',
      }),
      undo: () => runMutation({
        optimistic: () => { setSongs(prev => prev.filter(s => s.id !== row.id)); setMoments(prev => { const n = { ...prev }; delete n[row.id]; return n }) },
        persist: () => supabase.from('songs').delete().eq('id', row.id),
        rollback: () => { setSongs(prev => [...prev, row]); setMoments(prev => ({ ...prev, [row.id]: [] })) },
        errorMsg: 'Error en desfer l\'afegit',
      }),
    })
    return true
  }

  function handleUpdateSong(songId, fields) {
    const prev = songs.find(s => s.id === songId)
    const prevFields = prev ? Object.fromEntries(Object.keys(fields).map(k => [k, prev[k]])) : {}
    history.dispatch({
      label: 'update-song',
      do: () => runMutation({
        optimistic: () => setSongs(s => s.map(x => x.id === songId ? { ...x, ...fields } : x)),
        persist: () => supabase.from('songs').update(fields).eq('id', songId),
        rollback: () => setSongs(s => s.map(x => x.id === songId ? { ...x, ...prevFields } : x)),
        errorMsg: 'Error en desar la cançó', successMsg: 'Cançó desada',
      }),
      undo: () => runMutation({
        optimistic: () => setSongs(s => s.map(x => x.id === songId ? { ...x, ...prevFields } : x)),
        persist: () => supabase.from('songs').update(prevFields).eq('id', songId),
        rollback: () => setSongs(s => s.map(x => x.id === songId ? { ...x, ...fields } : x)),
        errorMsg: 'Error en desfer el canvi',
      }),
    })
    return true
  }

  async function handleDeleteSong(songId) {
    if (!(await confirmDialog('Eliminar aquesta cançó i tots els seus moments?'))) return false
    const row = songs.find(s => s.id === songId)
    const prevMoments = moments[songId] ?? []
    history.dispatch({
      label: 'delete-song',
      do: () => runMutation({
        optimistic: () => { setSongs(prev => prev.filter(s => s.id !== songId)); setMoments(prev => { const n = { ...prev }; delete n[songId]; return n }) },
        persist: () => supabase.from('songs').delete().eq('id', songId),
        rollback: () => { if (row) setSongs(prev => [...prev, row]); setMoments(prev => ({ ...prev, [songId]: prevMoments })) },
        errorMsg: 'Error en eliminar la cançó', successMsg: 'Cançó eliminada',
      }),
      undo: () => runMutation({
        optimistic: () => { if (row) setSongs(prev => [...prev, row]); setMoments(prev => ({ ...prev, [songId]: prevMoments })) },
        persist: () => row ? supabase.from('songs').insert(row) : Promise.resolve({}),
        rollback: () => { setSongs(prev => prev.filter(s => s.id !== songId)); setMoments(prev => { const n = { ...prev }; delete n[songId]; return n }) },
        errorMsg: 'Error en desfer l\'eliminació',
      }),
    })
    return true
  }

  // ─── Song drag-and-drop ──────────────────────────────────
  async function handleSongDragEnd({ active, over }) {
    if (!over) return
    const activeSong = songs.find(s => s.id === active.id)
    if (!activeSong) return

    if (String(over.id).startsWith('drop-part-')) {
      const targetPartId = over.id === 'drop-part-none' ? null : over.id.replace('drop-part-', '')
      if (targetPartId !== activeSong.part_id) {
        const { data, error } = await supabase.from('songs').update({ part_id: targetPartId }).eq('id', activeSong.id).select().single()
        if (!error) setSongs(prev => prev.map(s => s.id === activeSong.id ? data : s))
      }
      return
    }

    const overSong = songs.find(s => s.id === over.id)
    if (!overSong) return

    if (activeSong.part_id !== overSong.part_id) {
      const { data, error } = await supabase.from('songs').update({ part_id: overSong.part_id }).eq('id', activeSong.id).select().single()
      if (!error) setSongs(prev => prev.map(s => s.id === activeSong.id ? data : s))
      return
    }

    const partSongs = songs.filter(s => s.part_id === activeSong.part_id)
    const oldIndex = partSongs.findIndex(s => s.id === activeSong.id)
    const newIndex = partSongs.findIndex(s => s.id === overSong.id)
    if (oldIndex === newIndex) return

    const reordered = arrayMove(partSongs, oldIndex, newIndex)
    const otherSongs = songs.filter(s => s.part_id !== activeSong.part_id)
    const updated = [...otherSongs, ...reordered].map((s, i) => ({ ...s, order_index: i }))
    setSongs(updated)
    await Promise.all(reordered.map((s, i) => supabase.from('songs').update({ order_index: otherSongs.length + i }).eq('id', s.id)))
  }

  // ─── Moment operations ───────────────────────────────────
  async function handleReorderMoments(songId, reordered) {
    setMoments(prev => ({ ...prev, [songId]: reordered }))
    await Promise.all(reordered.map((m, i) => supabase.from('moments').update({ order_index: i }).eq('id', m.id)))
  }

  function handleAddMoment(songId, navigateAfter = false) {
    const existing = moments[songId] ?? []
    const row = { id: crypto.randomUUID(), song_id: songId, title: `Moment ${existing.length + 1}`, order_index: existing.length, grid_mode: 'alternate' }
    history.dispatch({
      label: 'create-moment',
      do: async () => {
        const ok = await runMutation({
          optimistic: () => { setMoments(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), row] })); setExpandedSongs(prev => ({ ...prev, [songId]: true })); setAllExpanded(true) },
          persist: () => supabase.from('moments').insert(row),
          rollback: () => setMoments(prev => { const n = { ...prev }; n[songId] = (n[songId] ?? []).filter(m => m.id !== row.id); return n }),
          errorMsg: 'Error en crear el moment', successMsg: 'Moment creat',
        })
        if (ok && navigateAfter) navigate(`/show/${showId}/song/${songId}/moment/${row.id}`)
      },
      undo: () => runMutation({
        optimistic: () => setMoments(prev => { const n = { ...prev }; n[songId] = (n[songId] ?? []).filter(m => m.id !== row.id); return n }),
        persist: () => supabase.from('moments').delete().eq('id', row.id),
        rollback: () => setMoments(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), row] })),
        errorMsg: 'Error en desfer el moment',
      }),
    })
  }

  async function handleDeleteMoment(momentId) {
    if (!(await confirmDialog('Eliminar aquest moment?'))) return
    let songId = null
    let row = null
    for (const [sid, list] of Object.entries(moments)) {
      const found = list.find(m => m.id === momentId)
      if (found) { songId = sid; row = found; break }
    }
    history.dispatch({
      label: 'delete-moment',
      do: () => runMutation({
        optimistic: () => setMoments(prev => { const n = {}; for (const [sid, list] of Object.entries(prev)) n[sid] = list.filter(m => m.id !== momentId); return n }),
        persist: () => supabase.from('moments').delete().eq('id', momentId),
        rollback: () => { if (songId && row) setMoments(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), row] })) },
        errorMsg: 'Error en eliminar el moment', successMsg: 'Moment eliminat',
      }),
      undo: () => runMutation({
        optimistic: () => { if (songId && row) setMoments(prev => ({ ...prev, [songId]: [...(prev[songId] ?? []), row] })) },
        persist: () => row ? supabase.from('moments').insert(row) : Promise.resolve({}),
        rollback: () => setMoments(prev => { const n = {}; for (const [sid, list] of Object.entries(prev)) n[sid] = list.filter(m => m.id !== momentId); return n }),
        errorMsg: 'Error en desfer l\'eliminació',
      }),
    })
  }

  async function handlePasteMoment(targetSongId, copiedMoment) {
    if (!copiedMoment) return
    const existing = moments[targetSongId] ?? []
    const { data: newMom, error } = await supabase.from('moments')
      .insert({ song_id: targetSongId, title: copiedMoment.title, order_index: existing.length, grid_mode: copiedMoment.grid_mode ?? 'alternate' })
      .select().single()
    if (error || !newMom) return
    const { data: srcPos } = await supabase.from('positions').select('*').eq('moment_id', copiedMoment.id)
    if (srcPos?.length) {
      await supabase.from('positions').insert(srcPos.map(p => ({
        moment_id: newMom.id, member_id: p.member_id,
        grid_row: p.grid_row, grid_col: p.grid_col, free_x: p.free_x, free_y: p.free_y,
      })))
    }
    setMoments(prev => ({ ...prev, [targetSongId]: [...(prev[targetSongId] ?? []), newMom] }))
    setExpandedSongs(prev => ({ ...prev, [targetSongId]: true }))
  }

  // ─── Cast exclusions ─────────────────────────────────────
  function toggleExclusion(memberId, currentlyExcluded) {
    history.dispatch({
      label: 'toggle-exclusion',
      do: () => runMutation({
        optimistic: () => setExclusions(prev => { const n = new Set(prev); currentlyExcluded ? n.delete(memberId) : n.add(memberId); return n }),
        persist: () => currentlyExcluded
          ? supabase.from('show_exclusions').delete().eq('show_id', showId).eq('member_id', memberId)
          : supabase.from('show_exclusions').insert({ show_id: showId, member_id: memberId }),
        rollback: () => setExclusions(prev => { const n = new Set(prev); currentlyExcluded ? n.add(memberId) : n.delete(memberId); return n }),
        errorMsg: 'Error en actualitzar el càsting',
      }),
      undo: () => runMutation({
        optimistic: () => setExclusions(prev => { const n = new Set(prev); currentlyExcluded ? n.add(memberId) : n.delete(memberId); return n }),
        persist: () => currentlyExcluded
          ? supabase.from('show_exclusions').insert({ show_id: showId, member_id: memberId })
          : supabase.from('show_exclusions').delete().eq('show_id', showId).eq('member_id', memberId),
        rollback: () => setExclusions(prev => { const n = new Set(prev); currentlyExcluded ? n.delete(memberId) : n.add(memberId); return n }),
        errorMsg: 'Error en desfer el càsting',
      }),
    })
  }

  // ─── Derived ─────────────────────────────────────────────
  const repMap = Object.fromEntries(repertoire.map(r => [r.id, r]))

  const songsByPart = {}
  for (const song of songs) {
    const key = song.part_id ?? '__none__'
    ;(songsByPart[key] ??= []).push(song)
  }

  const sections = [
    ...parts.map(p => ({ key: p.id, part: p, songs: songsByPart[p.id] ?? [] })),
    ...(songsByPart['__none__']?.length ? [{ key: '__none__', part: null, songs: songsByPart['__none__'] }] : []),
  ]
  if (!sections.length && !songs.length) sections.push({ key: '__none__', part: null, songs: [] })

  return {
    history,
    show, setShow, parts, songs, moments, micAssignments,
    allMembers, setAllMembers, exclusions, loading, repertoire,
    positionsByMoment, diffByMoment, soloistsByMoment,
    expandedParts, setExpandedParts, expandedSongs, setExpandedSongs,
    allExpanded, setAllExpanded, songSensors,
    repMap, songsByPart, sections,
    handleCreatePart, handleUpdatePart, handleDeletePart,
    handleCreateSong, handleUpdateSong, handleDeleteSong,
    handleSongDragEnd, handleReorderMoments,
    handleAddMoment, handleDeleteMoment, handlePasteMoment,
    toggleExclusion,
  }
}
