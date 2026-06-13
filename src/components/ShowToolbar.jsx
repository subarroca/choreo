import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ListOrdered, Users, ImageIcon, MicVocal, Lightbulb, FileText, ChevronDown, PlayCircle, CalendarDays } from 'lucide-react'

const MAIN_TABS = [
  { key: 'setlist',     path: '',              label: 'Escaleta',   icon: ListOrdered },
  { key: 'assaig',      path: '/assaig',       label: 'Assaig',     icon: PlayCircle  },
  { key: 'assistencia', path: '/assistencia',  label: 'Assistència', icon: CalendarDays },
  { key: 'poster',      path: '/poster',       label: 'Pòster',     icon: ImageIcon   },
]

const RIDER_TABS = [
  { key: 'mics',  path: '/mics',  label: 'Micros',    icon: MicVocal  },
  { key: 'llums', path: '/llums', label: 'Llums',     icon: Lightbulb },
  { key: 'rider', path: '/rider', label: 'Document',  icon: FileText  },
]

export default function ShowToolbar({ showId, showName }) {
  const { pathname } = useLocation()
  const base = `/show/${showId}`
  const [riderOpen, setRiderOpen] = useState(false)
  const riderRef = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (riderRef.current && !riderRef.current.contains(e.target)) setRiderOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const isRiderActive = RIDER_TABS.some(t => pathname.startsWith(base + t.path))

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-pane border-b border-rim shrink-0">
      <nav className="flex items-center gap-1.5 text-sm text-faint min-w-0 mr-1 shrink-0">
        <Link to="/" className="hover:text-soft">Espectacles</Link>
        <span>/</span>
        <Link to={base} className="hover:text-soft truncate max-w-[160px]">{showName ?? '…'}</Link>
      </nav>

      {/* Scrollable tabs — Rider is outside so its dropdown isn't clipped */}
      <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
        {MAIN_TABS.map(tab => {
          const to = base + tab.path
          const active = tab.path === ''
            ? pathname === base || pathname === base + '/'
            : pathname.startsWith(to)
          const Icon = tab.icon
          return (
            <Link key={tab.key} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                active ? 'bg-cyan-700/40 text-cyan-300' : 'text-muted hover:text-white hover:bg-fill'
              }`}>
              <Icon size={13} />
              {tab.label}
            </Link>
          )
        })}

        <Link to="/members"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors text-muted hover:text-body hover:bg-fill">
          <Users size={13} />
          Persones
        </Link>
      </div>

      {/* Rider dropdown — outside overflow-x-auto so the popover isn't clipped */}
      <div className="relative shrink-0" ref={riderRef}>
        <button
          onClick={() => setRiderOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
            isRiderActive ? 'bg-cyan-700/40 text-cyan-300' : 'text-muted hover:text-white hover:bg-fill'
          }`}
        >
          <FileText size={13} />
          Rider
          <ChevronDown size={11} className={`transition-transform ${riderOpen ? 'rotate-180' : ''}`} />
        </button>

        {riderOpen && (
          <div className="absolute right-0 top-full mt-1 bg-pane border border-line rounded-xl shadow-xl z-50 overflow-hidden min-w-[140px]">
            {RIDER_TABS.map(tab => {
              const to = base + tab.path
              const active = pathname.startsWith(to)
              const Icon = tab.icon
              return (
                <Link key={tab.key} to={to}
                  onClick={() => setRiderOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs whitespace-nowrap transition-colors ${
                    active ? 'bg-cyan-700/40 text-cyan-300' : 'text-muted hover:text-white hover:bg-fill'
                  }`}>
                  <Icon size={13} />
                  {tab.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
