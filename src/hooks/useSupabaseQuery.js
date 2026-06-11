import { useState, useEffect, useCallback, useRef } from 'react'

// Generic async query hook for Supabase fetches.
//   const { data: shows = [], setData: setShows, loading, error, refetch } =
//     useSupabaseQuery(async () => {
//       const { data } = await supabase.from('shows').select('*')
//       return data ?? []
//     }, [])
// `setData` is exposed so CRUD handlers can update the list optimistically,
// matching the existing per-page mutation pattern.
export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fnRef = useRef(queryFn)
  fnRef.current = queryFn

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fnRef.current())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { refetch() }, [refetch])

  return { data, setData, loading, error, refetch }
}
