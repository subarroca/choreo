import { useId } from 'react'
import { cloneElement, isValidElement, Children } from 'react'

// Wraps a label + input pair. Automatically associates them with htmlFor/id so
// screen readers can announce the label when the input is focused.
export default function FormField({ label, className = '', children }) {
  const id = useId()
  // Clone the first element child to inject the id (handles input/select/textarea).
  const child = Children.toArray(children)[0]
  const labeled = isValidElement(child) && !child.props.id
    ? cloneElement(child, { id })
    : child
  const rest = Children.toArray(children).slice(1)

  return (
    <div className={`space-y-0.5 ${className}`}>
      {label && <label htmlFor={id} className="text-xs text-faint">{label}</label>}
      {labeled}
      {rest}
    </div>
  )
}
