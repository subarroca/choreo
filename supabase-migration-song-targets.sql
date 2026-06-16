-- Add rehearsal target to repertoire_songs
-- Run in Supabase SQL editor

alter table repertoire_songs
  add column if not exists target_rehearsals smallint;
