import { createClient } from '@supabase/supabase-js'
import { DEV_SESSION, devSupabase } from './devDb'

const isEnvDev = import.meta.env.VITE_DEV_MODE === 'true'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasRealSupabaseConfig =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  supabaseAnonKey !== 'YOUR_ANON_KEY'
const isDev = isEnvDev || !hasRealSupabaseConfig
const DEMO_AUTH_KEY = 'choreo_auth_mode'
const DEMO_AUTH_VALUE = 'demo'

const defaultSupabase = isDev
  ? devSupabase
  : createClient(
      supabaseUrl,
      supabaseAnonKey
    )

const demoAuthListeners = new Set()

function canUseLocalStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function isDemoMode() {
  return canUseLocalStorage() && window.localStorage.getItem(DEMO_AUTH_KEY) === DEMO_AUTH_VALUE
}

function setDemoMode(enabled) {
  if (!canUseLocalStorage()) return
  if (enabled) window.localStorage.setItem(DEMO_AUTH_KEY, DEMO_AUTH_VALUE)
  else window.localStorage.removeItem(DEMO_AUTH_KEY)
}

function notifyDemoAuth(event, session) {
  demoAuthListeners.forEach(listener => listener(event, session))
}

function getActiveSupabase() {
  return isDemoMode() ? devSupabase : defaultSupabase
}

function clearDemoMode() {
  const wasDemo = isDemoMode()
  setDemoMode(false)
  if (wasDemo) notifyDemoAuth('SIGNED_OUT', null)
}

const auth = {
  getSession() {
    return getActiveSupabase().auth.getSession()
  },
  onAuthStateChange(callback) {
    if (defaultSupabase === devSupabase) {
      return devSupabase.auth.onAuthStateChange(callback)
    }

    demoAuthListeners.add(callback)
    const { data } = defaultSupabase.auth.onAuthStateChange((event, session) => {
      if (!isDemoMode()) callback(event, session)
    })

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            demoAuthListeners.delete(callback)
            data.subscription.unsubscribe()
          },
        },
      },
    }
  },
  async signInWithPassword(credentials) {
    if (credentials?.email === 'demo' && credentials?.password === 'demo') {
      setDemoMode(true)
      notifyDemoAuth('SIGNED_IN', DEV_SESSION)
      return { data: { session: DEV_SESSION }, error: null }
    }

    clearDemoMode()
    return defaultSupabase.auth.signInWithPassword(credentials)
  },
  async signInWithOAuth(options) {
    clearDemoMode()
    return defaultSupabase.auth.signInWithOAuth(options)
  },
  async signOut() {
    if (isDemoMode()) {
      clearDemoMode()
      return { error: null }
    }
    return defaultSupabase.auth.signOut()
  },
  getUser() {
    return getActiveSupabase().auth.getUser()
  },
}

const storage = new Proxy({}, {
  get(_target, key) {
    const activeStorage = getActiveSupabase().storage
    const value = activeStorage?.[key]
    return typeof value === 'function' ? value.bind(activeStorage) : value
  },
})

export const supabase = {
  from(...args) {
    return getActiveSupabase().from(...args)
  },
  auth,
  storage,
}
