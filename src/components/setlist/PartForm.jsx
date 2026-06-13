import { useState } from 'react'

export default function PartForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title }) }} className="flex gap-3 items-end">
      <div className="space-y-1 flex-1">
        <label className="text-xs text-muted">Títol *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Part 1, Acte 2…"
          className="w-full bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-purple-500" />
      </div>
      <button type="submit" className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
      <button type="button" onClick={onCancel} className="text-muted hover:text-body text-sm px-4 py-2 rounded-lg transition-colors">Cancel·lar</button>
    </form>
  )
}
