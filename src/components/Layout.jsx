import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Layout({ children, fullWidth = false }) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight text-white hover:text-gray-300">
          🎵 Choir Positions
        </Link>
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
