import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Save, ChevronDown, RotateCcw } from 'lucide-react'
import {
  LIGHT_EFFECTS, LIGHT_COLORS, LIGHT_ZONES, AUDIENCE_OPTIONS,
  FOLLOWSPOT_POSITIONS, cueEffects, cueFollowspots, cueLevels, sideMax,
  lightColor, cueZoneColors,
  formatCueNumber, presetToCueFields, PRESET_FIELDS, effectiveMomentId,
} from '../../lib/lights'
import StageSim from './StageSim'

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-300 placeholder-gray-600'
const labelCls = 'text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5 block'

function ChipRow({ options, value, onSelect, multi = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? value.includes(opt.value) : value === opt.value
        return (
          <button key={opt.value} onClick={() => onSelect(opt.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs min-h-[34px] border transition-colors ${
              active ? 'bg-cyan-700/40 border-cyan-500 text-cyan-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LIGHT_COLORS.map(c => (
        <button key={c.id} onClick={() => onChange(c.id)} title={c.label}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            value === c.id ? 'border-white scale-110' : 'border-gray-700'}`}
          style={{ background: c.hex }} />
      ))}
      <button onClick={() => onChange(null)}
        className={`h-7 px-2 rounded-full border-2 flex items-center justify-center text-[10px] transition-colors ${
          !value ? 'border-cyan-300 text-cyan-300' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
        Neutre
      </button>
    </div>
  )
}

function LevelRow({ label, value, onChange, colorHex }) {
  const pct = (value ?? 0) * 25
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] w-14 shrink-0 text-gray-400">{label}</span>
      <div className="relative flex-1 h-7 bg-gray-800 rounded-md border border-gray-700 overflow-hidden cursor-pointer"
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect()
          onChange(Math.min(4, Math.max(0, Math.round((e.clientX - r.left) / r.width * 4))))
        }}>
        <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-150 pointer-events-none"
          style={{ width: `${pct}%`, background: colorHex ? colorHex + '66' : 'rgb(217 119 6 / 0.40)' }} />
        <span className="relative flex items-center justify-center h-full text-[11px] font-semibold text-white pointer-events-none">
          {value == null ? '—' : `${pct}%`}
        </span>
      </div>
    </div>
  )
}

function ZoneRow({ label, value, onChange, color, onColor }) {
  const [open, setOpen] = useState(false)
  const hex = lightColor(color)?.hex
  const pct = value * 25
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] w-14 shrink-0 text-gray-600">{label}</span>
        <div className="relative flex-1 h-6 bg-gray-800 rounded-md border border-gray-700 overflow-hidden cursor-pointer"
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect()
            onChange(Math.min(4, Math.max(0, Math.round((e.clientX - r.left) / r.width * 4))))
          }}>
          <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-150 pointer-events-none"
            style={{ width: `${pct}%`, background: hex ? hex + '66' : 'rgb(217 119 6 / 0.40)' }} />
          <span className="relative flex items-center justify-center h-full text-[10px] font-semibold text-white pointer-events-none">
            {pct}%
          </span>
        </div>
        <button onClick={() => setOpen(v => !v)} title={hex ? lightColor(color)?.label : 'Sense color'}
          className={`w-4 h-4 rounded-full shrink-0 border-2 transition-all ${open ? 'border-cyan-400 scale-110' : hex ? 'border-white/30' : 'border-gray-700 hover:border-gray-500'}`}
          style={{ background: hex ?? '#1e293b' }} />
      </div>
      {open && (
        <div className="mt-1 mb-1">
          <ColorPicker value={color} onChange={c => { onColor(c); setOpen(false) }} />
        </div>
      )}
    </div>
  )
}

