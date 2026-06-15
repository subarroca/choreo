import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth.jsx'

export function useMyMember() {
  const { profile } = useAuth()
  const [member, setMember] = useState(null)

  useEffect(() => {
    if (!profile?.email) return
    supabase.from('members')
      .select('id, first_name, last_name, voice')
      .eq('google_account', profile.email)
      .eq('active', true)
      .then(({ data }) => { if (data?.[0]) setMember(data[0]) })
  }, [profile?.email])

  return member
}
