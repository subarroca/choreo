import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { defaultPermissions, derivePersona } from '../lib/roles.js'
import { toast } from '../components/ui/Toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]               = useState(undefined)
  const [profile, setProfile]               = useState(null)
  const [permissions, setPermissions]       = useState(null)
  const [simulatedPermissions, setSimulatedPermissions] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setPermissions(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data: prof, error: profError } = await supabase
      .from('profiles').select('*').eq('id', userId).single()

    if (profError) {
      // Surface the error: permissions fall back to 'member' defaults safely,
      // but the user should know something went wrong.
      toast.error('No s\'ha pogut carregar el perfil d\'usuari')
      setPermissions(defaultPermissions('member'))
      return
    }

    setProfile(prof)
    const role = prof?.role ?? 'member'

    // Admins/directors: full permissions, skip DB lookup
    if (role === 'admin' || role === 'director') {
      setPermissions(defaultPermissions(role))
      return
    }

    // Load per-section permissions from DB
    const { data: perms } = await supabase
      .from('user_permissions').select('*').eq('user_id', userId)

    const base = defaultPermissions(role)
    if (perms?.length) {
      perms.forEach(p => {
        if (base[p.section]) {
          base[p.section] = { view: p.can_view, edit: p.can_edit }
        }
      })
    }
    setPermissions(base)
  }

  const role = profile?.role ?? session?.user?.user_metadata?.role ?? 'member'
  const isSimulating = simulatedPermissions !== null

  const effectivePermissions = simulatedPermissions ?? permissions ?? defaultPermissions(role)

  // admin/director bypass everything — unless they're actively simulating a
  // lower role, in which case the simulated permission map governs.
  const isPrivileged = (role === 'admin' || role === 'director') && !isSimulating

  // Single gating helper used across the whole app. `mode` is 'view' | 'edit'.
  function can(section, mode = 'view') {
    if (isPrivileged) return true
    return !!effectivePermissions?.[section]?.[mode]
  }

  // Which landing/dashboard + nav shape this user gets.
  const persona = isSimulating
    ? derivePersona('member', effectivePermissions)
    : derivePersona(role, effectivePermissions)

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    permissions: effectivePermissions,
    can,
    persona,
    isPrivileged,
    voiceSections: profile?.voice_sections ?? [],
    simulatedPermissions,
    setSimulatedPermissions,
    isSimulating,
    exitSimulation: () => setSimulatedPermissions(null),
    loading: session === undefined,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
