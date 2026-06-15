// src/lib/formatters.js
// Pure formatting utilities shared across pages and components.

/** Derive up to 2 initials from a member-like object. */
export function memberInitials(m) {
  if (!m) return '?'
  if (m.initials) return m.initials
  const fl = [m.first_name, m.last_name].filter(Boolean)
  if (fl.length) return fl.map(s => s[0]).join('').slice(0, 2).toUpperCase()
  if (m.name) return m.name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase()
  return '?'
}

/** Calculate age in years from an ISO birth date string. */
export function calcAge(birth_date) {
  if (!birth_date) return null
  const b = new Date(birth_date), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() ||
      (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}

/**
 * Format an ISO date string in Catalan locale.
 * @param {string} iso - ISO date string (YYYY-MM-DD or full ISO)
 * @param {Intl.DateTimeFormatOptions} [opts] - custom format options
 */
export function formatDate(iso, opts) {
  const date = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return date.toLocaleDateString('ca-ES', opts ?? { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Returns true if the ISO date string is today or in the future. */
export function isUpcoming(isoDate) {
  return isoDate >= new Date().toISOString().slice(0, 10)
}

/** How many years a member has been in the choir. */
export function yearsInChoir(joined_at) {
  if (!joined_at) return null
  const y = new Date().getFullYear() - new Date(joined_at).getFullYear()
  return y < 1 ? "menys d'1 any" : `${y} any${y !== 1 ? 's' : ''}`
}

/** Full display name from first and last name. */
export function deriveName(first_name, last_name) {
  return [first_name, last_name].filter(Boolean).join(' ')
}
