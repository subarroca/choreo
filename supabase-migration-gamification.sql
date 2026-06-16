-- ============================================================
-- Gamification: achievements & user progress
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Achievement definitions (seeded, read-only to clients) ──
CREATE TABLE IF NOT EXISTS achievements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text UNIQUE NOT NULL,
  category    text NOT NULL CHECK (category IN ('attendance', 'engagement', 'contribution')),
  name        text NOT NULL,
  description text NOT NULL,
  icon_key    text NOT NULL,
  threshold   integer NOT NULL DEFAULT 1,
  xp_reward   integer NOT NULL DEFAULT 10,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select" ON achievements FOR SELECT USING (true);

-- ── Per-user earned achievements ────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES achievements(key) ON DELETE CASCADE,
  earned_at       timestamptz DEFAULT now(),
  progress        integer NOT NULL DEFAULT 100,
  UNIQUE (user_id, achievement_key)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua_select"  ON user_achievements FOR SELECT USING (true);
CREATE POLICY "ua_insert"  ON user_achievements FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ua_update"  ON user_achievements FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "ua_delete"  ON user_achievements FOR DELETE  USING (auth.uid() = user_id);

-- ── Add activity tracking to profiles ───────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_days    integer NOT NULL DEFAULT 0;

-- ── Seed achievement definitions ─────────────────────────────
INSERT INTO achievements (key, category, name, description, icon_key, threshold, xp_reward) VALUES
  -- Attendance
  ('first_rehearsal',   'attendance',   'Primer assaig',         'Has assistit al primer assaig',                 'achieveTrophy',    1,   10),
  ('loyal_10',          'attendance',   'Assistent fidel',       'Has assistit a 10 assajos',                     'achieveTrophy',    10,  50),
  ('unstoppable_25',    'attendance',   'Incansable',            'Has assistit a 25 assajos',                     'achieveStar',      25,  100),
  ('streak_5',          'attendance',   'Ratxa de 5',            '5 assajos consecutius sense faltar',            'achieveFlame',     5,   30),
  ('streak_10',         'attendance',   'Ratxa de 10',           '10 assajos consecutius sense faltar',           'achieveFlame',     10,  75),
  ('perfect_show',      'attendance',   'Assistència perfecta',  '100% d''assistència en un espectacle',          'achieveStar',      1,   150),
  -- Engagement
  ('welcome',           'engagement',   'Benvingut/da',          'Primera entrada a l''aplicació',                'achieveWelcome',   1,   5),
  ('week_active',       'engagement',   'Setmana activa',        '7 dies actiu/va a l''app',                      'achieveFlame',     7,   25),
  ('month_active',      'engagement',   'Mes actiu',             '30 dies actiu/va a l''app',                     'achieveCrown',     30,  100),
  -- Contribution
  ('first_feedback',    'contribution', 'Primera veu',           'Has enviat el primer suggeriment',              'achieveContrib',   1,   10),
  ('collaborator_5',    'contribution', 'Col·laborador/a',       'Has enviat 5 suggeriments',                     'achieveContrib',   5,   50),
  ('early_bird',        'contribution', 'Puntual',               'Has confirmat 10 assistències anticipadament',  'achieveBadge',     10,  25)
ON CONFLICT (key) DO NOTHING;
