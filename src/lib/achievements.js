// src/lib/achievements.js
// Achievement definitions (mirroring DB seed) and utility functions.
// Pure logic — no React, no side-effects.

// ─── Category metadata ────────────────────────────────────────────────────────
export const ACHIEVEMENT_CATEGORIES = {
  attendance:   { key: 'attendance',   label: 'Assistència',  colorCls: 'text-amber-400  bg-amber-400/15  border-amber-400/30'  },
  engagement:   { key: 'engagement',   label: 'Participació', colorCls: 'text-cyan-400   bg-cyan-400/15   border-cyan-400/30'   },
  contribution: { key: 'contribution', label: 'Contribució',  colorCls: 'text-violet-400 bg-violet-400/15 border-violet-400/30' },
}

// ─── Achievement definitions ──────────────────────────────────────────────────
// Must stay in sync with supabase-migration-gamification.sql seeds.
export const ACHIEVEMENTS = [
  // ── Attendance ──────────────────────────────────────────────────────────────
  {
    key:         'first_rehearsal',
    category:    'attendance',
    name:        'Primer assaig',
    description: 'Has assistit al primer assaig',
    icon:        'achieveTrophy',
    threshold:   1,
    xp:          10,
  },
  {
    key:         'loyal_10',
    category:    'attendance',
    name:        'Assistent fidel',
    description: 'Has assistit a 10 assajos',
    icon:        'achieveTrophy',
    threshold:   10,
    xp:          50,
  },
  {
    key:         'unstoppable_25',
    category:    'attendance',
    name:        'Incansable',
    description: 'Has assistit a 25 assajos',
    icon:        'achieveStar',
    threshold:   25,
    xp:          100,
  },
  {
    key:         'streak_5',
    category:    'attendance',
    name:        'Ratxa de 5',
    description: '5 assajos consecutius sense faltar',
    icon:        'achieveFlame',
    threshold:   5,
    xp:          30,
  },
  {
    key:         'streak_10',
    category:    'attendance',
    name:        'Ratxa de 10',
    description: '10 assajos consecutius sense faltar',
    icon:        'achieveFlame',
    threshold:   10,
    xp:          75,
  },
  {
    key:         'perfect_show',
    category:    'attendance',
    name:        'Assistència perfecta',
    description: "100% d'assistència en un espectacle",
    icon:        'achieveStar',
    threshold:   1,
    xp:          150,
  },

  // ── Engagement ──────────────────────────────────────────────────────────────
  {
    key:         'welcome',
    category:    'engagement',
    name:        'Benvingut/da',
    description: "Primera entrada a l'aplicació",
    icon:        'achieveWelcome',
    threshold:   1,
    xp:          5,
  },
  {
    key:         'week_active',
    category:    'engagement',
    name:        'Setmana activa',
    description: "7 dies actiu/va a l'app",
    icon:        'achieveFlame',
    threshold:   7,
    xp:          25,
  },
  {
    key:         'month_active',
    category:    'engagement',
    name:        'Mes actiu',
    description: "30 dies actiu/va a l'app",
    icon:        'achieveCrown',
    threshold:   30,
    xp:          100,
  },

  // ── Contribution ────────────────────────────────────────────────────────────
  {
    key:         'first_feedback',
    category:    'contribution',
    name:        'Primera veu',
    description: 'Has enviat el primer suggeriment',
    icon:        'achieveContrib',
    threshold:   1,
    xp:          10,
  },
  {
    key:         'collaborator_5',
    category:    'contribution',
    name:        'Col·laborador/a',
    description: 'Has enviat 5 suggeriments',
    icon:        'achieveContrib',
    threshold:   5,
    xp:          50,
  },
  {
    key:         'early_bird',
    category:    'contribution',
    name:        'Puntual',
    description: 'Has confirmat 10 assistències anticipadament',
    icon:        'achieveBadge',
    threshold:   10,
    xp:          25,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up an achievement definition by key. */
export function getAchievement(key) {
  return ACHIEVEMENTS.find(a => a.key === key) ?? null
}

/**
 * Sum total XP for a list of earned achievement keys.
 * @param {string[]} earnedKeys
 */
export function calcTotalXP(earnedKeys) {
  return earnedKeys.reduce((sum, key) => {
    const def = getAchievement(key)
    return sum + (def?.xp ?? 0)
  }, 0)
}

/**
 * Given a list of { rehearsal_id, date, status } rows (all past rehearsals
 * with their attendance status for one member), compute the current streak
 * of consecutive rehearsals attended.
 *
 * Rules:
 *  - 'present' (or no status row) counts as attended and continues the streak.
 *  - 'excused' does NOT break the streak but does NOT increment it.
 *  - 'absent' breaks the streak.
 *
 * @param {Array<{date: string, status: string|null}>} rows
 * @returns {number}
 */
export function calcAttendanceStreak(rows) {
  const sorted = [...rows].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
  let streak = 0
  for (const row of sorted) {
    const s = row.status
    if (s === 'absent') break
    if (!s || s === 'present') streak++
    // 'excused' → continue loop without breaking or incrementing
  }
  return streak
}

/**
 * From a list of all-time rehearsal attendance for one member,
 * compute how many they actually attended (present or no record = present).
 *
 * @param {string[]} allPastIds  - all rehearsal IDs with date <= today
 * @param {Record<string,string>} attMap - rehearsalId → status
 * @returns {number}
 */
export function calcAttendedCount(allPastIds, attMap) {
  return allPastIds.filter(id => {
    const s = attMap[id]
    return !s || s === 'present'
  }).length
}
