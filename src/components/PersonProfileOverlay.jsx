import { useState, useEffect, useRef } from 'react'
import { X, AtSign, Mail, Ruler, Calendar, UserPlus, Pencil, ChevronLeft, ChevronDown } from 'lucide-react'
import { VOICE_COLORS, VOICE_LABELS, ROLE_LABELS } from '../lib/constants'

// ─── Helpers ──────────────────────────────────────────────────
function calcAge(birth_date) {
  if (!birth_date) return null
  const b = new Date(birth_date), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}
function yearsInChoir(joined_at) {
  if (!joined_at) return null
  const y = new Date().getFullYear() - new Date(joined_at).getFullYear()
  return y < 1 ? 'menys d\'1 any' : `${y} any${y !== 1 ? 's' : ''}`
}
function deriveInitials(fn, ln) {
  return ((fn?.trim()[0] ?? '') + (ln?.trim()[0] ?? '')).toUpperCase() || '?'
}
function deriveName(fn, ln) { return [fn, ln].filter(Boolean).join(' ') }

const ALL_VOICES = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']
const ROLES = Object.keys(ROLE_LABELS)
const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600'
const labelCls = 'text-xs text-gray-500 mb-1 block'

// ─── Voice dropdown ───────────────────────────────────────────
function VoiceSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const c = VOICE_COLORS[value] ?? VOICE_COLORS.extra

  useEffect(() => {
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 text-sm transition-colors">
        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: c.bg }} />
        <span className="flex-1 text-left text-white">{VOICE_LABELS[value] ?? value}</span>
        <ChevronDown size={13} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1 overflow-hidden">
          {ALL_VOICES.map(v => {
            const vc = VOICE_COLORS[v]
            const isSelected = v === value
            return (
              <button key={v} type="button"
                onClick={() => { onChange(v); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-700/60'}`}>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: vc.bg }} />
                <span style={{ color: isSelected ? vc.bg : undefined }}
                  className={isSelected ? 'font-medium' : 'text-gray-300'}>
                  {VOICE_LABELS[v]}
                </span>
                {isSelected && <span className="ml-auto text-[10px]" style={{ color: vc.bg }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Profile view ─────────────────────────────────────────────
function ProfileView({ member, onEdit }) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  const initials = (member.initials || deriveInitials(member.first_name, member.last_name)).slice(0, 3)
  const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.name || '—'
  const age = calcAge(member.birth_date)
  const tenure = yearsInChoir(member.joined_at)

  const rows = [
    age != null      && { icon: Calendar, label: 'Edat',      value: `${age} anys` },
    member.height    && { icon: Ruler,    label: 'Alçada',    value: `${member.height} cm` },
    tenure           && { icon: UserPlus, label: 'Al cor',    value: tenure },
    member.google_account && { icon: Mail,  label: 'Google',   value: member.google_account },
    member.instagram && { icon: AtSign,   label: 'Instagram', value: `@${member.instagram}` },
  ].filter(Boolean)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0 flex items-start gap-4"
        style={{ borderBottom: `1px solid ${c.bg}33` }}>
        <span className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{ backgroundColor: c.bg, color: c.fg }}>
          {initials}
        </span>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-white font-semibold text-base leading-tight">{fullName}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {member.voice && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: c.bg + '33', color: c.bg }}>
                {VOICE_LABELS[member.voice] ?? member.voice}
              </span>
            )}
            {member.role && member.role !== 'choir' && (
              <span className="text-xs text-gray-500">{ROLE_LABELS[member.role] ?? member.role}</span>
            )}
            {member.active === false && (
              <span className="text-xs text-yellow-700 font-medium">De baixa</span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {rows.length > 0 ? rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={13} className="text-gray-600 shrink-0" />
            <span className="text-gray-500 text-xs w-20 shrink-0">{label}</span>
            <span className="text-white text-sm truncate">{value}</span>
          </div>
        )) : (
          <p className="text-gray-600 text-xs text-center py-3">Sense dades addicionals</p>
        )}
      </div>

      {/* Footer */}
      {onEdit && (
        <div className="px-5 pb-5 shrink-0">
          <button onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition-colors">
            <Pencil size={13} /> Editar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Edit form ────────────────────────────────────────────────
function EditForm({ member, isNew, onSave, onBack, onSetActive, onDelete }) {
  const [firstName, setFirstName] = useState(member?.first_name ?? (member?.name?.split(' ')[0] ?? ''))
  const [lastName,  setLastName]  = useState(member?.last_name  ?? (member?.name?.split(' ').slice(1).join(' ') ?? ''))
  const [initials,  setInitials]  = useState(member?.initials ?? '')
  const [voice,     setVoice]     = useState(member?.voice ?? 'soprano1')
  const [role,      setRole]      = useState(member?.role ?? 'choir')
  const [google,    setGoogle]    = useState(member?.google_account ?? '')
  const [instagram, setInstagram] = useState(member?.instagram ?? '')
  const [height,    setHeight]    = useState(member?.height ?? '')
  const [birthDate, setBirthDate] = useState(member?.birth_date ?? '')
  const [joinedAt,  setJoinedAt]  = useState(member?.joined_at ?? '')

  const autoInitials = deriveInitials(firstName, lastName)
  const isInactive = member?.active === false

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      name: deriveName(firstName, lastName),
      initials: (initials.trim().toUpperCase().slice(0, 3) || autoInitials),
      voice, role,
      google_account: google.trim(),
      instagram: instagram.trim().replace(/^@/, ''),
      height: height ? parseInt(height) : null,
      birth_date: birthDate || null,
      joined_at:  joinedAt  || null,
    })
  }

  const c = VOICE_COLORS[voice] ?? VOICE_COLORS.extra
  const displayInitials = (initials.trim().toUpperCase() || autoInitials).slice(0, 3)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      {/* Edit header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-800 shrink-0">
        {!isNew && (
          <button type="button" onClick={onBack}
            className="text-gray-500 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: c.bg, color: c.fg }}>
          {displayInitials}
        </span>
        <span className="text-white font-medium text-sm flex-1 truncate">
          {deriveName(firstName, lastName) || 'Editar persona'}
        </span>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Nom *</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required
              placeholder="Anna" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Cognoms *</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} required
              placeholder="Soler" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Inicials al canvas</label>
          <input value={initials || autoInitials} onChange={e => setInitials(e.target.value.slice(0, 3))}
            placeholder={autoInitials} className={inputCls + ' uppercase'} />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Rol</label>
          <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {role === 'choir' && (
          <div className="space-y-1">
            <label className={labelCls}>Corda / veu *</label>
            <VoiceSelect value={voice} onChange={setVoice} />
          </div>
        )}

        <div className="border-t border-gray-800 pt-4 space-y-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Contacte</p>
          <div className="space-y-1">
            <label className={labelCls}>Google</label>
            <input value={google} onChange={e => setGoogle(e.target.value)} type="email"
              placeholder="nom@gmail.com" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Instagram</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)}
              placeholder="handle (sense @)" className={inputCls} />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 space-y-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Dades personals</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Alçada (cm)</label>
              <input value={height} onChange={e => setHeight(e.target.value)} type="number"
                min="100" max="220" placeholder="170" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Entrada al cor</label>
              <input value={joinedAt} onChange={e => setJoinedAt(e.target.value)} type="date"
                className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Data de naixement</label>
            <input value={birthDate} onChange={e => setBirthDate(e.target.value)} type="date"
              className={inputCls} />
          </div>
        </div>

        <div className="pt-1 pb-2">
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            {isNew ? 'Crear persona' : 'Guardar canvis'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      {onSetActive && onDelete && (
        <div className="border-t border-gray-800 px-5 py-3 shrink-0 flex gap-2">
          {isInactive ? (
            <button type="button" onClick={() => onSetActive(member.id, true)}
              className="flex-1 text-xs text-green-600 hover:text-green-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              Reactivar
            </button>
          ) : (
            <button type="button" onClick={() => onSetActive(member.id, false)}
              className="flex-1 text-xs text-yellow-600 hover:text-yellow-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              Donar de baixa
            </button>
          )}
          <button type="button" onClick={() => onDelete(member.id)}
            className="flex-1 text-xs text-red-800 hover:text-red-500 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            Eliminar
          </button>
        </div>
      )}
    </form>
  )
}

// ─── Main overlay ─────────────────────────────────────────────
export default function PersonProfileOverlay({ member, isNew, onClose, onSave, onSetActive, onDelete }) {
  const [editing, setEditing] = useState(!!isNew)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { editing && !isNew ? setEditing(false) : onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editing, isNew])

  // Reset to view mode when member changes
  useEffect(() => { setEditing(!!isNew) }, [member?.id, isNew])

  if (!member) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => editing && !isNew ? setEditing(false) : onClose()} />

      {/* Card */}
      <div className="relative z-10 bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl w-full max-w-xs flex flex-col"
        style={{ height: 'min(90vh, 580px)', overflow: 'hidden' }}>

        {/* Close button (top-right) */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-600 hover:text-white transition-colors p-1">
          <X size={14} />
        </button>

        {editing ? (
          <EditForm
            member={member}
            isNew={isNew}
            onBack={() => setEditing(false)}
            onSave={fields => { onSave?.(fields); setEditing(false) }}
            onSetActive={onSetActive}
            onDelete={onDelete} />
        ) : (
          <ProfileView
            member={member}
            onEdit={onSave ? () => setEditing(true) : null} />
        )}
      </div>
    </div>
  )
}
