-- ============================================================
-- Migration: Hybrid permission model + RLS
-- Run in Supabase SQL editor (safe to re-run — idempotent)
-- ============================================================

-- ─── Helper functions ─────────────────────────────────────────────────────────

-- Replace old is_admin() to also include director role.
create or replace function is_privileged()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'director')
  )
$$;

-- Keep is_admin() as alias so any old policies still compile.
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select is_privileged()
$$;

-- Check a granular section permission for the current user.
-- p_mode: 'view' | 'edit'
create or replace function has_perm(p_section text, p_mode text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_permissions
    where user_id = auth.uid()
      and section = p_section
      and case p_mode
            when 'edit' then can_edit
            else can_view
          end = true
  )
$$;

-- Convenience: privileged users always pass, others need explicit perm.
create or replace function can(p_section text, p_mode text)
returns boolean language sql security definer stable as $$
  select is_privileged() or has_perm(p_section, p_mode)
$$;

-- ─── user_permissions ─────────────────────────────────────────────────────────

create table if not exists user_permissions (
  user_id  uuid  not null references auth.users on delete cascade,
  section  text  not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (user_id, section)
);

alter table user_permissions enable row level security;

-- Drop any stale policies before redefining.
drop policy if exists "Users read own permissions"  on user_permissions;
drop policy if exists "Privileged users manage permissions" on user_permissions;

-- Each user can only read their own rows.
create policy "Users read own permissions" on user_permissions
  for select using (auth.uid() = user_id);

-- Only admins/directors can write (insert, update, delete).
create policy "Privileged users manage permissions" on user_permissions
  for all using (is_privileged());

-- ─── profiles ─────────────────────────────────────────────────────────────────

