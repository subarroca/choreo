import { ChevronUp, ChevronDown } from 'lucide-react'

export default function SidebarSection({ title, open, onToggle, children, badge }) {
  return (
    <div>
      <button onClick={onToggle}
        className="flex items-center justify-between w-full text-xs text-gray-600 uppercase tracking-wider font-medium hover:text-gray-400 py-0.5 select-none">
        <span className="flex items-center gap-1">{title}{badge && <span className="text-gray-700 font-normal normal-case">{badge}</span>}</span>
        {open ? <ChevronUp size={9} className="text-gray-700" /> : <ChevronDown size={9} className="text-gray-700" />}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  )
}
