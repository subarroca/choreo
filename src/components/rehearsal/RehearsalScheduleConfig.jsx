import { useState } from 'react'
import { List, RotateCcw, Plus } from '../../lib/icons'
import { t } from '../../locales/ca'
import Button from '../ui/Button'
import { inputCls } from '../ui/Input'
import Select from '../ui/Select'
import { supabase } from '../../lib/supabase'
import { toast } from '../ui/Toast'

const DAYS = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte']

function nextOccurrence(dayOfWeek, fromDate) {
  const d = new Date(fromDate)
  const diff = (dayOfWeek - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  return d
}

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

export default function RehearsalScheduleConfig({ schedule, onScheduleChange, existingDates, onRehearsalsGenerated }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genUntil, setGenUntil] = useState('')

  const cfg = schedule ?? { day_of_week: 2, time: '20:00', location: '', active: true }

  async function saveSchedule(patch) {
    setSaving(true)
    const next = { ...cfg, ...patch }
    if (cfg.id) {
      await supabase.from('rehearsal_schedule').update(next).eq('id', cfg.id)
    } else {
      const { data } = await supabase.from('rehearsal_schedule').insert(next).select().single()
      if (data) onScheduleChange(data)
    }
    onScheduleChange(next)
    setSaving(false)
    toast('Horari desat')
  }

  async function generateRehearsals() {
    if (!genUntil) return
    setGenerating(true)
    const until = new Date(genUntil)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const existingSet = new Set(existingDates)
    const toCreate = []
    let cur = nextOccurrence(cfg.day_of_week ?? 2, today)
    while (cur <= until) {
      const iso = toISO(cur)
      if (!existingSet.has(iso)) {
        const notesStr = JSON.stringify({ type: '', time: cfg.time || '', location: cfg.location || '', notes: '', duration: cfg.duration ?? 90 })
        toCreate.push({ date: iso, time: cfg.time, location: cfg.location, type: null, notes: notesStr })
      }
      cur = new Date(cur)
      cur.setDate(cur.getDate() + 7)
    }
    if (toCreate.length) {
      const { data } = await supabase.from('rehearsals').insert(toCreate).select()
      if (data) onRehearsalsGenerated(data)
      toast(`${toCreate.length} assajos generats`)
    } else {
      toast(`Tots els ${DAYS[cfg.day_of_week ?? 2].toLowerCase()} ja existeixen`, 'warn')
    }
    setGenerating(false)
    setGenUntil('')
  }

  return (
    <div className="rounded-xl border border-rim bg-pane overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-fill/50 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-body">
          <List size={14} className="text-muted" /> {t.attendance.scheduleLabel}
        </span>
        <span className="text-xs text-muted">{DAYS[cfg.day_of_week ?? 2]} · {cfg.time || '—'} · {cfg.duration ?? 90} min · {cfg.location || 'Lloc no definit'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-rim pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select label="Dia" value={cfg.day_of_week ?? 2}
              onChange={e => saveSchedule({ day_of_week: parseInt(e.target.value) })}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </Select>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Hora</label>
              <input type="time" value={cfg.time ?? '20:00'}
                onChange={e => saveSchedule({ time: e.target.value })}
                className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Lloc habitual</label>
              <input type="text" placeholder="Sala, adreça…" value={cfg.location ?? ''}
                onChange={e => saveSchedule({ location: e.target.value })}
                className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Durada (min)</label>
              <input type="number" min="30" max="300" step="15" value={cfg.duration ?? 90}
                onChange={e => saveSchedule({ duration: Number(e.target.value) })}
                className={inputCls} />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-rim">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted">Generar fins a</label>
              <input type="date" value={genUntil} onChange={e => setGenUntil(e.target.value)} className={inputCls} />
            </div>
            <Button size="sm" onClick={generateRehearsals} disabled={!genUntil || generating}>
              <RotateCcw size={13} /> {generating ? 'Generant…' : 'Generar assajos'}
            </Button>
            <p className="text-xs text-ghost">Crea automàticament tots els {DAYS[cfg.day_of_week ?? 2].toLowerCase()} que falten fins a la data indicada.</p>
          </div>
        </div>
      )}
    </div>
  )
}
