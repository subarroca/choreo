// Central mutation helper: optimistic local update + persist + rollback on error.
//
// Replaces the scattered pattern where ~80% of async DB operations mutated
// React state and silently ignored Supabase errors. Every mutation that touches
// the DB should flow through here so failures surface a toast and the optimistic
// state is reverted.
//
//   const ok = await runMutation({
//     optimistic: () => setMembers(prev => prev.map(...)),   // apply locally first
//     persist:    () => supabase.from('members').update(...).eq('id', id),
//     rollback:   () => setMembers(prevSnapshot),            // revert on failure
//     errorMsg:   'Error en desar la persona',
//   })
//
// `persist` may return a Supabase result ({ error }) or throw. Either is treated
// as failure. Returns true on success, false on failure.

import { toast } from '../components/ui/Toast'

export async function runMutation({ optimistic, persist, rollback, errorMsg, successMsg }) {
  if (optimistic) optimistic()
  try {
    const res = await persist()
    if (res && res.error) throw res.error
    if (successMsg) toast.success(successMsg)
    return true
  } catch (err) {
    if (rollback) rollback()
    toast.error(errorMsg || 'No s’ha pogut desar el canvi')
    if (import.meta.env.DEV) console.error('[runMutation]', errorMsg, err)
    return false
  }
}
