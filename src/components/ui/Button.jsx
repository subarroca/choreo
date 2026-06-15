import { Loader2 } from '../../lib/icons'

const VARIANTS = {
  primary:   'bg-cyan-600 hover:bg-cyan-500 text-white',
  secondary: 'border border-line text-muted hover:text-body hover:bg-fill',
  danger:    'bg-red-600 hover:bg-red-500 text-white',
  ghost:     'text-muted hover:text-body hover:bg-fill',
}

// Touch-friendly button with the app's standard variants.
// size="sm" → compact (no min-height), size="md" (default) → touch-friendly ≥44px.
// `stacked` lays the icon above the label — for touch action bars on tablet/mobile.
// `loading` shows a spinner and disables the button.
export default function Button({ variant = 'primary', stacked = false, size = 'md', loading = false, className = '', children, ...props }) {
  const layout = stacked
    ? 'flex-col gap-1 px-3 py-2 text-xs'
    : size === 'sm'
      ? 'gap-1 px-3 py-1.5 text-xs'
      : 'gap-1.5 px-4 py-2 text-sm'
  const minH = size === 'sm' ? '' : 'min-h-[44px]'
  const spinnerSize = size === 'sm' ? 12 : 14
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center ${minH} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${layout} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={spinnerSize} className="animate-spin shrink-0" />}
      {children}
    </button>
  )
}
