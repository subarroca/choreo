import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { confirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { formatDate } from '../lib/formatters'
import { t } from '../locales/ca'

const STATUS_CYCLE = ['present', 'absent', 'excused']

function serializeRehearsalMeta(type, time, location, freeNotes) {
  const hasExtra = type || time || location
  if (!hasExtra) return freeNotes || null
  return JSON.stringify({ type: type || '', time: time || '', location: location || '', notes: freeNotes || '' })
}

export function useRehearsalData() {
  const [members, setMembers] = useState([])
  const [rehearsals, setRehearsals] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [membersRes, rehearsalsRes, scheduleRes] = await Promise.all([
        supabase.from('members').select('*').eq('active', true).order('last_name').order('first_name'),
        supabase.from('rehearsals').select('*').order('date'),
        supabase.from('rehearsal_schedule').select('*'),
      ])
      setMembers(membersRes.data ?? [])
      const reh = rehearsalsRes.data ?? []
      setRehearsals(reh)
      if (reh.length) setSelectedId(reh[reh.length - 1].id)
      setSchedule((scheduleRes.data ?? [])[0] ?? null)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedId) { setAttendance({}); return }
    supabase.from('attendance')
      .select('member_id, status, reason')
      .eq('rehearsal_id', selectedId)
      .then(({ data }) => {
        const map = {}
        for (const r of (data ?? [])) map[r.member_id] = { status: r.status, reason: r.reason ?? '' }
        setAttendance(map)
      })
  }, [selectedId])

  const loadSummary = useCallback(async () => {
    const { data } = await supabase.from('attendance').select('rehearsal_id, member_id, status, reason')
    const byMember = {}
    for (const r of (data ?? [])) {
      if (!byMember[r.member_id]) byMember[r.member_id] = {}
      byMember[r.member_id][r.rehearsal_id] = { status: r.status, reason: r.reason }
    }
    setSummaryData(byMember)
  }, [])

  async function addRehearsal(date, type, time, location, notes) {
    const notesStr = serializeRehearsalMeta(type, time, location, notes)
    const { data } = await supabase.from('rehearsals').insert({ date, notes: notesStr }).select().single()
    if (data) {
      const updated = [...rehearsals, data].sort((a, b) => a.date < b.date ? -1 : 1)
      setRehearsals(updated)
      setSelectedId(data.id)
      toast(t.attendance.added)
    }
    return !!data
  }

  async function saveRehearsalMeta(id, type, time, location, notes) {
    const notesStr = serializeRehearsalMeta(type, time, location, notes)
    const { data } = await supabase.from('rehearsals').update({ notes: notesStr }).eq('id', id).select().single()
    if (data) { setRehearsals(prev => prev.map(r => r.id === data.id ? data : r)); toast(t.attendance.saved) }
    return data
  }

  async function deleteRehearsal(id) {
    const r = rehearsals.find(x => x.id === id)
    if (!(await confirmDialog(t.attendance.deleteConfirm(formatDate(r.date))))) return
    await supabase.from('attendance').delete().eq('rehearsal_id', id)
    await supabase.from('rehearsals').delete().eq('id', id)
    const newList = rehearsals.filter(x => x.id !== id)
    setRehearsals(newList)
    setSelectedId(newList.length ? newList[newList.length - 1].id : null)
    toast(t.attendance.deleted, 'warn')
  }

  async function toggleStatus(memberId) {
    if (!selectedId) return
    const current = attendance[memberId]?.status ?? 'present'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    const reason = next === 'present' ? '' : (attendance[memberId]?.reason ?? '')
    setAttendance(prev => ({ ...prev, [memberId]: { status: next, reason } }))
    setSaving(true)
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: memberId, status: next, reason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setSaving(false)
  }

  async function setReason(memberId, reason) {
    setAttendance(prev => ({ ...prev, [memberId]: { ...prev[memberId], reason } }))
    setSaving(true)
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: memberId, status: attendance[memberId]?.status ?? 'excused', reason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setSaving(false)
  }

  async function submitNotice(memberId, reason) {
    if (!memberId || !selectedId) return
    await supabase.from('attendance').upsert(
      { rehearsal_id: selectedId, member_id: memberId, status: 'excused', reason },
      { onConflict: 'rehearsal_id,member_id' }
    )
    setAttendance(prev => ({ ...prev, [memberId]: { status: 'excused', reason } }))
  }

  return {
    members, rehearsals, setRehearsals, schedule, setSchedule, selectedId, setSelectedId,
    attendance, loading, saving,
    summaryData, loadSummary,
    addRehearsal, saveRehearsalMeta, deleteRehearsal,
    toggleStatus, setReason, submitNotice,
  }
}
