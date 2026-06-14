import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Music, Users, Clapperboard, BookOpen, Shield, CalendarDays,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, ChevronDown, LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import { ICON } from '../lib/ui.js'

// Build the permission-gated list of primary nav items.
function useNavItems() {
  const { role, permissions, isSimulating } = useAuth()
  const isAdmin = role === 'admin' || role === 'director'
  const effectiveAdmin = isAdmin && !isSimulating
  const items = []
  items.push({ to: '/', label: 'Inici', Icon: LayoutDashboard })
  if (effectiveAdmin || permissions?.repertoire?.view)
    items.push({ to: '/songs', label: 'Cançons', Icon: BookOpen })
  items.push({ to: '/shows', label: 'Espectacles', Icon: Clapperboard })
  items.push({ to: '/assistencia', label: 'Assistència', Icon: CalendarDays })
  if (effectiveAdmin || permissions?.members?.view)
    items.push({ to: '/members', label: 'Persones', Icon: Users })
  if (effectiveAdmin)
    items.push({ to: '/admin', label: 'Admin', Icon: Shield })
  return items
}

const ACTIVE = 'bg-cyan-700/40 text-cyan-300'
const IDLE = 'text-muted hover:text-body hover:bg-fill'

export default function SideNav({ onSignOut }) {
  const items = useNavItems()
  const location = useLocation()
  const isActive = (to) => location.pathname === to

  return (
    <>
      <DesktopRail items={items} isActive={isActive} onSignOut={onSignOut} />
      <MobileBar items={items} isActive={isActive} />
    </>
  )
}

function DesktopRail({ items, isActive, onSignOut }) {
  const { choirs, currentChoirId, switchChoir } = useChoir()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem('navExpanded') === 'true'
  )
  function toggleExpanded() {
    setExpanded(v => { localStorage.setItem('navExpanded', String(!v)); return !v })
  }

  return (
    <aside className={`hidden md:flex flex-col shrink-0 bg-pane border-r border-rim transition-[width] duration-200 ${expanded ? 'w-52' : 'w-16'}`}>
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 h-14 px-4 text-body hover:text-soft shrink-0 overflow-hidden">
        <Music size={ICON.lg} className="shrink-0" />
        {expanded && <span className="font-bold tracking-tight truncate">Choreo</span>}
      </Link>

      {/* Choir selector (expanded only) */}
      {expanded && choirs.length > 1 && (
        <div className="relative px-3 pb-2">
          <select
            value={currentChoirId ?? ''}
            onChange={e => { switchChoir(e.target.value); navigate('/') }}
            className="appearance-none w-full bg-fill border border-line rounded-lg pl-3 pr-7 py-1.5 text-xs text-soft focus:outline-none focus:border-cyan-500 cursor-pointer">
            {choirs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={ICON.xs} className="absolute right-5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            title={expanded ? undefined : label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive(to) ? ACTIVE : IDLE}`}
          >
            <Icon size={ICON.md} className="shrink-0" />
            {expanded && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer: theme · profile · collapse toggle */}
      <div className="shrink-0 border-t border-rim p-2 flex flex-col gap-1">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clar' : 'Mode fosc'}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${IDLE}`}
        >
          {theme === 'dark' ? <Sun size={ICON.md} /> : <Moon size={ICON.md} />}
          {expanded && <span>{theme === 'dark' ? 'Mode clar' : 'Mode fosc'}</span>}
        </button>
        <div className="px-1"><ProfileMenu onSignOut={onSignOut} /></div>
        <button
          onClick={toggleExpanded}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${IDLE}`}
          title={expanded ? 'Col·lapsar' : 'Expandir'}
        >
          {expanded ? <PanelLeftClose size={ICON.md} /> : <PanelLeftOpen size={ICON.md} />}
          {expanded && <span>Col·lapsar</span>}
        </button>
      </div>
    </aside>
  )
}

function MobileBar({ items, isActive }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-pane border-t border-rim flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
      {items.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] ${isActive(to) ? 'text-cyan-400' : 'text-muted'}`}
        >
          <Icon size={ICON.lg} />
          <span className="truncate max-w-full px-1">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
