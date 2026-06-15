import { ChevronDown } from '../../lib/icons'
import { inputCls, labelCls } from './Input'

// Styled select matching Input appearance, with a custom dropdown arrow.
// Usage: <Select label="Part" value={v} onChange={fn}><option>…</option></Select>
// For compact editor panels, override size with className="!text-xs !px-2 !py-1".
export default function Select({ label, className = '', children, ...props }) {
  const field = (
    <div className="relative">
      <select
        className={`${inputCls} appearance-none pr-8 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
      />
    </div>
  )
  if (!label) return field
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {field}
    </div>
  )
}
