import Button from '../ui/Button'
import { inputClsSm as inputCls } from '../ui/Input'
import FormField from '../ui/FormField'

export default function EditMomentPanel({
  editMomentTitle, editMomentSubtitle, setEditMomentTitle,
  setEditMomentSubtitle, onSave, onDelete, onCancel,
}) {
  return (
    <div className="border-t border-line bg-pane px-3 py-2 shrink-0">
      <div className="flex flex-wrap gap-2 items-end">
        <FormField label="Títol">
          <input value={editMomentTitle} onChange={e => setEditMomentTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
            autoFocus className={inputCls + ' w-36'} />
        </FormField>
        <FormField label="Subtítol / referència">
          <input value={editMomentSubtitle} onChange={e => setEditMomentSubtitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
            placeholder="ex. Entrada, pont…" className={inputCls + ' w-52'} />
        </FormField>
        <div className="flex gap-1.5 self-end">
          <Button onClick={onSave} className="text-xs px-3 py-1.5 min-h-0 h-auto">Guardar</Button>
          <Button onClick={onDelete} variant="danger" className="text-xs px-3 py-1.5 min-h-0 h-auto">Eliminar</Button>
          <Button onClick={onCancel} variant="ghost" className="text-xs px-2 py-1.5 min-h-0 h-auto">Cancel·lar</Button>
        </div>
      </div>
    </div>
  )
}
