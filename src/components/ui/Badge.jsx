const COLORS = {
  cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-700/20 dark:text-cyan-300 dark:border-cyan-700/40',
  amber:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-700/30 dark:text-amber-300 dark:border-amber-700/40',
  green:   'bg-green-100 text-green-700 border-green-200 dark:bg-green-700/20 dark:text-green-300 dark:border-green-700/40',
  red:     'bg-red-100 text-red-700 border-red-200 dark:bg-red-700/20 dark:text-red-300 dark:border-red-700/40',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-700/40',
}

export default function Badge({ color = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${COLORS[color] ?? COLORS.neutral} ${className}`}>
      {children}
    </span>
  )
}
