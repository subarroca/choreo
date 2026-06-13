import { ICON } from '../../lib/ui.js'

/**
 * Unified page header. Always-visible top bar of a PageContainer.
 *
 * Props:
 *   title     — page title (string)
 *   icon      — optional lucide icon component (rendered at ICON.lg)
 *   subtitle  — optional helper text under / beside the title
 *   actions   — optional right-aligned node (buttons)
 *   tabs      — optional node rendered as a second row (e.g. context tabs)
 */
export default function PageHeader({ title, icon: Icon, subtitle, actions, tabs }) {
  return (
    <header className="bg-pane border-b border-rim px-4 md:px-6">
      <div className="flex items-center gap-3 min-h-[56px] py-2">
        {Icon && <Icon size={ICON.lg} className="text-cyan-500 shrink-0" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-bold text-body truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs && <div className="-mb-px">{tabs}</div>}
    </header>
  )
}
