// Canonical input styling — import this instead of redefining the class string.
export const inputCls = 'w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 placeholder-gray-600'
export const labelCls = 'text-xs text-muted mb-1 block'

export default function Input({ label, className = '', ...props }) {
  const field = <input className={`${inputCls} ${className}`} {...props} />
  if (!label) return field
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {field}
    </div>
  )
}
