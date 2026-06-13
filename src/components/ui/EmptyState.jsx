import { ICON } from '../../lib/ui.js'

/**
 * Unified empty state. Centered icon + text, with an optional action.
 *
 * Props:
 *   icon   — lucide icon component (rendered at ICON.hero)
 *   title  — main message
 *   hint   — optional secondary line
 *   action — optional node (e.g. a Button)
 */
export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 gap-3">
      {Icon && <Icon size={ICON.hero} className="text-ghost" />}
      <div>
        <p className="text-body font-medium">{title}</p>
        {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
      </div>
      {action}
    </div>
  )
}
