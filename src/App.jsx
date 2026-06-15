import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { ChoirProvider } from './hooks/useChoir.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { ConfirmHost } from './components/ui/ConfirmDialog'
import { ToastHost } from './components/ui/Toast'
import { GlobalSearchModal, useGlobalSearch } from './components/GlobalSearch'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
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
import Attendance from './pages/Attendance'
import Analytics from './pages/Analytics'
import FeedbackAdmin from './pages/FeedbackAdmin'

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

// Gate a route by a permission section. Falls back to RequireAuth's session
// check, then redirects users without `view` on the section back home.
function RequireSection({ section, children }) {
  const { session, loading, can } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <span className="text-faint text-sm">Carregant...</span>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  if (!can(section, 'view')) return <Navigate to="/" replace />
  return children
}

function GlobalSearchHost() {
  const { open, setOpen } = useGlobalSearch()
  if (!open) return null
  return <GlobalSearchModal onClose={() => setOpen(false)} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/shows" element={<RequireSection section="shows"><Shows /></RequireSection>} />
      <Route path="/show/:id" element={<RequireSection section="shows"><Setlist /></RequireSection>} />
      <Route path="/members" element={<RequireSection section="members"><Members /></RequireSection>} />
      <Route path="/show/:id/song/:sid/moment/:mid" element={<RequireSection section="staging"><Editor /></RequireSection>} />
      <Route path="/show/:id/mics" element={<RequireSection section="mics"><Mics /></RequireSection>} />
      <Route path="/show/:id/llums" element={<RequireSection section="lights"><Lights /></RequireSection>} />
      <Route path="/show/:id/rider" element={<RequireSection section="rider"><Rider /></RequireSection>} />
      <Route path="/show/:id/poster" element={<RequireSection section="shows"><Poster /></RequireSection>} />
      <Route path="/show/:id/assaig" element={<RequireSection section="shows"><Rehearsal /></RequireSection>} />
      <Route path="/assistencia" element={<RequireSection section="attendance"><Attendance /></RequireSection>} />
      <Route path="/songs" element={<RequireSection section="repertoire"><Songs /></RequireSection>} />
      <Route path="/admin" element={<RequireSection section="users"><Admin /></RequireSection>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route path="/feedback" element={<RequireAuth><FeedbackAdmin /></RequireAuth>} />
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
          <ToastHost />
          <GlobalSearchHost />
          <OfflineBanner />
        </ChoirProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
