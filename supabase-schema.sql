-- ============================================================
-- Choir Positions — Supabase schema + RLS
-- Run this in the Supabase SQL editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('member', 'director', 'admin'))
);
alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'member'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure handle_new_user();

-- Helper: is_admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- Shows
create table if not exists shows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  venue text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);
alter table shows enable row level security;
create policy "Admins full access on shows" on shows using (is_admin());
create policy "Director manages own shows" on shows for all using (created_by = auth.uid());
create policy "Member reads shows they belong to" on shows for select using (
  exists (select 1 from members where show_id = shows.id and user_id = auth.uid())
);

-- Members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows on delete cascade not null,
  name text not null,
  initials text,
  voice text check (voice in ('bass','baritone','tenor1','tenor2','alto1','alto2','soprano1','soprano2','director','musician','extra')),
  role text default 'choir' check (role in ('choir','director','musician','extra')),
  user_id uuid references auth.users nullable
);
alter table members enable row level security;
create policy "Admins full access on members" on members using (is_admin());
create policy "Director manages members of own shows" on members for all using (
  exists (select 1 from shows where id = members.show_id and created_by = auth.uid())
);
create policy "Member reads members of their shows" on members for select using (
  exists (select 1 from members m2 where m2.show_id = members.show_id and m2.user_id = auth.uid())
);

-- Songs
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  notes text
);
alter table songs enable row level security;
create policy "Admins full access on songs" on songs using (is_admin());
create policy "Director manages songs of own shows" on songs for all using (
  exists (select 1 from shows where id = songs.show_id and created_by = auth.uid())
);
create policy "Member reads songs of their shows" on songs for select using (
  exists (select 1 from members where show_id = songs.show_id and user_id = auth.uid())
);

-- Moments
create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  grid_mode text default 'square' check (grid_mode in ('square','alternate','free')),
  notes text
);
alter table moments enable row level security;
create policy "Admins full access on moments" on moments using (is_admin());
create policy "Director manages moments of own shows" on moments for all using (
  exists (
    select 1 from songs s join shows sh on sh.id = s.show_id
    where s.id = moments.song_id and sh.created_by = auth.uid()
  )
);
create policy "Member reads moments of their shows" on moments for select using (
  exists (
    select 1 from songs s join members m on m.show_id = s.show_id
    where s.id = moments.song_id and m.user_id = auth.uid()
  )
);

-- Positions
create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid references moments on delete cascade not null,
  member_id uuid references members on delete cascade not null,
  grid_row integer,
  grid_col integer,
  free_x float check (free_x between 0 and 1),
  free_y float check (free_y between 0 and 1),
  unique (moment_id, member_id)
);
alter table positions enable row level security;
create policy "Admins full access on positions" on positions using (is_admin());
create policy "Director manages positions of own shows" on positions for all using (
  exists (
    select 1 from moments mo
    join songs s on s.id = mo.song_id
    join shows sh on sh.id = s.show_id
    where mo.id = positions.moment_id and sh.created_by = auth.uid()
  )
);
create policy "Member reads positions of their shows" on positions for select using (
  exists (
    select 1 from moments mo
    join songs s on s.id = mo.song_id
    join members mem on mem.show_id = s.show_id
    where mo.id = positions.moment_id and mem.user_id = auth.uid()
  )
);

-- Versions (published snapshots — immutable)
create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references shows on delete cascade not null,
  label text not null,
  snapshot jsonb not null,
  published_by uuid references auth.users,
  published_at timestamptz default now(),
  is_current boolean default false
);
alter table versions enable row level security;
create policy "Admins full access on versions" on versions using (is_admin());
create policy "Director reads/creates versions of own shows" on versions for select using (
  exists (select 1 from shows where id = versions.show_id and created_by = auth.uid())
);
create policy "Director inserts versions" on versions for insert with check (
  exists (select 1 from shows where id = versions.show_id and created_by = auth.uid())
);
create policy "Director can update is_current only" on versions for update using (
  exists (select 1 from shows where id = versions.show_id and created_by = auth.uid())
);
-- Versions cannot be deleted (no delete policy)
create policy "Member reads current version of their shows" on versions for select using (
  is_current = true and
  exists (select 1 from members where show_id = versions.show_id and user_id = auth.uid())
);
