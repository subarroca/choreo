import Button from '../ui/Button'

export default function EditMomentPanel({
  editMomentTitle, editMomentSubtitle, setEditMomentTitle,
  setEditMomentSubtitle, onSave, onDelete, onCancel, inputCls,
}) {
  return (
    <div className="border-t border-line bg-pane px-3 py-2 shrink-0">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-0.5">
          <label className="text-xs text-faint">Títol</label>
          <input value={editMomentTitle} onChange={e => setEditMomentTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
            autoFocus className={inputCls + ' w-36'} />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-faint">Subtítol / referència</label>
          <input value={editMomentSubtitle} onChange={e => setEditMomentSubtitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
            placeholder="ex. Entrada, pont…" className={inputCls + ' w-52'} />
        </div>
        <div className="flex gap-1.5 self-end">
          <Button onClick={onSave} className="text-xs px-3 py-1.5 min-h-0 h-auto">Guardar</Button>
          <Button onClick={onDelete} variant="danger" className="text-xs px-3 py-1.5 min-h-0 h-auto">Eliminar</Button>
          <Button onClick={onCancel} variant="ghost" className="text-xs px-2 py-1.5 min-h-0 h-auto">Cancel·lar</Button>
        </div>
      </div>
    </div>
  )
}
