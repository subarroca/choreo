import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useClickOutside } from '../hooks/useClickOutside.js'
import { ListOrdered, ImageIcon, MicVocal, Lightbulb, FileText, ChevronDown, PlayCircle, ChevronLeft } from 'lucide-react'
import { ACCENT } from '../lib/ui.js'
import { useAuth } from '../hooks/useAuth.jsx'

const TAB_IDLE = 'text-muted hover:text-body hover:bg-fill'

// `section` gates visibility per role via can(section,'view').
const MAIN_TABS = [
  { key: 'setlist', path: '',        label: 'Escaleta', icon: ListOrdered, section: 'shows'  },
  { key: 'assaig',  path: '/assaig', label: 'Assaig',   icon: PlayCircle,  section: 'shows'  },
  { key: 'llums',   path: '/llums',  label: 'Llums',    icon: Lightbulb,   section: 'lights' },
  { key: 'poster',  path: '/poster', label: 'Pòster',   icon: ImageIcon,   section: 'shows'  },
]

const RIDER_TABS = [
  { key: 'mics',  path: '/mics',  label: 'Micros',   icon: MicVocal, section: 'mics'  },
  { key: 'rider', path: '/rider', label: 'Document', icon: FileText, section: 'rider' },
]

export default function ShowToolbar({ showId, showName }) {
  const { pathname } = useLocation()
  const { can } = useAuth()
  const base = `/show/${showId}`
  const [riderOpen, setRiderOpen] = useState(false)
  const riderRef = useClickOutside(() => setRiderOpen(false))

  const mainTabs = MAIN_TABS.filter(t => can(t.section, 'view'))
  const riderTabs = RIDER_TABS.filter(t => can(t.section, 'view'))
  const isRiderActive = riderTabs.some(t => pathname.startsWith(base + t.path))

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-pane border-b border-rim shrink-0">
      <Link to="/shows" className="flex items-center justify-center w-8 h-8 rounded-lg text-faint hover:text-body hover:bg-fill transition-colors shrink-0">
        <ChevronLeft size={16} />
      </Link>
      <nav className="flex items-center gap-1.5 text-sm text-faint min-w-0 mr-1 shrink-0">
        <Link to="/" className="hover:text-soft">Espectacles</Link>
        <span>/</span>
        <Link to={base} className="hover:text-soft truncate max-w-[160px]">{showName ?? '…'}</Link>
      </nav>

      {/* Scrollable tabs — Rider is outside so its dropdown isn't clipped */}
      <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
        {mainTabs.map(tab => {
          const to = base + tab.path
          const active = tab.path === ''
            ? pathname === base || pathname === base + '/'
            : pathname.startsWith(to)
          const Icon = tab.icon
          return (
            <Link key={tab.key} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                active ? ACCENT.activeNav : TAB_IDLE
              }`}>
              <Icon size={13} />
              {tab.label}
            </Link>
          )
        })}

      </div>

      {/* Rider dropdown — outside overflow-x-auto so the popover isn't clipped */}
      {riderTabs.length > 0 && (
      <div className="relative shrink-0" ref={riderRef}>
        <button
          onClick={() => setRiderOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
            isRiderActive ? ACCENT.activeNav : TAB_IDLE
          }`}
        >
          <FileText size={13} />
          Rider
          <ChevronDown size={11} className={`transition-transform ${riderOpen ? 'rotate-180' : ''}`} />
        </button>

        {riderOpen && (
          <div className="absolute right-0 top-full mt-1 bg-pane border border-line rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
            {riderTabs.map(tab => {
              const to = base + tab.path
              const active = pathname.startsWith(to)
              const Icon = tab.icon
              return (
                <Link key={tab.key} to={to}
                  onClick={() => setRiderOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs whitespace-nowrap transition-colors ${
                    active ? ACCENT.activeNav : TAB_IDLE
                  }`}>
                  <Icon size={13} />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
