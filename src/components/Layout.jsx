import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Music, Users, Clapperboard, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Layout({ children, fullWidth = false }) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between relative">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white hover:text-gray-300">
          <Music size={18} /> Choir Positions
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Clapperboard size={14} /> Espectacles
            </Link>
            <Link to="/members"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${location.pathname === '/members' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Users size={14} /> Persones
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {/* Desktop user info */}
          {user && (
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-400 text-xs truncate max-w-[140px]">{user.email}</span>
              <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs uppercase tracking-wide">
                {role}
              </span>
              <button onClick={handleSignOut} className="text-gray-400 hover:text-white transition-colors">
                Sortir
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button onClick={() => setNavOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {user && navOpen && (
          <div className="absolute top-full left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 shadow-xl md:hidden"
            onClick={() => setNavOpen(false)}>
            <nav className="flex flex-col p-3 gap-1">
              <Link to="/"
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${location.pathname === '/' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Clapperboard size={16} /> Espectacles
              </Link>
              <Link to="/members"
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${location.pathname === '/members' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Users size={16} /> Persones
              </Link>
            </nav>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-sm">
              <span className="text-gray-400 text-xs truncate">{user.email}</span>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs uppercase tracking-wide">{role}</span>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-white transition-colors">Sortir</button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className={fullWidth ? 'flex-1 flex flex-col min-h-0' : 'flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full'}>
        {children}
      </main>
    </div>
  )
}
