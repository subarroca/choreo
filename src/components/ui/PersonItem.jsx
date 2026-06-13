import Avatar from './Avatar.jsx'
import { VOICE_LABELS } from '../../lib/constants.js'

function fullName(m) {
  return [m?.first_name, m?.last_name].filter(Boolean).join(' ') || m?.name || '—'
}

/**
 * Unified person representation: Avatar + name + optional meta.
 * Use everywhere a member is shown (rosters, cast, soloists, attendance).
 *
 * Props:
 *   member  — member-like object
 *   size    — avatar size (sm | md | lg)
 *   meta    — override secondary line; defaults to the voice label
 *   trailing— optional right-aligned node
 *   onClick — makes the item a button
 */
export default function PersonItem({ member, size = 'md', meta, trailing, onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'div'
  const secondary = meta !== undefined ? meta : VOICE_LABELS[member?.voice]
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <Avatar member={member} size={size} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-body truncate">{fullName(member)}</div>
        {secondary && <div className="text-xs text-muted truncate">{secondary}</div>}
      </div>
      {trailing != null && <div className="shrink-0">{trailing}</div>}
    </Tag>
  )
}
