import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

function resolveTheme(theme) {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return theme
}

function applyTheme(resolved) {
  if (resolved === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    localStorage.setItem('theme', theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e) => applyTheme(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  // Cycle: dark → light → system → dark
  function cycle() {
    setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'system' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
