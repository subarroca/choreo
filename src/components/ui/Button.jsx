const VARIANTS = {
  primary:   'bg-cyan-600 hover:bg-cyan-500 text-white',
  secondary: 'border border-line text-muted hover:text-body hover:bg-fill',
  danger:    'bg-red-600 hover:bg-red-500 text-white',
  ghost:     'text-muted hover:text-body hover:bg-fill',
}

// Touch-friendly button (≥44px tall) with the app's standard variants.
export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 text-sm px-4 py-2 min-h-[44px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props} />
  )
}
