import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

let trigger = null

// Drop-in replacement for window.confirm():
//   if (!(await confirmDialog('Eliminar?'))) return
// Requires <ConfirmHost /> mounted once (App.jsx). Falls back to the
// native dialog if the host isn't mounted.
export function confirmDialog(message, opts = {}) {
  if (!trigger) return Promise.resolve(window.confirm(message))
  return trigger(message, opts)
}

export function ConfirmHost() {
  const [req, setReq] = useState(null)

  useEffect(() => {
    trigger = (message, opts = {}) => new Promise(resolve => setReq({ message, opts, resolve }))
    return () => { trigger = null }
  }, [])

  useEffect(() => {
    if (!req) return
    const onKey = e => { if (e.key === 'Escape') { req.resolve(false); setReq(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [req])

  if (!req) return null
  const { message, opts } = req
  const done = val => { req.resolve(val); setReq(null) }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => done(false)} />
      <div className="relative bg-pane border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-5 pb-safe sm:pb-5">
        <div className="flex items-start gap-3 mb-5">
          <span className="shrink-0 w-10 h-10 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </span>
          <p className="text-sm text-gray-200 pt-2">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => done(false)}>Cancel·lar</Button>
          <Button variant={opts.danger === false ? 'primary' : 'danger'} onClick={() => done(true)} autoFocus>
            {opts.confirmLabel ?? 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
