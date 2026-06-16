// src/components/ui/AchievementsProgress.jsx
// Dashboard widget showing earned badges, XP, and a toast for new unlocks.
// Designed for the SingerDashboard — receives data from useAchievements hook.

import { useEffect } from 'react'
import { Icons } from '../../lib/icons'
import { ACHIEVEMENTS, getAchievement, ACHIEVEMENT_CATEGORIES } from '../../lib/achievements'
import { t } from '../../locales/ca'
import AchievementBadge from './AchievementBadge'

// ─── XP level label ───────────────────────────────────────────────────────────
function xpLevel(xp) {
  if (xp >= 400) return 'Llegenda'
  if (xp >= 200) return 'Expert/a'
  if (xp >= 100) return 'Avançat/da'
  if (xp >= 50)  return 'Regular'
  return 'Nou/nova'
}

// ─── Toast for newly unlocked badges ─────────────────────────────────────────
function NewBadgeToast({ achievementKeys, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  if (!achievementKeys.length) return null
  const def = getAchievement(achievementKeys[0])
  if (!def) return null

  return (
    <div className="flex items-center gap-2.5 bg-cyan-900/40 border border-cyan-500/40 rounded-xl px-3 py-2.5 mb-3 animate-fade-in">
      <AchievementBadge achievementKey={def.key} earned size="sm" showTooltip={false} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-cyan-300">{t.achievements.unlocked}</p>
        <p className="text-xs text-muted truncate">{def.name}</p>
      </div>
      <button onClick={onDismiss}
        className="text-ghost hover:text-body transition-colors shrink-0 p-0.5">
        <Icons.close size={12} />
      </button>
    </div>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function AchievementsProgress({ earnedKeys = [], totalXP = 0, newlyEarned = [], onDismissNew }) {
  const unearnedAchievements = ACHIEVEMENTS.filter(a => !earnedKeys.includes(a.key))
  const earnedCount = earnedKeys.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
          {t.achievements.title}
        </h3>
        <span className="text-xs text-muted">
          <span className="font-semibold text-body">{xpLevel(totalXP)}</span>
          {totalXP > 0 && (
            <span className="text-ghost ml-1.5">{t.achievements.totalXP(totalXP)}</span>
          )}
        </span>
      </div>

      {/* New badge toast */}
      {newlyEarned.length > 0 && (
        <NewBadgeToast achievementKeys={newlyEarned} onDismiss={onDismissNew} />
      )}

      {/* Earned badges grid */}
      {earnedCount === 0 ? (
        <p className="text-xs text-ghost text-center py-3">{t.achievements.noBadges}</p>
      ) : (
        <div className="bg-pane border border-rim rounded-xl p-3 mb-3">
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.filter(a => earnedKeys.includes(a.key)).map(a => (
              <AchievementBadge key={a.key} achievementKey={a.key} earned size="md" />
            ))}
          </div>
          <p className="text-xs text-ghost mt-2">
            {earnedCount} / {ACHIEVEMENTS.length} insígnies
            {totalXP > 0 && <span className="ml-2">{t.achievements.totalXP(totalXP)}</span>}
          </p>
        </div>
      )}

      {/* Next achievements to unlock */}
      {unearnedAchievements.length > 0 && (
        <div>
          <p className="text-xs text-ghost uppercase tracking-wide mb-2">{t.achievements.progress}</p>
          <div className="flex flex-col gap-1.5">
            {unearnedAchievements.slice(0, 3).map(a => {
              const cat = ACHIEVEMENT_CATEGORIES[a.category]
              return (
                <div key={a.key}
                  className="flex items-center gap-2.5 bg-fill/40 rounded-lg px-2.5 py-2 border border-rim/50">
                  <AchievementBadge achievementKey={a.key} earned={false} size="sm" showTooltip={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-soft truncate">{a.name}</p>
                    <p className="text-[10px] text-ghost truncate">{a.description}</p>
                  </div>
                  <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded ${cat.colorCls}`}>
                    +{a.xp} XP
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
