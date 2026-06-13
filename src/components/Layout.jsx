import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Music, Users, Clapperboard, Menu, X, BookOpen, Shield, ChevronDown, Sun, Moon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import ProfileMenu from './ProfileMenu.jsx'

export default function Layout({ children, fullWidth = false, narrow = false }) {
  const { user, role, permissions, isSimulating, signOut } = useAuth()
  const { choirs, currentChoirId, switchChoir } = useChoir()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const currentChoir = choirs.find(c => c.id === currentChoirId)

  const isAdmin = role === 'admin' || role === 'director'
  // Durant simulació, els permisos de navegació venen de permissions (ja sobreescrits)
  const effectiveAdmin  = isAdmin && !isSimulating
  const canViewMembers    = effectiveAdmin || permissions?.members?.view
  const canViewRepertoire = effectiveAdmin || permissions?.repertoire?.view

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const navLinkCls = (path) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
      location.pathname === path
        ? 'bg-cyan-700/40 text-cyan-300'
        : 'text-muted hover:text-body hover:bg-fill'
    }`

  const mobileNavLinkCls = (path) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${
      location.pathname === path
        ? 'bg-cyan-700/40 text-cyan-300'
        : 'text-muted hover:text-body hover:bg-fill'
    }`

  return (
    <div className="min-h-screen bg-page text-body flex flex-col overflow-x-hidden">
      <header className={`border-b px-4 py-3 flex items-center justify-between relative transition-colors ${
        isSimulating ? 'bg-amber-950 border-amber-800/60' : 'bg-pane border-rim'
      }`}>
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-body hover:text-soft">
          <Music size={18} /> Choreo
        </Link>

        {/* Choir selector */}
        {user && choirs.length > 1 && (
          <div className="relative hidden md:block">
            <select
              value={currentChoirId ?? ''}
              onChange={e => { switchChoir(e.target.value); navigate('/') }}
              className="appearance-none bg-fill border border-line rounded-lg pl-3 pr-7 py-1.5 text-xs text-soft focus:outline-none focus:border-cyan-400 cursor-pointer">
              {choirs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>
        )}

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {canViewRepertoire && (
              <Link to="/songs" className={navLinkCls('/songs')}>
                <BookOpen size={14} /> Cançons
              </Link>
            )}
            <Link to="/" className={navLinkCls('/')}>
              <Clapperboard size={14} /> Espectacles
            </Link>
            {canViewMembers && (
              <Link to="/members" className={navLinkCls('/members')}>
                <Users size={14} /> Persones
              </Link>
            )}
            {effectiveAdmin && (
              <Link to="/admin" className={navLinkCls('/admin')}>
                <Shield size={14} /> Admin
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Mode clar' : 'Mode fosc'}
            className="p-2 rounded-lg text-muted hover:text-body hover:bg-fill transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && <ProfileMenu onSignOut={handleSignOut} />}
          {user && (
            <button
              onClick={() => setNavOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-muted hover:text-body hover:bg-fill transition-colors"
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Mobile nav dropdown */}
        {user && navOpen && (
          <div
            className="absolute top-full left-0 right-0 z-40 bg-pane border-b border-rim shadow-xl md:hidden"
            onClick={() => setNavOpen(false)}
          >
            <nav className="flex flex-col p-3 gap-1">
              {canViewRepertoire && (
                <Link to="/songs" className={mobileNavLinkCls('/songs')}>
                  <BookOpen size={16} /> Repertori
                </Link>
              )}
              <Link to="/" className={mobileNavLinkCls('/')}>
                <Clapperboard size={16} /> Espectacles
              </Link>
              {canViewMembers && (
                <Link to="/members" className={mobileNavLinkCls('/members')}>
                  <Users size={16} /> Persones
                </Link>
              )}
              {effectiveAdmin && (
                <Link to="/admin" className={mobileNavLinkCls('/admin')}>
                  <Shield size={16} /> Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className={
        fullWidth ? 'flex-1 flex flex-col min-h-0'
        : narrow   ? 'flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full'
        :             'flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full'
      }>
        {children}
      </main>
    </div>
  )
}
