export default function Chip({ active = false, shape = 'pill', className = '', children, ...props }) {
  const base = shape === 'pill'
    ? 'px-2.5 py-1 rounded-full text-xs border transition-colors'
    : 'px-2.5 py-1.5 rounded-lg text-xs min-h-[34px] border transition-colors flex items-center gap-1.5'
  const state = active
    ? 'border-cyan-600 text-cyan-400 bg-cyan-700/10'
    : 'border-line text-faint hover:text-body'
  return (
    <button className={`${base} ${state} ${className}`} {...props}>
      {children}
    </button>
  )
}
