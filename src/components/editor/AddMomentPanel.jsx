export default function AddMomentPanel({
  newMomentTitle, setNewMomentTitle, cloneFrom, moments,
  momentId, otherSongs, otherSongMoments, selectedOtherSongId, selectedOtherMomentId,
  setSelectedOtherSongId, setSelectedOtherMomentId, onCloneFromChange, onCreate, onCancel, inputCls,
}) {
  return (
    <div className="border-t border-gray-700 bg-gray-900 px-3 py-2 shrink-0">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Títol</label>
          <input value={newMomentTitle} onChange={e => setNewMomentTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') onCancel() }}
            autoFocus className={inputCls + ' w-36'} />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Font</label>
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
        {cloneFrom === 'other' && otherSongs !== null && (
          <div className="space-y-0.5">
            <label className="text-xs text-gray-500">Cançó</label>
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
            <label className="text-xs text-gray-500">Moment</label>
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
          <span className="text-xs text-gray-500 self-end pb-1">Carregant…</span>
        )}
        <div className="flex gap-1.5 self-end">
          <button onClick={onCreate}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Crear</button>
          <button onClick={onCancel}
            className="text-gray-500 hover:text-white text-xs px-2 py-1.5 transition-colors">Cancel·lar</button>
        </div>
      </div>
    </div>
  )
}
