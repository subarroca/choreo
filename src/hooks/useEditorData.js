import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { confirmDialog } from '../components/ui/ConfirmDialog'
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

  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { placementsRef.current = placements }, [placements])
  useEffect(() => { momentsRef.current = moments }, [moments])

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
      setMomentSoloists(Array.isArray(m?.soloists) ? m.soloists : (m?.soloists ? JSON.parse(m.soloists) : []))
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
    saveTimerRef.current = setTimeout(() => {
      const rows = Object.entries(p).map(([memberId, pos]) => ({
        moment_id: momentId, member_id: memberId,
        grid_row: pos.free ? null : pos.row, grid_col: pos.free ? null : pos.col,
        free_x: pos.free ? pos.x : null, free_y: pos.free ? pos.y : null,
      }))
      supabase.from('positions').delete().eq('moment_id', momentId).then(() => {
        if (rows.length) supabase.from('positions').insert(rows)
      })
    }, 800)
  }

  function applyPlacements(next) {
    placementsRef.current = next; setPlacements(next); scheduleSave(next)
  }

  async function handleMemberUpdate(id, fields) {
    const { data, error } = await supabase.from('members').update(fields).eq('id', id).select().single()
    if (!error) setMembers(prev => prev.map(m => m.id === id ? data : m))
    return error ? null : data
  }
  async function handleMemberSetActive(id, active) {
    const { data, error } = await supabase.from('members').update({ active }).eq('id', id).select().single()
    if (!error) setMembers(prev => active ? prev.map(m => m.id === id ? data : m) : prev.filter(m => m.id !== id))
    return error ? null : data
  }
  async function handleMemberDelete(id) {
    if (!(await confirmDialog('Eliminar definitivament aquesta persona?'))) return false
    await supabase.from('members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
    return true
  }

  async function saveMomentMeta(title, subtitle) {
    if (!title.trim()) return
    await supabase.from('moments').update({ title: title.trim(), subtitle: subtitle.trim() }).eq('id', momentId)
    setMoment(prev => ({ ...prev, title: title.trim(), subtitle: subtitle.trim() }))
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, title: title.trim(), subtitle: subtitle.trim() } : m))
  }

  async function saveSoloists(soloists) {
    setMomentSoloists(soloists)
    await supabase.from('moments').update({ soloists: JSON.stringify(soloists) }).eq('id', momentId)
  }

  async function handleDeleteMoment(mId) {
    if (!(await confirmDialog('Eliminar aquest moment i totes les seves posicions?'))) return
    await supabase.from('moments').delete().eq('id', mId)
    const remaining = moments.filter(m => m.id !== mId)
    setMoments(remaining)
    if (mId === momentId && remaining.length) {
      navigate(`/show/${showId}/song/${songId}/moment/${remaining[remaining.length - 1].id}`)
    } else if (!remaining.length) {
      navigate(`/show/${showId}`)
    }
  }

  async function navigateToSong(targetSongId) {
    const { data } = await supabase.from('moments').select('id').eq('song_id', targetSongId).order('order_index').limit(1)
    if (data?.length) navigate(`/show/${showId}/song/${targetSongId}/moment/${data[0].id}`)
  }

  async function createMoment(title, cloneFrom, selectedOtherMomentId, mode, templateId = '') {
    if (!title.trim()) return null
    const { data: newMom, error } = await supabase.from('moments')
      .insert({ song_id: songId, title: title.trim(), subtitle: '', order_index: moments.length, grid_mode: mode })
      .select().single()
    if (error || !newMom) return null
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
    momentSoloists, setMomentSoloists,
    editMomentTitle, setEditMomentTitle, editMomentSubtitle, setEditMomentSubtitle,
    applyPlacements, handleMemberUpdate, handleMemberSetActive, handleMemberDelete,
    saveMomentMeta, saveSoloists, handleDeleteMoment, navigateToSong, createMoment,
  }
}
