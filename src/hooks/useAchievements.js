// src/hooks/useAchievements.js
// Loads and awards achievements for the currently logged-in user.
// Provides helper functions to check thresholds after key user actions.

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth.jsx'
import { useMyMember } from './useMyMember.js'
import { calcAttendedCount, calcAttendanceStreak, calcTotalXP } from '../lib/achievements.js'

// ─── Internal: award a single achievement ────────────────────────────────────
async function awardAchievement(userId, achievementKey) {
  const { data, error } = await supabase.from('user_achievements').insert({
    user_id:         userId,
    achievement_key: achievementKey,
    progress:        100,
  })
  if (error) return null
  return Array.isArray(data) ? data[0] : data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export default function useAchievements() {
  const { user } = useAuth()
  const myMember = useMyMember()
  const [earned, setEarned]         = useState([])  // user_achievements rows
  const [loading, setLoading]       = useState(true)
  const [newlyEarned, setNewlyEarned] = useState([]) // keys of just-unlocked badges
  const checkedRef = useRef(false)   // prevent duplicate on-mount checks

  // ─── Load earned achievements for the current user ──────────────────────
  const loadEarned = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
    setEarned(data ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadEarned() }, [loadEarned])

  // ─── Dismiss "newly earned" toast ───────────────────────────────────────
  const dismissNew = useCallback(() => setNewlyEarned([]), [])

  // ─── Core: award if not already earned ──────────────────────────────────
  const awardIfNew = useCallback(async (key) => {
    if (!user?.id) return false
    if (earned.some(e => e.achievement_key === key)) return false
    const row = await awardAchievement(user.id, key)
    if (row) {
      setEarned(prev => [row, ...prev])
      setNewlyEarned(prev => [...prev, key])
      return true
    }
    return false
  }, [user?.id, earned])

  // ─── Check attendance-based achievements ─────────────────────────────────
  const checkAttendanceAchievements = useCallback(async () => {
    if (!user?.id || !myMember?.id) return []
    const nowStr = new Date().toISOString().slice(0, 10)

    const [rehRes, attRes] = await Promise.all([
      supabase.from('rehearsals').select('id, date').order('date'),
      supabase.from('attendance').select('rehearsal_id, status').eq('member_id', myMember.id),
    ])

    const pastIds = (rehRes.data ?? [])
      .filter(r => r.date <= nowStr)
      .map(r => r.id)

    const attMap = Object.fromEntries(
      (attRes.data ?? []).map(a => [a.rehearsal_id, a.status])
    )

    const attended = calcAttendedCount(pastIds, attMap)

    const streakRows = pastIds.map(id => ({
      date:   (rehRes.data ?? []).find(r => r.id === id)?.date ?? '',
      status: attMap[id] ?? null,
    }))
    const streak = calcAttendanceStreak(streakRows)

    const unlocked = []
    const checks = [
      { key: 'first_rehearsal', pass: attended >= 1 },
      { key: 'loyal_10',        pass: attended >= 10 },
      { key: 'unstoppable_25',  pass: attended >= 25 },
      { key: 'streak_5',        pass: streak >= 5   },
      { key: 'streak_10',       pass: streak >= 10  },
    ]
    for (const { key, pass } of checks) {
      if (pass && await awardIfNew(key)) unlocked.push(key)
    }
    return unlocked
  }, [user?.id, myMember?.id, awardIfNew])

  // ─── Check feedback-based achievements ───────────────────────────────────
  const checkFeedbackAchievements = useCallback(async () => {
    if (!user?.id) return []
    const { data } = await supabase
      .from('feedback')
      .select('id')
      .eq('user_id', user.id)
    const count = (data ?? []).length
    const unlocked = []
    if (count >= 1 && await awardIfNew('first_feedback'))  unlocked.push('first_feedback')
    if (count >= 5 && await awardIfNew('collaborator_5')) unlocked.push('collaborator_5')
    return unlocked
  }, [user?.id, awardIfNew])

  // ─── Check engagement achievements (welcome + active days) ───────────────
  const checkEngagementAchievements = useCallback(async () => {
    if (!user?.id) return []
    const unlocked = []
    if (await awardIfNew('welcome')) unlocked.push('welcome')

    // active_days is maintained by updateActiveDay below
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_days')
      .eq('id', user.id)
      .single()
    const days = profile?.active_days ?? 0
    if (days >= 7  && await awardIfNew('week_active'))  unlocked.push('week_active')
    if (days >= 30 && await awardIfNew('month_active')) unlocked.push('month_active')
    return unlocked
  }, [user?.id, awardIfNew])

  // ─── Track daily app activity ─────────────────────────────────────────────
  const updateActiveDay = useCallback(async () => {
    if (!user?.id) return
    const today = new Date().toISOString().slice(0, 10)
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_active_at, active_days')
      .eq('id', user.id)
      .single()
    if (!profile) return
    const lastDate = profile.last_active_at?.slice(0, 10)
    if (lastDate === today) return  // already counted today
    await supabase.from('profiles').update({
      last_active_at: new Date().toISOString(),
      active_days:    (profile.active_days ?? 0) + 1,
    }).eq('id', user.id)
  }, [user?.id])

  // ─── On-mount: run engagement checks once ────────────────────────────────
  useEffect(() => {
    if (!user?.id || loading || checkedRef.current) return
    checkedRef.current = true
    updateActiveDay().then(() => checkEngagementAchievements())
  }, [user?.id, loading, updateActiveDay, checkEngagementAchievements])

  const earnedKeys = earned.map(e => e.achievement_key)
  const totalXP    = calcTotalXP(earnedKeys)

  return {
    earned,
    earnedKeys,
    totalXP,
    loading,
    newlyEarned,
    dismissNew,
    checkAttendanceAchievements,
    checkFeedbackAchievements,
    checkEngagementAchievements,
    refetch: loadEarned,
  }
}

// ─── Standalone: load achievements for any user_id (profile overlay) ─────────
export async function loadAchievementsForUser(userId) {
  if (!userId) return []
  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_key, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  return data ?? []
}
