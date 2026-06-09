import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Music, Users, Clapperboard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Layout({ children, fullWidth = false }) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white hover:text-gray-300">
          <Music size={18} /> Choir Positions
        </Link>
        {user && (
          <nav className="flex items-center gap-1 text-sm">
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
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">{user.email}</span>
            <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs uppercase tracking-wide">
              {role}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sortir
            </button>
          </div>
        )}
      </header>
      <main className={fullWidth ? 'flex-1 flex flex-col min-h-0' : 'flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full'}>
        {children}
      </main>
    </div>
  )
}
