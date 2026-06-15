export default function FormField({ label, className = '', children }) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      {label && <label className="text-xs text-faint">{label}</label>}
      {children}
    </div>
  )
}
