-- ============================================================
-- Choir Positions — Migració: disseny de llums + rider tècnic
-- Executa-ho a l'editor SQL de Supabase (després de supabase-schema.sql)
-- ============================================================

-- Lletres al repertori global
alter table repertoire_songs add column if not exists lyrics text;

-- ─── Cues de llum ────────────────────────────────────────────
-- Una "memòria" de la taula de llums. Ordenades per cue_number
-- (numeric per permetre sub-cues tipus 16.5).
-- Cada banda té 3 focus independents (esquerra/centre/dreta) amb
-- intensitat en 5 passes: 0 = apagat … 4 = 100%.
create table if not exists light_cues (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows on delete cascade not null,
  song_id uuid references songs on delete cascade,          -- null = cue estructural (teló, diàleg, track…)
  moment_id uuid references moments on delete set null,      -- enllaç opcional amb un moment de coreografia
  cue_number numeric not null,
  trigger_type text not null default 'lyric' check (trigger_type in ('lyric','action','structural')),
  trigger_text text,                                         -- línia de lletra o acció escènica
  lyric_line integer,                                        -- índex de línia dins la lletra de la cançó
  front_levels text not null default '{"esquerra":0,"centre":0,"dreta":0}',  -- JSON, valors 0-4
  back_levels text not null default '{"esquerra":0,"centre":0,"dreta":0}',
  front_color text,                                          -- id de la paleta (src/lib/lights.js)
  back_color text,
  scope text not null default 'tots' check (scope in ('tots','cor','solistes')),
  effects text not null default '[]',                        -- JSON: ["fosc","barrido","chase","mobils","stop_mov","sala","public"]
  followspots text not null default '[]',                    -- JSON: [{ "label": "Canó 1", "position": "centre", "member_id": null }]
  transition text not null default 'tall' check (transition in ('tall','prog')),
  transition_seconds numeric,
  notes text,
  created_at timestamptz default now()
);
create index if not exists light_cues_show_idx on light_cues (show_id, cue_number);
alter table light_cues enable row level security;
create policy "Admins full access on light_cues" on light_cues using (is_admin());
create policy "Director manages light_cues of own shows" on light_cues for all using (
  exists (select 1 from shows where id = light_cues.show_id and created_by = auth.uid())
);
create policy "Member reads light_cues of their shows" on light_cues for select using (
  exists (select 1 from members where show_id = light_cues.show_id and user_id = auth.uid())
);

-- ─── Presets de llum ─────────────────────────────────────────
-- "Looks" reutilitzables per show (p. ex. "Tornada càlida ++FR").
create table if not exists light_presets (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows on delete cascade not null,
  name text not null,
  front_levels text not null default '{"esquerra":0,"centre":0,"dreta":0}',
  back_levels text not null default '{"esquerra":0,"centre":0,"dreta":0}',
  front_color text,
  back_color text,
  scope text not null default 'tots' check (scope in ('tots','cor','solistes')),
  effects text not null default '[]',
  transition text not null default 'tall' check (transition in ('tall','prog')),
  transition_seconds numeric,
  created_at timestamptz default now()
);
alter table light_presets enable row level security;
create policy "Admins full access on light_presets" on light_presets using (is_admin());
create policy "Director manages light_presets of own shows" on light_presets for all using (
  exists (select 1 from shows where id = light_presets.show_id and created_by = auth.uid())
);
create policy "Member reads light_presets of their shows" on light_presets for select using (
  exists (select 1 from members where show_id = light_presets.show_id and user_id = auth.uid())
);
