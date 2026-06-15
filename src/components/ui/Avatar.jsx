import { VOICE_COLORS } from '../../lib/constants.js'
export { memberInitials } from '../../lib/formatters.js'
import { memberInitials } from '../../lib/formatters.js'

const SIZES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
}

/**
 * Person avatar — coloured circle with initials, tinted by voice part.
 * Single source of truth for how a person is visually represented.
 */
export default function Avatar({ member, size = 'md', className = '' }) {
  const color = VOICE_COLORS[member?.voice] ?? VOICE_COLORS.extra
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${SIZES[size]} ${className}`}
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      {memberInitials(member)}
    </span>
  )
}