function LightSide({ title, levels, colors, onLevels, onColors }) {
  const [expanded, setExpanded] = useState(false)
  const vals = LIGHT_ZONES.map(z => levels[z.value] ?? 0)
  const uniform = vals.every(v => v === vals[0]) ? vals[0] : null
  const anyOn = sideMax(levels) > 0
  const firstColor = LIGHT_ZONES.map(z => colors[z.value]).find(Boolean) ?? null
  const colorHex = lightColor(firstColor)?.hex ?? null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{title}</span>
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-0.5 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
          {expanded ? 'Amaga' : 'Per zona'}
          <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <LevelRow label="Tots" value={uniform} colorHex={colorHex}
        onChange={v => onLevels({ esquerra: v, centre: v, dreta: v })} />
      {anyOn && !expanded && (
        <ColorPicker value={firstColor} onChange={c => onColors({ esquerra: c, centre: c, dreta: c })} />
      )}
      {expanded && (
        <div className="border-t border-gray-800 pt-1.5 space-y-1">
          {LIGHT_ZONES.map(z => (
            <ZoneRow key={z.value} label={z.label}
              value={levels[z.value] ?? 0}
              onChange={v => onLevels({ ...levels, [z.value]: v })}
              color={colors[z.value] ?? null}
              onColor={c => onColors({ ...colors, [z.value]: c })} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CueEditPanel({
  cue, show, songs, momentsBySong, members, presets, allCues,
  positionsByMoment, loadMomentPositions, naturalTriggerText = '',
  onChange, onDelete, onClose, onCreatePreset, onDeletePreset,
}) {
  const [triggerText, setTriggerText] = useState(cue.trigger_text ?? '')
  const [notes, setNotes] = useState(cue.notes ?? '')
  const [cueNum, setCueNum] = useState(formatCueNumber(cue.cue_number))
  const [presetName, setPresetName] = useState('')
  const [savingPreset, setSavingPreset] = useState(false)

  useEffect(() => {
    setTriggerText(cue.trigger_text ?? '')
    setNotes(cue.notes ?? '')
    setCueNum(formatCueNumber(cue.cue_number))
  }, [cue.id])

  const flatMoments = Object.values(momentsBySong).flat()
  const effMomentId = effectiveMomentId(cue, allCues ?? [])
  const effMoment = flatMoments.find(m => m.id === effMomentId)
  const inherited = effMomentId && effMomentId !== cue.moment_id

  useEffect(() => {
    if (effMomentId) loadMomentPositions(effMomentId)
  }, [effMomentId])

  const effects = cueEffects(cue)
  const followspots = cueFollowspots(cue)
  const choirMembers = members.filter(m => m.role !== 'director')
  const frontColors = cueZoneColors(cue, 'front')
  const backColors = cueZoneColors(cue, 'back')

  function toggleEffect(value) {
    const next = effects.includes(value) ? effects.filter(e => e !== value) : [...effects, value]
    onChange({ effects: JSON.stringify(next) })
  }

  function setFollowspots(next) {
    onChange({ followspots: JSON.stringify(next) })
  }

  function commitCueNumber() {
    const n = parseFloat(String(cueNum).replace(',', '.'))
    if (!isNaN(n) && n > 0) onChange({ cue_number: n })
    else setCueNum(formatCueNumber(cue.cue_number))
  }

  async function savePreset() {
    if (!presetName.trim()) return
    const fields = { name: presetName.trim() }
    for (const k of PRESET_FIELDS) fields[k] = cue[k] ?? null
    await onCreatePreset(fields)
    setPresetName(''); setSavingPreset(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header + sim sticky */}
      <div className="shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-sm font-semibold text-white">Cue</span>
          <input value={cueNum} onChange={e => setCueNum(e.target.value)} onBlur={commitCueNumber}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            inputMode="decimal"
            className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm font-bold text-white text-center focus:outline-none focus:border-cyan-300" />
          <input value={triggerText} onChange={e => setTriggerText(e.target.value)}
            onBlur={() => triggerText !== (cue.trigger_text ?? '') && onChange({ trigger_text: triggerText })}
            placeholder="Títol / indicació…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-300 placeholder-gray-600" />
          {naturalTriggerText && triggerText !== naturalTriggerText && (
            <button onClick={() => { setTriggerText(naturalTriggerText); onChange({ trigger_text: naturalTriggerText }) }}
              title="Recuperar text de la lletra"
              className="text-gray-600 hover:text-cyan-300 p-1 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
              <RotateCcw size={13} />
            </button>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-3 pb-2">
          <StageSim show={show} members={members}
            placements={effMomentId ? (positionsByMoment[effMomentId] ?? {}) : {}}
            gridMode={effMoment?.grid_mode ?? 'alternate'} cue={cue} className="w-full h-auto" />
          {inherited && (
            <p className="text-[10px] text-gray-600 px-1 pt-1">Posicions de «{effMoment?.title}»</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <LightSide title="Frontal"
          levels={cueLevels(cue, 'front')} colors={frontColors}
          onLevels={l => onChange({ front_levels: JSON.stringify(l) })}
          onColors={c => onChange({ front_color: JSON.stringify(c) })} />
        <LightSide title="Contra"
          levels={cueLevels(cue, 'back')} colors={backColors}
          onLevels={l => onChange({ back_levels: JSON.stringify(l) })}
          onColors={c => onChange({ back_color: JSON.stringify(c) })} />

        <div>
          <span className={labelCls}>Efectes</span>
          <ChipRow options={LIGHT_EFFECTS} value={effects} multi onSelect={toggleEffect} />
        </div>

        <div>
          <span className={labelCls}>Sala i públic</span>
          <ChipRow options={AUDIENCE_OPTIONS} value={effects} multi onSelect={toggleEffect} />
        </div>

        <div className="space-y-1.5">
          <span className={labelCls}>Canons de seguiment</span>
          {followspots.map((fs, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <select value={fs.member_id ?? ''}
                  onChange={e => setFollowspots(followspots.map((f, idx) => idx === i ? { ...f, member_id: e.target.value || null } : f))}
                  className={inputCls + ' !py-1.5 flex-1'}>
                  <option value="">— Persona —</option>
                  {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button onClick={() => setFollowspots(followspots.filter((_, idx) => idx !== i))}
                  className="text-gray-600 hover:text-red-400 p-1 transition-colors shrink-0"><X size={14} /></button>
              </div>
              <div className="flex gap-1">
                {FOLLOWSPOT_POSITIONS.map(p => (
                  <button key={p} onClick={() => setFollowspots(followspots.map((f, idx) => idx === i ? { ...f, position: p } : f))}
                    className={`flex-1 py-1 rounded-md text-[10px] capitalize border transition-colors ${
                      (fs.position ?? 'centre') === p
                        ? 'bg-amber-700/30 border-amber-500 text-amber-300'
                        : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setFollowspots([...followspots, { label: `Canó ${followspots.length + 1}`, position: 'centre', member_id: null }])}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors border border-dashed border-gray-700 hover:border-amber-600 rounded-lg px-2.5 py-2 w-full">
            <Plus size={12} /> Afegir canó
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium shrink-0">Transició</span>
          <ChipRow options={[{ value: 'tall', label: 'Tall' }, { value: 'prog', label: 'Prog.' }]}
            value={cue.transition ?? 'tall'} onSelect={v => onChange({ transition: v })} />
          {cue.transition === 'prog' && (
            <div className="flex items-center gap-1">
              <input type="number" min="0" step="0.5" value={cue.transition_seconds ?? ''}
                onChange={e => onChange({ transition_seconds: e.target.value === '' ? null : parseFloat(e.target.value) })}
                className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-300" />
              <span className="text-xs text-gray-500">s</span>
            </div>
          )}
        </div>

        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          onBlur={() => notes !== (cue.notes ?? '') && onChange({ notes })}
          rows={1} placeholder="Notes per al tècnic…" className={inputCls + ' resize-y !py-1.5 text-xs'} />

        {/* Presets + eliminar */}
        <div className="border-t border-gray-800 pt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mr-1">Presets</span>
            {presets.map(p => (
              <span key={p.id} className="inline-flex items-center rounded-md border border-gray-700 bg-gray-800 overflow-hidden">
                <button onClick={() => onChange(presetToCueFields(p))}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-cyan-300 hover:bg-gray-700 transition-colors">
                  {p.name}
                </button>
                <button onClick={() => onDeletePreset(p.id)}
                  className="px-1 py-1 text-gray-600 hover:text-red-400 transition-colors"><X size={11} /></button>
              </span>
            ))}
            {savingPreset ? (
              <div className="flex gap-1.5 items-center">
                <input value={presetName} onChange={e => setPresetName(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && savePreset()}
                  placeholder="Nom…" className="w-28 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-300" />
                <button onClick={savePreset} className="bg-cyan-600 hover:bg-cyan-300 text-white text-xs px-2 py-1 rounded-md transition-colors">
                  <Save size={12} />
                </button>
                <button onClick={() => setSavingPreset(false)} className="text-gray-500 hover:text-white"><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => setSavingPreset(true)}
                className="text-[11px] text-gray-600 hover:text-cyan-300 transition-colors">
                <Plus size={11} className="inline -mt-0.5" /> desa
              </button>
            )}
          </div>
          <button onClick={onDelete}
            className="flex items-center gap-1 text-xs text-red-500/70 hover:text-red-400 transition-colors">
            <Trash2 size={12} /> Eliminar cue
          </button>
        </div>
      </div>
    </div>
  )
}
