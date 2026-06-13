import { useState } from 'react'
import { inputCls, labelCls } from '../ui/Input'
import Button from '../ui/Button'

export default function PartForm({ initial, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title }) }} className="space-y-4">
      <div className="space-y-1">
        <label className={labelCls}>Títol *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          placeholder="Part 1, Acte 2…" className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit">Guardar</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel·lar</Button>
        {onDelete && (
          <Button type="button" variant="danger" onClick={onDelete} className="ml-auto">
            Eliminar
          </Button>
        )}
      </div>
    </form>
  )
}
