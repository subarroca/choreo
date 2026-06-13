const VARIANTS = {
  primary:   'bg-cyan-600 hover:bg-cyan-500 text-white',
  secondary: 'border border-line text-muted hover:text-body hover:bg-fill',
  danger:    'bg-red-600 hover:bg-red-500 text-white',
  ghost:     'text-muted hover:text-body hover:bg-fill',
}

// Touch-friendly button (≥44px tall) with the app's standard variants.
// `stacked` lays the icon above the label — for touch action bars on tablet/mobile.
export default function Button({ variant = 'primary', stacked = false, className = '', ...props }) {
  const layout = stacked
    ? 'flex-col gap-1 px-3 py-2 text-xs'
    : 'gap-1.5 px-4 py-2 text-sm'
  return (
    <button
      className={`inline-flex items-center justify-center min-h-[44px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${layout} ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props} />
  )
}
