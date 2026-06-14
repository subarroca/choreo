import { useState, useRef, useEffect } from 'react'
import { LogOut, Eye, Pencil, EyeOff, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const SECTIONS = [
  { key: 'shows',      label: 'Espectacles' },
  { key: 'members',    label: 'Membres' },
  { key: 'repertoire', label: 'Repertori' },
]

function getInitials(profile, user) {
  if (profile?.full_name) {
    return profile.full_name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (user?.email?.[0] ?? '?').toUpperCase()
}

function SectionRow({ label, value, onChange }) {
  const opts = [
    { key: 'none',   label: 'Cap',    Icon: EyeOff  },
    { key: 'reader', label: 'Lector', Icon: Eye     },
    { key: 'editor', label: 'Editor', Icon: Pencil  },
  ]
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-24 shrink-0">{label}</span>
      <div className="flex gap-1">
        {opts.map(({ key, label: lbl, Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              value === key
                ? 'bg-cyan-700 text-cyan-100'
                : 'text-faint hover:text-soft hover:bg-raised'
            }`}
          >
            <Icon size={10} />
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProfileMenu({ onSignOut, expanded = true }) {
  const {
    user, profile, role,
    simulatedPermissions, setSimulatedPermissions,
    isSimulating, exitSimulation,
  } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const isAdmin = role === 'admin' || role === 'director'
  const displayRole = isAdmin ? 'admin' : role
  const initials = getInitials(profile, user)
  const displayName = profile?.full_name ?? user?.email ?? ''

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function getSectionMode(key) {
    if (!simulatedPermissions) return null
    const s = simulatedPermissions[key]
    if (s?.edit) return 'editor'
    if (s?.view) return 'reader'
    return 'none'
  }

  function handleSectionChange(key, mode) {
    const base = simulatedPermissions ?? {
      shows:      { view: true, edit: true },
      members:    { view: true, edit: true },
      repertoire: { view: true, edit: true },
    }
    setSimulatedPermissions({ ...base, [key]: { view: mode !== 'none', edit: mode === 'editor' } })
  }

  function setPreset(preset) {
    const val = preset === 'reader' ? { view: true, edit: false } : { view: true, edit: true }
    setSimulatedPermissions({ shows: val, members: val, repertoire: val })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-fill transition-colors ${
          isSimulating ? 'ring-1 ring-amber-500/60' : ''
        }`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isSimulating ? 'bg-amber-600' : 'bg-cyan-700'
        } text-body`}>
          {initials}
        </div>
        {expanded && (
          <>
            <span className="text-sm text-soft max-w-[120px] truncate">{displayName}</span>
            <ChevronDown size={13} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-72 bg-pane border border-line rounded-xl shadow-2xl z-50 overflow-hidden">

          {/* Capçalera de perfil */}
          <div className="px-4 py-3 border-b border-rim">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                isSimulating ? 'bg-amber-600' : 'bg-cyan-700'
              } text-body`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-body truncate">{profile?.full_name ?? '—'}</p>
                <p className="text-xs text-faint truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide ${
                isSimulating ? 'bg-amber-800/50 text-amber-300' : 'bg-raised text-soft'
              }`}>
                {isSimulating ? 'simulació activa' : displayRole}
              </span>
            </div>
          </div>

          {/* Controls de simulació (només admin/director) */}
          {isAdmin && (
            <div className="px-4 py-3 border-b border-rim">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Simular rol</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreset('reader')}
                    className="text-xs px-2 py-0.5 rounded bg-fill text-soft hover:bg-raised transition-colors"
                  >
                    Tot lector
                  </button>
                  <button
                    onClick={() => setPreset('editor')}
                    className="text-xs px-2 py-0.5 rounded bg-fill text-soft hover:bg-raised transition-colors"
                  >
                    Tot editor
                  </button>
                  {isSimulating && (
                    <button
                      onClick={exitSimulation}
                      className="flex items-center gap-0.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <X size={11} /> Reset
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {SECTIONS.map(s => (
                  <SectionRow
                    key={s.key}
                    label={s.label}
                    value={getSectionMode(s.key)}
                    onChange={mode => handleSectionChange(s.key, mode)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sortir */}
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted hover:text-body hover:bg-fill transition-colors"
          >
            <LogOut size={14} />
            Tancar sessió
          </button>
        </div>
      )}
    </div>
  )
}