-- Admin.jsx needs to list all profiles (not just the logged-in user's own).
drop policy if exists "Privileged users read all profiles" on profiles;
create policy "Privileged users read all profiles" on profiles
  for select using (is_privileged());

-- ─── shows ────────────────────────────────────────────────────────────────────

alter table shows enable row level security;

drop policy if exists "shows: authenticated read"  on shows;
drop policy if exists "shows: section write"       on shows;

create policy "shows: authenticated read" on shows
  for select using (auth.role() = 'authenticated');

create policy "shows: section write" on shows
  for all using (can('shows', 'edit'));

-- ─── parts ────────────────────────────────────────────────────────────────────

alter table parts enable row level security;

drop policy if exists "parts: authenticated read"  on parts;
drop policy if exists "parts: section write"       on parts;

create policy "parts: authenticated read" on parts
  for select using (auth.role() = 'authenticated');

create policy "parts: section write" on parts
  for all using (can('shows', 'edit'));

-- ─── songs (setlist) ─────────────────────────────────────────────────────────

-- The setlist `songs` table: part of show management.
alter table songs enable row level security;

drop policy if exists "songs: authenticated read"  on songs;
drop policy if exists "songs: section write"       on songs;

create policy "songs: authenticated read" on songs
  for select using (auth.role() = 'authenticated');

create policy "songs: section write" on songs
  for all using (can('shows', 'edit'));

-- ─── moments ─────────────────────────────────────────────────────────────────

alter table moments enable row level security;

drop policy if exists "moments: authenticated read" on moments;
drop policy if exists "moments: section write"      on moments;

create policy "moments: authenticated read" on moments
  for select using (auth.role() = 'authenticated');

-- Moments are edited via the staging editor.
create policy "moments: section write" on moments
  for all using (can('staging', 'edit'));

-- ─── positions ───────────────────────────────────────────────────────────────

alter table positions enable row level security;

drop policy if exists "positions: authenticated read" on positions;
drop policy if exists "positions: section write"      on positions;

create policy "positions: authenticated read" on positions
  for select using (auth.role() = 'authenticated');

create policy "positions: section write" on positions
  for all using (can('staging', 'edit'));

-- ─── soloists ────────────────────────────────────────────────────────────────

alter table soloists enable row level security;

drop policy if exists "soloists: authenticated read" on soloists;
drop policy if exists "soloists: section write"      on soloists;

create policy "soloists: authenticated read" on soloists
  for select using (auth.role() = 'authenticated');

-- Soloists are assigned in the staging editor or mics page.
create policy "soloists: section write" on soloists
  for all using (can('staging', 'edit') or can('mics', 'edit'));

-- ─── members (choir roster) ──────────────────────────────────────────────────

alter table members enable row level security;

drop policy if exists "members: authenticated read" on members;
drop policy if exists "members: section write"      on members;

create policy "members: authenticated read" on members
  for select using (auth.role() = 'authenticated');

create policy "members: section write" on members
  for all using (can('members', 'edit'));

-- ─── repertoire_songs ────────────────────────────────────────────────────────

alter table repertoire_songs enable row level security;

drop policy if exists "repertoire_songs: read with perm" on repertoire_songs;
drop policy if exists "repertoire_songs: section write"  on repertoire_songs;

-- Reading repertoire requires explicit view permission (or privileged).
create policy "repertoire_songs: read with perm" on repertoire_songs
  for select using (can('repertoire', 'view'));

create policy "repertoire_songs: section write" on repertoire_songs
  for all using (can('repertoire', 'edit'));

-- ─── light_cues ──────────────────────────────────────────────────────────────

alter table light_cues enable row level security;

drop policy if exists "light_cues: read with perm" on light_cues;
drop policy if exists "light_cues: section write"  on light_cues;

create policy "light_cues: read with perm" on light_cues
  for select using (can('lights', 'view'));

create policy "light_cues: section write" on light_cues
  for all using (can('lights', 'edit'));

-- ─── light_presets ───────────────────────────────────────────────────────────

alter table light_presets enable row level security;

drop policy if exists "light_presets: read with perm" on light_presets;
drop policy if exists "light_presets: section write"  on light_presets;

create policy "light_presets: read with perm" on light_presets
  for select using (can('lights', 'view'));

create policy "light_presets: section write" on light_presets
  for all using (can('lights', 'edit'));

-- ─── show_exclusions ─────────────────────────────────────────────────────────

alter table show_exclusions enable row level security;

drop policy if exists "show_exclusions: authenticated read" on show_exclusions;
drop policy if exists "show_exclusions: section write"      on show_exclusions;

create policy "show_exclusions: authenticated read" on show_exclusions
  for select using (auth.role() = 'authenticated');

create policy "show_exclusions: section write" on show_exclusions
  for all using (can('staging', 'edit'));

-- ─── rehearsals + attendance ─────────────────────────────────────────────────

alter table rehearsals enable row level security;

drop policy if exists "rehearsals: authenticated read" on rehearsals;
drop policy if exists "rehearsals: section write"      on rehearsals;

create policy "rehearsals: authenticated read" on rehearsals
  for select using (auth.role() = 'authenticated');

create policy "rehearsals: section write" on rehearsals
  for all using (can('attendance', 'edit'));

alter table attendance enable row level security;

drop policy if exists "attendance: authenticated read" on attendance;
drop policy if exists "attendance: section write"      on attendance;

create policy "attendance: authenticated read" on attendance
  for select using (auth.role() = 'authenticated');

create policy "attendance: section write" on attendance
  for all using (can('attendance', 'edit'));

-- ─── choirs (multi-choir support) ────────────────────────────────────────────

-- Choirs are read-only for all authenticated users; only admins manage them.
alter table choirs enable row level security;

drop policy if exists "choirs: authenticated read" on choirs;
drop policy if exists "choirs: admin write"        on choirs;

create policy "choirs: authenticated read" on choirs
  for select using (auth.role() = 'authenticated');

create policy "choirs: admin write" on choirs
  for all using (is_privileged());
