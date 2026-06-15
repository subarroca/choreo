import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth.jsx'

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true'

export default function useFeedback() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (IS_DEV) {
        // QB doesn't support joins — fetch separately and merge
        const { data: feedbackRows } = await supabase.from('feedback').select()
        const { data: profiles } = await supabase.from('profiles').select()
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
        const merged = (feedbackRows ?? [])
          .map(f => ({ ...f, profile: profileMap[f.user_id] ?? null }))
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
        setItems(merged)
      } else {
        const { data } = await supabase
          .from('feedback')
          .select('*, profile:user_id(full_name, email)')
          .order('created_at', { ascending: false })
        setItems(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function resolve(id) {
    const now = new Date().toISOString()
    setItems(prev => prev.map(f =>
      f.id === id ? { ...f, resolved: true, resolved_at: now } : f
    ))
    await supabase.from('feedback').update({
      resolved: true,
      resolved_at: now,
      resolved_by: user?.id ?? null,
    }).eq('id', id)
  }

  async function unresolve(id) {
    setItems(prev => prev.map(f =>
      f.id === id ? { ...f, resolved: false, resolved_at: null } : f
    ))
    await supabase.from('feedback').update({
      resolved: false,
      resolved_at: null,
      resolved_by: null,
    }).eq('id', id)
  }

  const pendingCount = items.filter(f => !f.resolved).length

  return { items, loading, resolve, unresolve, pendingCount, refetch: load }
}
