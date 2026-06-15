// Demo seed data: rehearsals every Tuesday for Cor del Condal
// Past sessions + upcoming through September. Only absent/excused rows stored (present = default).
// Fields: date, time, location, type stored at top-level for easy querying.

const CONDAL_SHOW_ID = 'dev-show-condal2026'

export const SEED_REHEARSALS = [
  { id: 'reh-01', date: '2026-04-07', time: '20:00', location: 'Sala Condal', type: 'ambdues',   notes: null,                     song_ids: '["rep-01","rep-03","rep-05"]' },
  { id: 'reh-02', date: '2026-04-14', time: '20:00', location: 'Sala Condal', type: 'veu',       notes: null,                     song_ids: '["rep-02","rep-04","rep-06"]' },
  { id: 'reh-03', date: '2026-04-21', time: '18:00', location: 'Sala Gran',   type: 'ambdues',   notes: 'Sant Jordi — especial',  song_ids: '["rep-07","rep-08","rep-09"]' },
  { id: 'reh-04', date: '2026-04-28', time: '20:00', location: 'Sala Condal', type: 'coreo',     notes: null,                     song_ids: '["rep-01","rep-07","rep-10"]' },
  { id: 'reh-05', date: '2026-05-06', time: '20:00', location: 'Sala Condal', type: 'veu',       notes: null,                     song_ids: '["rep-03","rep-05","rep-11"]' },
  { id: 'reh-06', date: '2026-05-12', time: '20:00', location: 'Sala Condal', type: 'ambdues',   notes: null,                     song_ids: '["rep-02","rep-06","rep-12"]' },
  { id: 'reh-07', date: '2026-05-19', time: '20:00', location: 'Sala Condal', type: 'veu',       notes: 'Assaig amb piano',       song_ids: '["rep-04","rep-08","rep-13"]' },
  { id: 'reh-08', date: '2026-05-26', time: '20:00', location: 'Sala Condal', type: 'ambdues',   notes: null,                     song_ids: '["rep-01","rep-03","rep-07","rep-09"]' },
  { id: 'reh-09', date: '2026-06-02', time: '20:00', location: 'Sala Gran',   type: 'ambdues',   notes: 'Assaig general',         song_ids: '["rep-01","rep-02","rep-03","rep-04","rep-05","rep-06","rep-07","rep-08","rep-09"]' },
  { id: 'reh-10', date: '2026-06-09', time: '20:00', location: 'Sala Condal', type: 'posicions', notes: 'Assaig pre-estrena',     song_ids: '["rep-01","rep-02","rep-03","rep-04","rep-05","rep-06","rep-07","rep-08","rep-09"]' },
  { id: 'reh-11', date: '2026-06-16', time: '20:00', location: 'Sala Condal', type: 'ambdues',   notes: 'Repàs final de veu',     song_ids: '["rep-01","rep-03","rep-05","rep-07","rep-09"]', show_id: CONDAL_SHOW_ID },
  { id: 'reh-12', date: '2026-06-23', time: '20:00', location: 'Sala Condal', type: 'veu',       notes: 'Últims retocs de veu',   song_ids: '["rep-02","rep-04","rep-06","rep-08"]', show_id: CONDAL_SHOW_ID },
  // Setembre — nova temporada 2026-27
  { id: 'reh-13', date: '2026-09-08', time: '20:00', location: 'Sala Condal', type: 'veu',       notes: 'Inici temporada 2026–27', song_ids: '["rep-10","rep-11","rep-12"]' },
  { id: 'reh-14', date: '2026-09-15', time: '20:00', location: 'Sala Condal', type: 'ambdues',   notes: null,                     song_ids: '["rep-10","rep-11","rep-12","rep-13"]' },
  { id: 'reh-15', date: '2026-09-22', time: '20:00', location: 'Sala Condal', type: 'coreo',     notes: null,                     song_ids: '["rep-10","rep-11","rep-12","rep-13"]' },
]

export const SEED_REHEARSAL_SCHEDULE = [
  {
    id: 'sched-01',
    day_of_week: 2,
    time: '20:00',
    location: 'Sala Condal',
    active: true,
    notes: 'Horari habitual de temporada',
  },
]

// status: 'absent' | 'excused'   reason: 'viatge' | 'feina' | 'malaltia' | 'altre'
export const SEED_ATTENDANCE = [
  // ── reh-01 (07 abr) ──────────────────────────────────────────
  { rehearsal_id: 'reh-01', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-01', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-01', member_id: 'dev-m-t1-sp', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-01', member_id: 'dev-m-a2-cg', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-01', member_id: 'dev-m-s2-gl', status: 'excused', reason: 'malaltia' },

  // ── reh-02 (14 abr) ──────────────────────────────────────────
  { rehearsal_id: 'reh-02', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-02', member_id: 'dev-m-t1-jm', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-02', member_id: 'dev-m-a1-sr', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-02', member_id: 'dev-m-s1-sk', status: 'excused', reason: 'malaltia' },

  // ── reh-03 (21 abr — Sant Jordi) ─────────────────────────────
  { rehearsal_id: 'reh-03', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-03', member_id: 'dev-m-bar-5', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-03', member_id: 'dev-m-t1-sp', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-03', member_id: 'dev-m-a2-mg', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-03', member_id: 'dev-m-s2-ms', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-03', member_id: 'dev-m-a1-ng', status: 'absent',  reason: 'feina' },

  // ── reh-04 (28 abr) ──────────────────────────────────────────
  { rehearsal_id: 'reh-04', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-04', member_id: 'dev-m-t1-ll', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-04', member_id: 'dev-m-a2-cg', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-04', member_id: 'dev-m-s2-lm', status: 'absent',  reason: '' },

  // ── reh-05 (06 mai) ──────────────────────────────────────────
  { rehearsal_id: 'reh-05', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-bas-4', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-t1-dr', status: 'absent',  reason: 'altre' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-s2-lm', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-a1-mk', status: 'absent',  reason: 'feina' },

  // ── reh-06 (12 mai) ──────────────────────────────────────────
  { rehearsal_id: 'reh-06', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-t1-sp', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-a1-ai', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-a2-ar', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-bar-4', status: 'excused', reason: 'feina' },

  // ── reh-07 (19 mai — rehearsal with piano) ───────────────────
  { rehearsal_id: 'reh-07', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-t1-aa', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-s2-ic', status: 'absent',  reason: 'malaltia' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-a2-mfm',status: 'excused', reason: 'feina' },

  // ── reh-08 (26 mai) ──────────────────────────────────────────
  { rehearsal_id: 'reh-08', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-s2-lm', status: 'absent',  reason: 'malaltia' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-a1-sc', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-t1-mp', status: 'excused', reason: 'viatge' },

  // ── reh-09 (02 jun — full run-through) ───────────────────────
  { rehearsal_id: 'reh-09', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-t1-sp', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-a2-cg', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-s1-cd', status: 'absent',  reason: '' },

  // ── reh-10 (09 jun — pre-estrena) ────────────────────────────
  { rehearsal_id: 'reh-10', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-10', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-10', member_id: 'dev-m-a2-cg', status: 'absent',  reason: 'malaltia' },

  // ── reh-11 (16 jun — PROPER, avisos) ─────────────────────────
  { rehearsal_id: 'reh-11', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-11', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-11', member_id: 'dev-m-t1-aa', status: 'excused', reason: 'viatge' },

  // reh-12 (23 jun) i posteriors — sense avisos encara
]
