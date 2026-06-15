export default function Chip({ active = false, shape = 'pill', className = '', children, ...props }) {
  const base = shape === 'pill'
    ? 'px-2.5 py-1 rounded-full text-xs border transition-colors'
    : 'px-2.5 py-1.5 rounded-lg text-xs min-h-[34px] border transition-colors flex items-center gap-1.5'
  const state = active
    ? 'border-cyan-600 bg-cyan-100 text-cyan-700 dark:bg-cyan-700/10 dark:text-cyan-400'
    : 'border-line text-faint hover:text-body'
  return (
    <button className={`${base} ${state} ${className}`} {...props}>
      {children}
    </button>
  )
}
