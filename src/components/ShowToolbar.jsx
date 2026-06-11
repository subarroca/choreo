import { Link, useLocation } from 'react-router-dom'
import { ListOrdered, Lightbulb, MicVocal, FileText, ImageIcon } from 'lucide-react'

const TABS = [
  { key: 'setlist',  path: '',         label: 'Setlist',   icon: ListOrdered },
  { key: 'llums',    path: '/llums',   label: 'Llums',     icon: Lightbulb },
  { key: 'mics',     path: '/mics',    label: 'Micros',    icon: MicVocal },
  { key: 'poster',   path: '/poster',  label: 'Pòster',    icon: ImageIcon },
  { key: 'rider',    path: '/rider',   label: 'Rider',     icon: FileText },
]

export default function ShowToolbar({ showId, showName }) {
  const { pathname } = useLocation()
  const base = `/show/${showId}`

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0 mr-2">
        <Link to="/" className="hover:text-gray-300 shrink-0">Espectacles</Link>
        <span>/</span>
        <Link to={base} className="hover:text-gray-300 truncate max-w-[180px]">{showName ?? '…'}</Link>
      </nav>
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {TABS.map(tab => {
          const to = base + tab.path
          const active = tab.path === ''
            ? pathname === base || pathname === base + '/'
            : pathname.startsWith(to)
          const Icon = tab.icon
          return (
            <Link key={tab.key} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                active
                  ? 'bg-cyan-700/40 text-cyan-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Icon size={13} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
