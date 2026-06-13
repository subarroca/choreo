// Demo seed data: rehearsals every Tuesday for Cor del Condal
// Past 10 sessions + 2 upcoming. Only absent/excused rows are stored (present = default).

export const SEED_REHEARSALS = [
  { id: 'reh-01', date: '2026-04-07', notes: 'Assaig ordinari' },
  { id: 'reh-02', date: '2026-04-14', notes: 'Assaig ordinari' },
  { id: 'reh-03', date: '2026-04-21', notes: 'Sant Jordi — assaig especial' },
  { id: 'reh-04', date: '2026-04-28', notes: 'Assaig ordinari' },
  { id: 'reh-05', date: '2026-05-05', notes: 'Assaig ordinari' },
  { id: 'reh-06', date: '2026-05-12', notes: 'Assaig ordinari' },
  { id: 'reh-07', date: '2026-05-19', notes: 'Assaig amb piano' },
  { id: 'reh-08', date: '2026-05-26', notes: 'Assaig ordinari' },
  { id: 'reh-09', date: '2026-06-02', notes: 'Assaig general' },
  { id: 'reh-10', date: '2026-06-09', notes: 'Assaig pre-estrena' },
  { id: 'reh-11', date: '2026-06-16', notes: 'Assaig pre-estrena' },
  { id: 'reh-12', date: '2026-06-23', notes: 'Assaig final' },
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
  { rehearsal_id: 'reh-05', member_id: 'dev-m-t1-dr', status: 'absent',  reason: 'altra' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-s2-lm', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-05', member_id: 'dev-m-a1-mk', status: 'absent',  reason: 'feina' },

  // ── reh-06 (13 mai) ──────────────────────────────────────────
  { rehearsal_id: 'reh-06', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-t1-sp', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-a1-ai', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-a2-ar', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-06', member_id: 'dev-m-bar-4', status: 'excused', reason: 'feina' },

  // ── reh-07 (20 mai — assaig amb piano) ───────────────────────
  { rehearsal_id: 'reh-07', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-t1-aa', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-s2-ic', status: 'absent',  reason: 'malaltia' },
  { rehearsal_id: 'reh-07', member_id: 'dev-m-a2-mfm',status: 'excused', reason: 'feina' },

  // ── reh-08 (27 mai) ──────────────────────────────────────────
  { rehearsal_id: 'reh-08', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-s2-lm', status: 'absent',  reason: 'malaltia' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-a1-sc', status: 'absent',  reason: '' },
  { rehearsal_id: 'reh-08', member_id: 'dev-m-t1-mp', status: 'excused', reason: 'viatge' },

  // ── reh-09 (03 jun — assaig general) ─────────────────────────
  { rehearsal_id: 'reh-09', member_id: 'dev-m-bar-3', status: 'absent',  reason: 'feina' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-t1-sp', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-a2-cg', status: 'excused', reason: 'malaltia' },
  { rehearsal_id: 'reh-09', member_id: 'dev-m-s1-cd', status: 'absent',  reason: '' },

  // ── reh-10 (10 jun — pre-estrena) ────────────────────────────
  { rehearsal_id: 'reh-10', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-10', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-10', member_id: 'dev-m-a2-cg', status: 'absent',  reason: 'malaltia' },

  // ── reh-11 (17 jun — PROPER, avisos) ─────────────────────────
  { rehearsal_id: 'reh-11', member_id: 'dev-m-bas-2', status: 'excused', reason: 'viatge' },
  { rehearsal_id: 'reh-11', member_id: 'dev-m-bar-3', status: 'excused', reason: 'feina' },
  { rehearsal_id: 'reh-11', member_id: 'dev-m-t1-aa', status: 'excused', reason: 'viatge' },

  // reh-12 (24 jun — PROPER, sense avisos encara)
]
