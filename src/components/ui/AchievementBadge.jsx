// src/components/ui/AchievementBadge.jsx
// Renders a single achievement as an icon tile.
// Props:
//   achievementKey — string key matching ACHIEVEMENTS
//   earned         — bool (true = full colour, false = greyed-out locked state)
//   size           — 'sm' | 'md' | 'lg'
//   showTooltip    — bool (default true — uses native title attribute)

import { Icons } from '../../lib/icons'
import { getAchievement, ACHIEVEMENT_CATEGORIES } from '../../lib/achievements'

const ICON_MAP = {
  achieveTrophy:   Icons.achieveTrophy,
  achieveStar:     Icons.achieveStar,
  achieveFlame:    Icons.achieveFlame,
  achieveCrown:    Icons.achieveCrown,
  achieveWelcome:  Icons.achieveWelcome,
  achieveContrib:  Icons.achieveContrib,
  achieveBadge:    Icons.achieveBadge,
}

const SIZE = {
  sm: { tile: 'w-8 h-8',   icon: 14 },
  md: { tile: 'w-10 h-10', icon: 16 },
  lg: { tile: 'w-12 h-12', icon: 20 },
}

export default function AchievementBadge({ achievementKey, earned = false, size = 'md', showTooltip = true }) {
  const def = getAchievement(achievementKey)
  if (!def) return null

  const Icon   = ICON_MAP[def.icon] ?? Icons.achieveTrophy
  const cat    = ACHIEVEMENT_CATEGORIES[def.category]
  const s      = SIZE[size] ?? SIZE.md
  const title  = showTooltip ? `${def.name} — ${def.description}` : undefined

  return (
    <div
      title={title}
      className={[
        'relative rounded-xl border flex items-center justify-center shrink-0 transition-opacity',
        s.tile,
        earned ? cat.colorCls : 'text-ghost bg-fill/50 border-rim opacity-30',
      ].join(' ')}
    >
      <Icon size={s.icon} />
    </div>
  )
}
