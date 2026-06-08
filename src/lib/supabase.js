import { createClient } from '@supabase/supabase-js'
import { devSupabase } from './devDb'

const isDev = import.meta.env.VITE_DEV_MODE === 'true'

export const supabase = isDev
  ? devSupabase
  : createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
