import { useState } from 'react'
import { useClickOutside } from '../hooks/useClickOutside.js'
import { LogOut, Eye, EyeOff, X, ChevronDown, Sun, Moon, Monitor, ChevronRight } from '../lib/icons'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useChoir } from '../hooks/useChoir.jsx'
import { VOICE_COLORS } from '../lib/constants.js'

function getInitials(profile, user) {
  if (profile?.full_name) {
    return profile.full_name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (user?.email?.[0] ?? '?').toUpperCase()
}

const THEME_OPTIONS = [
  { key: 'light',  label: 'Clar',    Icon: Sun },
  { key: 'dark',   label: 'Fosc',    Icon: Moon },
  { key: 'system', label: 'Sistema', Icon: Monitor },
]

export default function ProfileMenu({ onSignOut, expanded = true }) {
  const { user, profile, role, isSimulating, exitSimulation } = useAuth()
  const { theme, setTheme } = useTheme()
  const { choirs, currentChoirId, switchChoir } = useChoir()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))

  const initials = getInitials(profile, user)
  const displayName = profile?.full_name ?? user?.email ?? ''
  const displayRole = role ?? 'member'
  const multiChoir = choirs.length > 1
  const currentChoir = choirs.find(c => c.id === currentChoirId)
  const voiceColor = profile?.voice ? VOICE_COLORS[profile.voice] : null
  const avatarStyle = voiceColor
    ? { backgroundColor: voiceColor.bg, color: voiceColor.fg }
    : { backgroundColor: '#0e7490', color: '#fff' } // cyan-700 fallback

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-fill transition-colors ${
          isSimulating ? 'ring-1 ring-amber-500/60' : ''
        }`}
      >
        <div className="relative shrink-0">
          <div
            style={avatarStyle}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {initials}
          </div>
          {isSimulating && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-pane" />
          )}
        </div>
        {expanded && (
          <>
            <span className="text-sm text-soft max-w-[120px] truncate">{displayName}</span>
            <ChevronDown size={13} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-pane border border-line rounded-xl shadow-2xl z-50 overflow-hidden">

          {/* Simulació activa — banner */}
          {isSimulating && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/40">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
                <Eye size={11} /> Simulació activa
              </span>
              <button onClick={exitSimulation}
                className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
                <X size={11} /> Sortir
              </button>
            </div>
          )}

          {/* Capçalera de perfil */}
          <div className="px-4 py-3 border-b border-rim">
            <div className="flex items-center gap-3">
              <div
                style={avatarStyle}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-body truncate">{profile?.full_name ?? '—'}</p>
                <p className="text-xs text-faint truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded text-xs uppercase tracking-wide bg-raised text-soft">
                {displayRole}
              </span>
            </div>
          </div>

          {/* Selector de cor */}
          {multiChoir && (
            <div className="px-4 py-3 border-b border-rim">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">Cor actiu</span>
              <div className="flex flex-col gap-1">
                {choirs.map(c => (
                  <button key={c.id}
                    onClick={() => { switchChoir(c.id); setOpen(false) }}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      c.id === currentChoirId
                        ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-300'
                        : 'text-muted hover:bg-fill hover:text-body'
                    }`}>
                    <span className="truncate">{c.name}</span>
                    {c.id === currentChoirId && <ChevronRight size={12} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tema — icon-only toggle group */}
          <div className="px-4 py-3 border-b border-rim">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">Tema</span>
            <div className="flex gap-1 bg-fill rounded-lg p-1">
              {THEME_OPTIONS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTheme(key)} title={label}
                  className={`flex items-center justify-center flex-1 py-1.5 rounded-md transition-colors ${
                    theme === key
                      ? 'bg-pane text-body shadow-sm'
                      : 'text-faint hover:text-muted'
                  }`}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

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
