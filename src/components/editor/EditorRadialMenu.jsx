import { Crosshair, MicVocal, UserRound, Waypoints, X, MoreHorizontal } from '../../lib/icons'
import RadialMenu from './RadialMenu'

// Wires the generic RadialMenu to editor actions for a member token.
// "Més…" falls through to the full context menu (mic picker, etc.).
export default function EditorRadialMenu({
  contextMenu, highlightId, momentSoloists, placements,
  onClose, onSetHighlight, onToggleSoloist, onSetProfile,
  onEnterTrajectory, onRemovePlacement, onMore,
  VOICE_COLORS,
}) {
  if (!contextMenu) return null
  const m = contextMenu.member
  const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
  const isMe = highlightId === m.id
  const isSoloist = momentSoloists.some(s => s.member_id === m.id)
  const isPlaced = !!placements[m.id]

  const items = [
    { id: 'focus', Icon: Crosshair, label: 'Focus', color: 'cyan', active: isMe,
      onSelect: () => { const v = isMe ? '' : m.id; onSetHighlight(v); localStorage.setItem('highlightMemberId', v); onClose() } },
    { id: 'soloist', Icon: MicVocal, label: 'Solista', color: 'amber', active: isSoloist,
      onSelect: () => { onToggleSoloist(m.id); onClose() } },
    { id: 'profile', Icon: UserRound, label: 'Perfil',
      onSelect: () => { onSetProfile(m); onClose() } },
    ...(m.role !== 'director' ? [{ id: 'traj', Icon: Waypoints, label: 'Traject.', color: 'violet',
      onSelect: () => { onEnterTrajectory(m.id); onClose() } }] : []),
    ...(isPlaced ? [{ id: 'remove', Icon: X, label: 'Treure', color: 'red',
      onSelect: () => { onRemovePlacement(m.id); onClose() } }] : []),
    { id: 'more', Icon: MoreHorizontal, label: 'Més…', onSelect: onMore },
  ]

  return (
    <RadialMenu x={contextMenu.x} y={contextMenu.y} items={items} onClose={onClose}
      hub={{ initials: (m.initials || m.name.slice(0, 2)).toUpperCase(), bg: c.bg, fg: c.fg, label: m.name }} />
  )
}
