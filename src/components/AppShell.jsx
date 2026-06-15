import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import SideNav from './SideNav.jsx'
import FeedbackButton from './FeedbackButton.jsx'

/**
 * App shell — fixed-height, no document-body scroll.
 * Left rail (desktop) / bottom bar (mobile) + a content column whose children
 * own their internal scrolling (see PageContainer).
 *
 * Props:
 *   chrome=false → render only the content column (e.g. full-bleed work views
 *                  that provide their own context navigation).
 */
export default function AppShell({ children, chrome = true }) {
  const { user, isSimulating, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={`h-[100dvh] flex overflow-hidden bg-page text-body ${isSimulating ? 'ring-2 ring-inset ring-amber-500/50' : ''}`}>
      {chrome && user && <SideNav onSignOut={handleSignOut} />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      {chrome && user && <FeedbackButton />}
    </div>
  )
}
