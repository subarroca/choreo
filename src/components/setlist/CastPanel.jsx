import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VOICE_COLORS, VOICE_LABELS } from '../../lib/constants'

export const VOICE_ORDER = ['soprano1','soprano2','alto1','alto2','tenor1','tenor2','baritone','bass']

function MemberChip({ member, excluded, onToggle, onEdit }) {
  const c = VOICE_COLORS[member.voice] ?? VOICE_COLORS.extra
  return (
    <div className={`flex items-center gap-1.5 rounded-lg text-xs border transition-all ${excluded ? 'opacity-40 border-line bg-fill/30' : 'bg-fill border-line'}`}>
      <button onClick={() => onToggle(member.id, excluded)}
        className="flex items-center gap-1.5 px-2 py-2 flex-1 text-left min-w-0"
        title={excluded ? `Afegir ${member.name}` : `Treure ${member.name}`}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          style={{ backgroundColor: excluded ? '#374151' : c.bg, color: excluded ? '#6b7280' : c.fg }}>
          {(member.initials || member.name?.slice(0, 2) || '?').toUpperCase()}
        </span>
        <span className={`truncate ${excluded ? 'text-ghost line-through' : 'text-gray-200'}`}>{member.name}</span>
      </button>
      <button onClick={() => onEdit(member)}
        className="text-ghost hover:text-body p-2.5 rounded-r-lg hover:bg-raised transition-colors shrink-0"
        title="Editar perfil">
        <Pencil size={13} />
      </button>
    </div>
  )
}

export default function CastPanel({ showId, allMembers, exclusions, onToggle, onEditMember }) {
  if (allMembers.length === 0) return null
  const byVoice = VOICE_ORDER
    .map(v => ({ voice: v, members: allMembers.filter(m => m.voice === v) }))
    .filter(g => g.members.length > 0)
  const ungrouped = allMembers.filter(m => !VOICE_ORDER.includes(m.voice))
  return (
    <div className="bg-pane border border-rim rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-soft">Membres d'aquest espectacle</h3>
        <Link to="/members" className="text-xs text-cyan-300 hover:text-cyan-400 transition-colors">Gestionar cor →</Link>
      </div>
      <p className="text-xs text-ghost">Clica el nom per incloure/excloure · <Pencil size={9} className="inline" /> per editar el perfil.</p>
      <div className="space-y-4">
        {byVoice.map(({ voice, members: vMembers }) => {
          const c = VOICE_COLORS[voice] ?? VOICE_COLORS.extra
          return (
            <div key={voice}>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: c.bg }}>
                {VOICE_LABELS[voice]}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {vMembers.map(m => (
                  <MemberChip key={m.id} member={m} excluded={exclusions.has(m.id)}
                    onToggle={onToggle} onEdit={onEditMember} />
                ))}
              </div>
            </div>
          )
        })}
        {ungrouped.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider text-faint">Altres</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ungrouped.map(m => (
                <MemberChip key={m.id} member={m} excluded={exclusions.has(m.id)}
                  onToggle={onToggle} onEdit={onEditMember} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
