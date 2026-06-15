import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAddMomentForm({ moments, songId, showId, mode, createMoment: _createMoment, navigate }) {
  const [addingMoment, setAddingMoment] = useState(false)
  const [newMomentTitle, setNewMomentTitle] = useState('')
  const [cloneFrom, setCloneFrom] = useState('')
  const [otherSongs, setOtherSongs] = useState(null)
  const [otherSongMoments, setOtherSongMoments] = useState({})
  const [selectedOtherSongId, setSelectedOtherSongId] = useState('')
  const [selectedOtherMomentId, setSelectedOtherMomentId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

  function openAddMoment() {
    setNewMomentTitle(`Moment ${moments.length + 1}`)
    setCloneFrom(''); setSelectedOtherSongId(''); setSelectedOtherMomentId(''); setSelectedTemplate('')
    setAddingMoment(true)
  }

  async function handleCloneFromChange(val) {
    setCloneFrom(val)
    if (val === 'other' && otherSongs === null) {
      const { data: songs } = await supabase.from('songs').select('*').eq('show_id', showId).order('order_index')
      const songIds = (songs ?? []).map(s => s.id)
      const { data: moms } = songIds.length
        ? await supabase.from('moments').select('*').in('song_id', songIds).order('order_index')
        : { data: [] }
      const grouped = {}
      for (const m of (moms ?? [])) (grouped[m.song_id] ??= []).push(m)
      setOtherSongs((songs ?? []).filter(s => s.id !== songId))
      setOtherSongMoments(grouped)
    }
  }

  async function createMoment() {
    const newMom = await _createMoment(newMomentTitle, cloneFrom, selectedOtherMomentId, mode, selectedTemplate)
    if (newMom) { setAddingMoment(false); navigate(`/show/${showId}/song/${songId}/moment/${newMom.id}`) }
  }

  return {
    addingMoment, setAddingMoment,
    newMomentTitle, setNewMomentTitle,
    cloneFrom, otherSongs, otherSongMoments,
    selectedOtherSongId, setSelectedOtherSongId,
    selectedOtherMomentId, setSelectedOtherMomentId,
    selectedTemplate, setSelectedTemplate,
    openAddMoment, handleCloneFromChange, createMoment,
  }
}
