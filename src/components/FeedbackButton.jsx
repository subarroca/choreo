import { useState } from 'react'
import { MessageSquarePlus, X, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { toast } from './ui/Toast'
import { useLocation } from 'react-router-dom'

export default function FeedbackButton() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const msg = text.trim()
    if (!msg) return
    setSending(true)
    try {
      if (import.meta.env.VITE_DEV_MODE === 'true') {
        const stored = JSON.parse(localStorage.getItem('dev_feedback') ?? '[]')
        stored.push({ message: msg, url: location.pathname, created_at: new Date().toISOString() })
        localStorage.setItem('dev_feedback', JSON.stringify(stored))
      } else {
        await supabase.from('feedback').insert({
          user_id: user?.id ?? null,
          message: msg,
          url: location.pathname,
        })
      }
      toast('Gràcies pel suggeriment!')
      setText('')
      setOpen(false)
    } catch {
      toast.error('Error en enviar el suggeriment')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Suggereix una millora"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-11 h-11 rounded-full bg-pane border border-line shadow-lg flex items-center justify-center text-faint hover:text-cyan-400 hover:border-cyan-600 transition-colors"
      >
        <MessageSquarePlus size={18} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="w-full max-w-md bg-pane border border-line rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-rim">
              <h3 className="text-sm font-semibold text-body">Suggeriment de millora</h3>
              <button onClick={() => setOpen(false)} className="text-faint hover:text-body p-1 rounded-lg hover:bg-fill transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-faint mb-3">Descriu el que vols millorar, un problema que has trobat, o una idea nova.</p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
                placeholder="Escriu aquí el teu suggeriment…"
                rows={4}
                autoFocus
                className="w-full bg-fill border border-line rounded-xl px-3 py-2.5 text-sm text-body placeholder:text-ghost focus:outline-none focus:border-cyan-500 resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-ghost">{location.pathname}</span>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={13} />
                  {sending ? 'Enviant…' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
