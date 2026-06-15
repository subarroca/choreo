-- Migration: feedback table
-- Run this in the Supabase SQL editor

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  message       text not null,
  url           text,
  category      text check (category in ('bug', 'millora', 'idea')) default 'millora',
  resolved      boolean not null default false,
  resolved_at   timestamptz,
  resolved_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Row Level Security
alter table feedback enable row level security;

-- Any authenticated user can insert their own feedback
create policy "feedback_insert" on feedback
  for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

-- Only admins and directors can read all feedback
create policy "feedback_select_admin" on feedback
  for select to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'director')
    )
  );

-- Only admins and directors can update (resolve/unresolve)
create policy "feedback_update_admin" on feedback
  for update to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'director')
    )
  );
