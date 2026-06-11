// Canonical input styling — import this instead of redefining the class string.
export const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder-gray-600'
export const labelCls = 'text-xs text-gray-400 mb-1 block'

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
