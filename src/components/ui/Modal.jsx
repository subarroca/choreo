import { useEffect } from 'react'
import { X } from 'lucide-react'
import { ICON } from '../../lib/ui.js'

const WIDTHS = {
  sm:  'sm:max-w-sm',
  md:  'sm:max-w-md',
  lg:  'sm:max-w-lg',
  xl:  'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

/**
 * Unified modal. Responsive by design:
 *   - tablet / desktop (sm+): right-side slide-in panel
 *   - mobile (<sm): bottom-sheet
 *
 * Usage:
 *   <Modal open={bool} onClose={fn} title="Títol" width="md" footer={<…>}>
 *     …content…
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, width = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel — bottom-sheet on mobile, side panel on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${WIDTHS[width] ?? WIDTHS.md} max-h-[90dvh] sm:max-h-none sm:h-full bg-page border-rim flex flex-col shadow-2xl
          rounded-t-2xl border-t sm:rounded-none sm:border-t-0 sm:border-l`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim shrink-0">
          <h2 className="text-base font-semibold text-body">{title}</h2>
          <button
            onClick={onClose}
            className="text-faint hover:text-body p-1.5 rounded-lg hover:bg-fill transition-colors"
            aria-label="Tancar"
          >
            <X size={ICON.md} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {/* Optional sticky footer */}
        {footer && (
          <div className="shrink-0 px-5 py-4 border-t border-rim bg-page">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
