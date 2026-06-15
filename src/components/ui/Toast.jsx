import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, X } from '../../lib/icons'

const listeners = new Set()
let _id = 0

export function toast(message, type = 'success') {
  const id = ++_id
  listeners.forEach(fn => fn({ id, message, type }))
  return id
}
toast.error = (msg) => toast(msg, 'error')
toast.warn  = (msg) => toast(msg, 'warn')

const STYLES = {
  success: { cls: 'bg-cyan-950 border-cyan-700 text-cyan-100', Icon: CheckCircle, iconCls: 'text-cyan-400' },
  error:   { cls: 'bg-red-950 border-red-700 text-red-100',   Icon: AlertCircle,  iconCls: 'text-red-400' },
  warn:    { cls: 'bg-amber-950 border-amber-700 text-amber-100', Icon: AlertTriangle, iconCls: 'text-amber-400' },
}

export function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function onToast(t) {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000)
    }
    listeners.add(onToast)
    return () => listeners.delete(onToast)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const { cls, Icon, iconCls } = STYLES[t.type] ?? STYLES.success
        return (
          <div key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium pointer-events-auto animate-slide-up ${cls}`}>
            <Icon size={15} className={`shrink-0 ${iconCls}`} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-1 text-current opacity-50 hover:opacity-100 transition-opacity">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
