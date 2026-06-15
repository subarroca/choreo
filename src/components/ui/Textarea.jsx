import { inputCls, labelCls } from './Input'

// Styled textarea matching Input appearance.
// Usage: <Textarea label="Lletra" rows={6} value={v} onChange={fn} />
// Use className="resize-none" to lock resize, "leading-relaxed" for lyrics.
export default function Textarea({ label, className = '', ...props }) {
  const field = (
    <textarea
      className={`${inputCls} resize-y ${className}`}
      {...props}
    />
  )
  if (!label) return field
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {field}
    </div>
  )
}
