import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ChoirContext = createContext(null)

export function ChoirProvider({ children }) {
  const [choirs, setChoirs] = useState([])
  const [currentChoirId, setCurrentChoirId] = useState(
    () => localStorage.getItem('currentChoirId') || null
  )

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('choirs').select('*').order('name')
      const list = data ?? []
      setChoirs(list)
      if (list.length && !list.find(c => c.id === currentChoirId)) {
        const preferred = list.find(c => c.name === 'Cor del Condal') ?? list[0]
        setCurrentChoirId(preferred.id)
        localStorage.setItem('currentChoirId', preferred.id)
      }
    }
    load()
  }, [])

  function switchChoir(id) {
    setCurrentChoirId(id)
    localStorage.setItem('currentChoirId', id)
  }

  return (
    <ChoirContext.Provider value={{ choirs, currentChoirId, switchChoir }}>
      {children}
    </ChoirContext.Provider>
  )
}

export function useChoir() {
  return useContext(ChoirContext)
}
