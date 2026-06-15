import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useClickOutside } from '../hooks/useClickOutside.js'
import {
  Music, Music2, Users, Clapperboard, Home, Shield, CalendarDays, BarChart3, Search,
  PanelLeftClose, PanelLeftOpen, MessageSquarePlus,
} from '../lib/icons'
import { useGlobalSearch } from './GlobalSearch'
import { useAuth } from '../hooks/useAuth.jsx'
import useFeedback from '../hooks/useFeedback.js'
import ProfileMenu from './ProfileMenu.jsx'
import { ICON } from '../lib/ui.js'

function useNavItems() {
  const { can, isPrivileged } = useAuth()
  const { pendingCount } = useFeedback()
  const items = []
  items.push({ to: '/', label: 'Inici', Icon: Home })
  if (can('repertoire', 'view'))
    items.push({ to: '/songs', label: 'Cançons', Icon: Music2 })
  if (can('shows', 'view'))
    items.push({ to: '/shows', label: 'Espectacles', Icon: Clapperboard })
  if (can('attendance', 'view'))
    items.push({ to: '/assistencia', label: 'Assajos', Icon: CalendarDays })
  if (can('members', 'view'))
    items.push({ to: '/members', label: 'Persones', Icon: Users })
  if (isPrivileged)
    items.push({ to: '/analytics', label: 'Analítica', Icon: BarChart3 })
  if (can('users', 'view'))
    items.push({ to: '/admin', label: 'Admin', Icon: Shield })
  if (isPrivileged)
    items.push({ to: '/feedback', label: 'Feedback', Icon: MessageSquarePlus, badge: pendingCount || null })
  return items
}

const ACTIVE = 'bg-cyan-100 text-cyan-700 dark:bg-cyan-700/40 dark:text-cyan-300'
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
  const { setOpen: openSearch } = useGlobalSearch()
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem('navExpanded') === 'true'
  )

  function toggleExpanded() {
    setExpanded(v => { localStorage.setItem('navExpanded', String(!v)); return !v })
  }

  const itemCls = (active) =>
    `flex items-center rounded-lg text-sm transition-colors h-10 ${
      expanded ? 'gap-3 px-3 w-full' : 'justify-center w-10 mx-auto'
    } ${active ? ACTIVE : IDLE}`

  return (
    <aside className={`hidden md:flex flex-col shrink-0 border-r transition-[width] duration-200 bg-pane border-rim ${expanded ? 'w-52' : 'w-16'}`}>

      {/* Brand */}
      <Link to="/" className={`flex items-center h-14 text-body hover:text-soft shrink-0 overflow-hidden ${expanded ? 'px-4' : 'justify-center'}`}>
        <Music size={ICON.lg} className="shrink-0" />
        {expanded && <span className="ml-3 font-bold tracking-tight truncate">Choreo</span>}
      </Link>

      {/* Nav links */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        <button onClick={() => openSearch(true)} title={expanded ? undefined : 'Cerca (⌘K)'}
          className={itemCls(false) + ' group'}>
          <Search size={ICON.md} className="shrink-0" />
          {expanded && (
            <span className="flex-1 text-left truncate">Cerca</span>
          )}
          {expanded && <kbd className="text-[9px] text-ghost border border-rim rounded px-1 py-0.5 font-mono opacity-0 group-hover:opacity-100 transition-opacity">⌘K</kbd>}
        </button>
        {items.map(({ to, label, Icon, badge }) => (
          <Link key={to} to={to} title={expanded ? undefined : label} className={itemCls(isActive(to))}>
            <span className="relative shrink-0">
              <Icon size={ICON.md} />
              {badge && !expanded && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold px-0.5">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            {expanded && <span className="truncate flex-1">{label}</span>}
            {expanded && badge ? (
              <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-800 rounded px-1.5 py-0.5 font-medium shrink-0">
                {badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-rim px-2 py-2 flex flex-col gap-1">
        <div className={expanded ? 'px-1' : 'flex justify-center'}>
          <ProfileMenu onSignOut={onSignOut} expanded={expanded} />
        </div>
        <button onClick={toggleExpanded} title={expanded ? 'Col·lapsar' : 'Expandir'} className={itemCls(false)}>
          {expanded ? <PanelLeftClose size={ICON.md} className="shrink-0" /> : <PanelLeftOpen size={ICON.md} className="shrink-0" />}
          {expanded && <span>Col·lapsar</span>}
        </button>
      </div>
    </aside>
  )
}

function MobileBar({ items, isActive }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] bg-pane border-rim">
      {items.map(({ to, label, Icon, badge }) => (
        <Link
          key={to}
          to={to}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] ${isActive(to) ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted'}`}
        >
          <span className="relative">
            <Icon size={ICON.lg} />
            {badge && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold px-0.5">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span className="truncate max-w-full px-1">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
