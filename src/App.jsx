import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ChoirProvider } from './hooks/useChoir.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { ConfirmHost } from './components/ui/ConfirmDialog'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Shows from './pages/Shows'
import Setlist from './pages/Setlist'
import Members from './pages/Members'
import Editor from './pages/Editor'
import Mics from './pages/Mics'
import Songs from './pages/Songs'
import Admin from './pages/Admin'
import Lights from './pages/Lights'
import Rider from './pages/Rider'
import Poster from './pages/Poster'
import Rehearsal from './pages/Rehearsal'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <span className="text-faint text-sm">Carregant...</span>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Shows /></RequireAuth>} />
      <Route path="/show/:id" element={<RequireAuth><Setlist /></RequireAuth>} />
      <Route path="/members" element={<RequireAuth><Members /></RequireAuth>} />
      <Route path="/show/:id/song/:sid/moment/:mid" element={<RequireAuth><Editor /></RequireAuth>} />
      <Route path="/show/:id/mics" element={<RequireAuth><Mics /></RequireAuth>} />
      <Route path="/show/:id/llums" element={<RequireAuth><Lights /></RequireAuth>} />
      <Route path="/show/:id/rider" element={<RequireAuth><Rider /></RequireAuth>} />
      <Route path="/show/:id/poster" element={<RequireAuth><Poster /></RequireAuth>} />
      <Route path="/show/:id/assaig" element={<RequireAuth><Rehearsal /></RequireAuth>} />
      <Route path="/songs" element={<RequireAuth><Songs /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChoirProvider>
          <AppRoutes />
          <ConfirmHost />
          <OfflineBanner />
        </ChoirProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
