import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { runMutation } from '../lib/mutate'
import { toast } from '../components/ui/Toast'
import { parseJsonArray } from '../lib/parseJson'
import { POSITION_TEMPLATES, computeArrangementPositions } from '../lib/editorArrange'
import { DEFAULT_ROW_LABELS, DEFAULT_COLS, CELL, LABEL_W, DIRECTOR_H } from '../lib/editorCanvas'

export function useEditorData({ showId, songId, momentId, navigate }) {
  const [show, setShow] = useState(null)
  const [song, setSong] = useState(null)
  const [moment, setMoment] = useState(null)
  const [moments, setMoments] = useState([])
  const [allShowSongs, setAllShowSongs] = useState([])
  const [members, setMembers] = useState([])
  const [placements, setPlacements] = useState({})
  const [momentSoloists, setMomentSoloists] = useState([])
  const [editMomentTitle, setEditMomentTitle] = useState('')
  const [editMomentSubtitle, setEditMomentSubtitle] = useState('')

  const membersRef = useRef(members)
  const placementsRef = useRef(placements)
  const momentsRef = useRef(moments)
  const saveTimerRef = useRef(null)
  const saveSeqRef = useRef(0)
  const [hasPendingSave, setHasPendingSave] = useState(false)

  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { placementsRef.current = placements }, [placements])
  useEffect(() => { momentsRef.current = moments }, [moments])

  // Warn before leaving if a debounced placement save is still pending.
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!saveTimerRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    async function load() {
      const [showRes, songRes, momentRes, momentsRes, membersRes, exclusionsRes, posRes, allSongsRes] = await Promise.all([
        supabase.from('shows').select('*').eq('id', showId).single(),
        supabase.from('songs').select('*').eq('id', songId).single(),
        supabase.from('moments').select('*').eq('id', momentId).single(),
        supabase.from('moments').select('*').eq('song_id', songId).order('order_index'),
        supabase.from('members').select('*').order('name'),
        supabase.from('show_exclusions').select('member_id').eq('show_id', showId),
        supabase.from('positions').select('*').eq('moment_id', momentId),
        supabase.from('songs').select('id,title,order_index').eq('show_id', showId).order('order_index'),
      ])
      setShow(showRes.data)
      setSong(songRes.data)
      setAllShowSongs(allSongsRes.data ?? [])
      const m = momentRes.data
      setMoment(m)
      setEditMomentTitle(m?.title ?? ''); setEditMomentSubtitle(m?.subtitle ?? '')
      setMomentSoloists(parseJsonArray(m?.soloists))
      setMoments(momentsRes.data ?? [])
      const excludedIds = new Set((exclusionsRes.data ?? []).map(e => e.member_id))
      const mems = (membersRes.data ?? []).filter(m => m.active !== false && !excludedIds.has(m.id))
      setMembers(mems); membersRef.current = mems
      const p = {}
      for (const pos of (posRes.data ?? [])) {
        if (pos.free_x != null && pos.free_y != null)
          p[pos.member_id] = { free: true, x: pos.free_x, y: pos.free_y }
        else if (pos.grid_row != null)
          p[pos.member_id] = { row: pos.grid_row, col: pos.grid_col }
      }
      setPlacements(p); placementsRef.current = p
    }
    load()
  }, [momentId])

  function scheduleSave(p) {
    clearTimeout(saveTimerRef.current)
    setHasPendingSave(true)
    // Sequence guard: only the latest scheduled save is allowed to commit, so a
    // slow in-flight write can never overwrite a newer queued one.
    const seq = ++saveSeqRef.current
    saveTimerRef.current = setTimeout(async () => {
      const rows = Object.entries(p).map(([memberId, pos]) => ({
        moment_id: momentId, member_id: memberId,
        grid_row: pos.free ? null : pos.row, grid_col: pos.free ? null : pos.col,
        free_x: pos.free ? pos.x : null, free_y: pos.free ? pos.y : null,
      }))
      await runMutation({
        persist: async () => {
          const del = await supabase.from('positions').delete().eq('moment_id', momentId)
          if (del.error) return del
          if (seq !== saveSeqRef.current) return {} // superseded by a newer save
          if (rows.length) return supabase.from('positions').insert(rows)
          return {}
        },
        errorMsg: 'Error en desar les posicions',
      })
      if (seq === saveSeqRef.current) {
        saveTimerRef.current = null
        setHasPendingSave(false)
      }
    }, 800)
  }

  function applyPlacements(next) {
    placementsRef.current = next; setPlacements(next); scheduleSave(next)
  }

  async function handleMemberUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (error) { toast.error('Error en desar la persona'); return null }
    setMembers(prev => prev.map(m => m.id === id ? data : m))
    return data
  }
  async function handleMemberSetActive(id, active) {
    const { data, error } = await supabase.from('members').update({ active }).eq('id', id).select().single()
    if (error) { toast.error('Error en actualitzar la persona'); return null }
    setMembers(prev => active ? prev.map(m => m.id === id ? data : m) : prev.filter(m => m.id !== id))
    return data
  }
  async function handleMemberDelete(id) {
    if (!(await confirmDialog('Eliminar definitivament aquesta persona?'))) return false
    const prev = membersRef.current
    return runMutation({
      optimistic: () => setMembers(p => p.filter(m => m.id !== id)),
      persist: () => supabase.from('members').delete().eq('id', id),
      rollback: () => setMembers(prev),
      errorMsg: 'Error en eliminar la persona',
    })
  }

  async function saveMomentMeta(title, subtitle) {
    if (!title.trim()) return
    const prevMoment = moment
    const prevMoments = momentsRef.current
    const patch = { title: title.trim(), subtitle: subtitle.trim() }
    await runMutation({
      optimistic: () => {
        setMoment(p => ({ ...p, ...patch }))
        setMoments(p => p.map(m => m.id === momentId ? { ...m, ...patch } : m))
      },
      persist: () => supabase.from('moments').update(patch).eq('id', momentId),
      rollback: () => { setMoment(prevMoment); setMoments(prevMoments) },
      errorMsg: 'Error en desar el moment',
    })
  }

  async function saveSoloists(soloists) {
    const prev = momentSoloists
    await runMutation({
      optimistic: () => setMomentSoloists(soloists),
      persist: () => supabase.from('moments').update({ soloists: JSON.stringify(soloists) }).eq('id', momentId),
      rollback: () => setMomentSoloists(prev),
      errorMsg: 'Error en desar els solistes',
    })
  }

  async function handleDeleteMoment(mId) {
    if (!(await confirmDialog('Eliminar aquest moment i totes les seves posicions?'))) return
    const prev = momentsRef.current
    const remaining = moments.filter(m => m.id !== mId)
    const ok = await runMutation({
      optimistic: () => setMoments(remaining),
      persist: () => supabase.from('moments').delete().eq('id', mId),
      rollback: () => setMoments(prev),
      errorMsg: 'Error en eliminar el moment',
    })
    if (!ok) return
    if (mId === momentId && remaining.length) {
      navigate(`/show/${showId}/song/${songId}/moment/${remaining[remaining.length - 1].id}`)
    } else if (!remaining.length) {
      navigate(`/show/${showId}`)
    }
  }

  async function navigateToSong(targetSongId) {
    const { data } = await supabase.from('moments').select('id').eq('song_id', targetSongId).order('order_index').limit(1)
    if (data?.length) navigate(`/show/${showId}/song/${targetSongId}/moment/${data[0].id}`)
    else navigate(`/show/${showId}`)
  }

  async function createMoment(title, cloneFrom, selectedOtherMomentId, mode, templateId = '') {
    if (!title.trim()) return null
    const { data: newMom, error } = await supabase.from('moments')
      .insert({ song_id: songId, title: title.trim(), subtitle: '', order_index: moments.length, grid_mode: mode })
      .select().single()
    if (error || !newMom) { toast.error('Error en crear el moment'); return null }
    let cloneMomentId = null
    if (cloneFrom.startsWith('moment:')) cloneMomentId = cloneFrom.slice(7)
    else if (cloneFrom === 'other' && selectedOtherMomentId) cloneMomentId = selectedOtherMomentId
    if (cloneMomentId) {
      const { data: srcPos } = await supabase.from('positions').select('*').eq('moment_id', cloneMomentId)
      if (srcPos?.length) {
        await supabase.from('positions').insert(srcPos.map(p => ({
          moment_id: newMom.id, member_id: p.member_id,
          grid_row: p.grid_row, grid_col: p.grid_col, free_x: p.free_x, free_y: p.free_y,
        })))
      }
    } else if (templateId) {
      const tpl = POSITION_TEMPLATES.find(t => t.id === templateId)
      if (tpl) {
        const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
        const ROWS = rowLabels.length
        const COLS = show?.grid_cols ?? DEFAULT_COLS
        const GW = COLS * CELL, GH = ROWS * CELL
        const dims = { ROWS, COLS, rowLabels, GW, GH, CW: LABEL_W + GW, CH: GH + DIRECTOR_H, rowElevations: [] }
        const placements = computeArrangementPositions(tpl.pattern, tpl.axis, membersRef.current, dims)
        const rows = Object.entries(placements).map(([memberId, pos]) => ({
          moment_id: newMom.id, member_id: memberId,
          grid_row: pos.row, grid_col: pos.col, free_x: null, free_y: null,
        }))
        if (rows.length) await supabase.from('positions').insert(rows)
      }
    }
    setMoments(prev => [...prev, newMom])
    return newMom
  }

  return {
    show, setShow, song, moment, moments, setMoments, allShowSongs,
    members, setMembers, placements, setPlacements, placementsRef, membersRef, momentsRef,
    hasPendingSave,
    momentSoloists, setMomentSoloists,
    editMomentTitle, setEditMomentTitle, editMomentSubtitle, setEditMomentSubtitle,
    applyPlacements, handleMemberUpdate, handleMemberSetActive, handleMemberDelete,
    saveMomentMeta, saveSoloists, handleDeleteMoment, navigateToSong, createMoment,
  }
}
