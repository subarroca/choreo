import { POSITION_TEMPLATES } from '../../lib/editorArrange'
import Button from '../ui/Button'
import { inputClsSm as inputCls } from '../ui/Input'
import Select from '../ui/Select'
import FormField from '../ui/FormField'

export default function AddMomentPanel({
  newMomentTitle, setNewMomentTitle, cloneFrom, moments,
  momentId, otherSongs, otherSongMoments, selectedOtherSongId, selectedOtherMomentId,
  selectedTemplate, setSelectedTemplate,
  setSelectedOtherSongId, setSelectedOtherMomentId, onCloneFromChange, onCreate, onCancel,
}) {
  return (
    <div className="border-t border-line bg-pane px-3 py-2 shrink-0">
      <div className="flex flex-wrap gap-2 items-end">
        <FormField label="Títol">
          <input value={newMomentTitle} onChange={e => setNewMomentTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') onCancel() }}
            autoFocus className={inputCls + ' w-36'} />
        </FormField>
        <FormField label="Font">
          <Select value={cloneFrom} onChange={e => onCloneFromChange(e.target.value)}
            className="!text-xs !px-2 !py-1">
            <option value="">Des de 0</option>
            <option value={`moment:${momentId}`}>Clonar actual</option>
            {moments.filter(m => m.id !== momentId).map(m => (
              <option key={m.id} value={`moment:${m.id}`}>Clonar: {m.title}</option>
            ))}
            <option value="other">D'altra cançó…</option>
          </Select>
        </FormField>

        {/* Template picker — only visible when starting from scratch */}
        {!cloneFrom && (
          <FormField label="Template">
            <Select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
              className="!text-xs !px-2 !py-1">
              <option value="">Buit</option>
              {POSITION_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </FormField>
        )}

        {cloneFrom === 'other' && otherSongs !== null && (
          <FormField label="Cançó">
            <Select value={selectedOtherSongId}
              onChange={e => { setSelectedOtherSongId(e.target.value); setSelectedOtherMomentId('') }}
              className="!text-xs !px-2 !py-1">
              <option value="">Tria…</option>
              {otherSongs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
          </FormField>
        )}
        {cloneFrom === 'other' && selectedOtherSongId && (
          <FormField label="Moment">
            <Select value={selectedOtherMomentId} onChange={e => setSelectedOtherMomentId(e.target.value)}
              className="!text-xs !px-2 !py-1">
              <option value="">Tria…</option>
              {(otherSongMoments[selectedOtherSongId] ?? []).map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </Select>
          </FormField>
        )}
        {cloneFrom === 'other' && otherSongs === null && (
          <span className="text-xs text-faint self-end pb-1">Carregant…</span>
        )}
        <div className="flex gap-1.5 self-end">
          <Button onClick={onCreate} className="text-xs px-3 py-1.5 min-h-0 h-auto">Crear</Button>
          <Button onClick={onCancel} variant="ghost" className="text-xs px-2 py-1.5 min-h-0 h-auto">Cancel·lar</Button>
        </div>
      </div>
    </div>
  )
}
