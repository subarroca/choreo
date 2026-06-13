import { POSITION_TEMPLATES } from '../../lib/editorArrange'

export default function AddMomentPanel({
  newMomentTitle, setNewMomentTitle, cloneFrom, moments,
  momentId, otherSongs, otherSongMoments, selectedOtherSongId, selectedOtherMomentId,
  selectedTemplate, setSelectedTemplate,
  setSelectedOtherSongId, setSelectedOtherMomentId, onCloneFromChange, onCreate, onCancel, inputCls,
}) {
  return (
    <div className="border-t border-line bg-pane px-3 py-2 shrink-0">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-0.5">
          <label className="text-xs text-faint">Títol</label>
          <input value={newMomentTitle} onChange={e => setNewMomentTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') onCancel() }}
            autoFocus className={inputCls + ' w-36'} />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-faint">Font</label>
          <select value={cloneFrom} onChange={e => onCloneFromChange(e.target.value)}
            className={inputCls}>
            <option value="">Des de 0</option>
            <option value={`moment:${momentId}`}>Clonar actual</option>
            {moments.filter(m => m.id !== momentId).map(m => (
              <option key={m.id} value={`moment:${m.id}`}>Clonar: {m.title}</option>
            ))}
            <option value="other">D'altra cançó…</option>
          </select>
        </div>

        {/* Template picker — only visible when starting from scratch */}
        {!cloneFrom && (
          <div className="space-y-0.5">
            <label className="text-xs text-faint">Template</label>
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
              className={inputCls}>
              <option value="">Buit</option>
              {POSITION_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {cloneFrom === 'other' && otherSongs !== null && (
          <div className="space-y-0.5">
            <label className="text-xs text-faint">Cançó</label>
            <select value={selectedOtherSongId}
              onChange={e => { setSelectedOtherSongId(e.target.value); setSelectedOtherMomentId('') }}
              className={inputCls}>
              <option value="">Tria…</option>
              {otherSongs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        )}
        {cloneFrom === 'other' && selectedOtherSongId && (
          <div className="space-y-0.5">
            <label className="text-xs text-faint">Moment</label>
            <select value={selectedOtherMomentId} onChange={e => setSelectedOtherMomentId(e.target.value)}
              className={inputCls}>
              <option value="">Tria…</option>
              {(otherSongMoments[selectedOtherSongId] ?? []).map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        )}
        {cloneFrom === 'other' && otherSongs === null && (
          <span className="text-xs text-faint self-end pb-1">Carregant…</span>
        )}
        <div className="flex gap-1.5 self-end">
          <button onClick={onCreate}
            className="bg-cyan-600 hover:bg-cyan-300 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Crear</button>
          <button onClick={onCancel}
            className="text-faint hover:text-body text-xs px-2 py-1.5 transition-colors">Cancel·lar</button>
        </div>
      </div>
    </div>
  )
}
