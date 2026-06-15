import { useState } from 'react'
import { MessageSquarePlus, Send } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { toast } from './ui/Toast'
import { useLocation } from 'react-router-dom'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Textarea from './ui/Textarea'

const CATEGORIES = [
  { value: 'millora', label: 'Millora' },
  { value: 'bug',     label: 'Bug' },
  { value: 'idea',    label: 'Idea' },
]

export default function FeedbackButton() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [category, setCategory] = useState('millora')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const msg = text.trim()
    if (!msg) return
    setSending(true)
    try {
      await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        message: msg,
        url: location.pathname,
        category,
      })
      toast('Gràcies pel suggeriment!')
      setText('')
      setCategory('millora')
      setOpen(false)
    } catch {
      toast.error('Error en enviar el suggeriment')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Suggereix una millora"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-11 h-11 rounded-full bg-pane border border-line shadow-lg flex items-center justify-center text-faint hover:text-cyan-400 hover:border-cyan-600 transition-colors"
      >
        <MessageSquarePlus size={18} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Suggeriment de millora"
        width="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-ghost">{location.pathname}</span>
            <Button size="sm" loading={sending} disabled={!text.trim()} onClick={handleSend}>
              <Send size={13} /> {sending ? 'Enviant…' : 'Enviar'}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-faint mb-3">Descriu el que vols millorar, un problema que has trobat, o una idea nova.</p>
        <div className="flex gap-2 mb-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                category === c.value
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-400'
                  : 'bg-fill border-line text-ghost hover:text-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend() }}
          placeholder="Escriu aquí el teu suggeriment…"
          rows={4}
          autoFocus
          className="resize-none"
        />
      </Modal>
    </>
  )
}
