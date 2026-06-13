import { createClient } from '@supabase/supabase-js'
import { devSupabase } from './devDb'

const isEnvDev = import.meta.env.VITE_DEV_MODE === 'true'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasRealSupabaseConfig =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  supabaseAnonKey !== 'YOUR_ANON_KEY'
const isDev = isEnvDev || !hasRealSupabaseConfig

export const supabase = isDev
  ? devSupabase
  : createClient(
      supabaseUrl,
      supabaseAnonKey
    )
