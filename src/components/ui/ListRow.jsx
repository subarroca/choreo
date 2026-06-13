/**
 * Unified list row — no per-item box. Hierarchy comes from typography,
 * spacing and subtle dividers. Wrap rows in a container with
 * `divide-y divide-rim` for separation.
 *
 * Slots:
 *   leading  — icon / Avatar (left)
 *   title    — primary text (required)
 *   meta     — secondary text under the title
 *   trailing — right-aligned action / status
 *
 * Renders as a <button> when onClick is given, otherwise a <div>.
 */
export default function ListRow({ leading, title, meta, trailing, onClick, active = false, className = '' }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
        ${onClick ? 'hover:bg-fill/60 cursor-pointer' : ''}
        ${active ? 'bg-cyan-700/10' : ''} ${className}`}
    >
      {leading != null && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-body truncate">{title}</div>
        {meta != null && <div className="text-xs text-muted truncate">{meta}</div>}
      </div>
      {trailing != null && <div className="shrink-0 flex items-center gap-1.5">{trailing}</div>}
    </Tag>
  )
}
