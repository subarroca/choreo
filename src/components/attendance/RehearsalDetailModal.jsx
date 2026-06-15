import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { formatDate } from '../../lib/formatters'

const REHEARSAL_TYPES = {
  veu: 'Veu', coreo: 'Coreo', ambdues: 'Veu + Coreo',
  masterclass: 'Masterclass', posicions: 'Passi de posicions',
}

function parseRehearsalMeta(notes) {
  if (!notes) return { type: '', time: '', location: '', freeNotes: '' }
  try {
    const p = JSON.parse(notes)
    if (p && typeof p === 'object' && ('type' in p || 'time' in p || 'location' in p)) {
      return { type: p.type ?? '', time: p.time ?? '', location: p.location ?? '', freeNotes: p.notes ?? '' }
    }
  } catch {}
  return { type: '', time: '', location: '', freeNotes: notes }
}

export default function RehearsalDetailModal({ rehearsal, isAdmin, onSave, onClose }) {
  const [editTime, setEditTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editType, setEditType] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    if (rehearsal) {
      const m = parseRehearsalMeta(rehearsal.notes)
      setEditTime(m.time); setEditLocation(m.location); setEditType(m.type); setEditNotes(m.freeNotes)
    }
  }, [rehearsal?.id])

  return (
    <Modal
      open={!!rehearsal}
      onClose={onClose}
      title={rehearsal ? formatDate(rehearsal.date) : ''}
      width="half"
      footer={isAdmin && (
        <div className="flex gap-2">
          <Button onClick={() => onSave(rehearsal.id, editType, editTime, editLocation, editNotes)}>Guardar</Button>
          <Button variant="ghost" onClick={onClose}>Cancel·lar</Button>
        </div>
      )}
    >
      {rehearsal && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Hora</label>
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                disabled={!isAdmin}
                className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Lloc</label>
              <input type="text" placeholder="Sala, adreça…" value={editLocation} onChange={e => setEditLocation(e.target.value)}
                disabled={!isAdmin}
                className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Tipus</label>
            <select value={editType} onChange={e => setEditType(e.target.value)}
              disabled={!isAdmin}
              className="bg-fill border border-line rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-cyan-500 disabled:opacity-60">
              <option value="">— Tipus —</option>
              {Object.entries(REHEARSAL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Notes</label>
            <Textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
              disabled={!isAdmin} placeholder="Notes opcionals" className="disabled:opacity-60" />
          </div>
          {!isAdmin && <p className="text-xs text-ghost">Només els directors poden editar els detalls.</p>}
        </div>
      )}
    </Modal>
  )
}
