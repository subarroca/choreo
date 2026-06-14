import { VOICE_COLORS } from '../../lib/constants.js'

const SIZES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
}

// Derive initials from a member-like object (first/last name, name, or initials).
export function memberInitials(m) {
  if (!m) return '?'
  if (m.initials) return m.initials
  const fl = [m.first_name, m.last_name].filter(Boolean)
  if (fl.length) return fl.map(s => s[0]).join('').slice(0, 2).toUpperCase()
  if (m.name) return m.name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()
  return '?'
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
