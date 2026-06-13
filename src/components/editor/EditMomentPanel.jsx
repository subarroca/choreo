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
          <button onClick={onSave}
            className="bg-cyan-600 hover:bg-cyan-300 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Guardar</button>
          <button onClick={onDelete}
            className="bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg transition-colors">Eliminar</button>
          <button onClick={onCancel}
            className="text-faint hover:text-body text-xs px-2 py-1.5 transition-colors">Cancel·lar</button>
        </div>
      </div>
    </div>
  )
}
