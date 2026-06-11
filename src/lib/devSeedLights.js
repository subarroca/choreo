// Seed de cues de llum per al mock de dev — subconjunt representatiu
// de les memòries reals del document "LLUMS MEMÒRIES CONDAL 2026".
// Cada banda té 3 focus (esquerra/centre/dreta), intensitat 0-4 (0/25/50/75/100 %).

const SHOW = 'dev-show-condal2026'

const lv = (e, c, d) => JSON.stringify({ esquerra: e, centre: c ?? e, dreta: d ?? e })
const OFF = lv(0)

const cue = (id, cue_number, fields) => ({
  id: `dev-cue-${id}`,
  show_id: SHOW,
  song_id: null,
  moment_id: null,
  cue_number,
  trigger_type: 'lyric',
  trigger_text: '',
  lyric_line: null,
  front_levels: OFF,
  back_levels: OFF,
  front_color: null,
  back_color: null,
  scope: 'tots',
  effects: '[]',
  followspots: '[]',
  transition: 'tall',
  transition_seconds: null,
  notes: '',
  ...fields,
})

export const SEED_LIGHT_CUES = [
  // ── Preshow ──
  cue('001', 1, { trigger_type: 'structural', trigger_text: 'TELÓ TANCAT — Track 1 veus en off', notes: 'Peu: "Què comenci la (R)Evolució!"' }),
  cue('002', 2, { trigger_type: 'structural', trigger_text: 'OBRIM TELÓ' }),

  // ── 1. Medley Rey León ──
  cue('003', 3,    { song_id: 'dev-song-01', moment_id: 'dev-m-01-1', trigger_text: 'Is the circle of life', lyric_line: 21, front_levels: lv(2), front_color: 'calid' }),
  cue('004', 4,    { song_id: 'dev-song-01', trigger_type: 'action', trigger_text: 'CANVI: Ingonyamaning — cor a pinya', front_levels: lv(2), front_color: 'ambre', back_levels: lv(2), back_color: 'lila' }),
  cue('005', 5,    { song_id: 'dev-song-01', moment_id: 'dev-m-01-2', trigger_type: 'action', trigger_text: 'Solista 1 avança dreta', front_levels: lv(1), scope: 'cor', followspots: '[{"label":"Canó 1","position":"dreta"}]' }),
  cue('006', 6,    { song_id: 'dev-song-01', trigger_type: 'action', trigger_text: 'Solista 2 avança esquerra', front_levels: lv(1), scope: 'cor', followspots: '[{"label":"Canó 2","position":"esquerra"}]' }),
  cue('007', 7,    { song_id: 'dev-song-01', moment_id: 'dev-m-01-3', trigger_text: 'They live in you', front_levels: lv(2), scope: 'cor', notes: 'Canvi de posició: el cor s\'obre' }),
  cue('008', 8,    { song_id: 'dev-song-01', trigger_text: 'Uuuuaaah', front_levels: lv(2), front_color: 'lila' }),
  cue('015', 15,   { song_id: 'dev-song-01', trigger_text: 'Nota llarga → Is the circle of life', front_levels: lv(3), front_color: 'calid', back_levels: lv(2), back_color: 'ambre' }),
  cue('016', 16,   { song_id: 'dev-song-01', trigger_type: 'action', trigger_text: 'Final', effects: '["barrido"]', front_levels: lv(2) }),
  cue('0165', 16.5,{ song_id: 'dev-song-01', trigger_type: 'structural', trigger_text: 'FOSC — Track 2 veus en off', effects: '["fosc"]' }),

  // ── 2. The Seal Lullaby ──
  cue('017', 17,   { song_id: 'dev-song-02', moment_id: 'dev-m-02-1', trigger_text: 'Oh hush thee my baby', lyric_line: 0, front_levels: lv(1), front_color: 'blau', transition: 'prog', transition_seconds: 4 }),
  cue('0174', 17.4,{ song_id: 'dev-song-02', trigger_text: 'Oooh / Uuuh', back_levels: lv(1), back_color: 'blau', transition: 'prog', transition_seconds: 6 }),
  cue('0175', 17.5,{ song_id: 'dev-song-02', trigger_type: 'structural', trigger_text: 'FOSC — Track 3 veus en off', effects: '["fosc"]' }),

  // ── 3. Euphoria ──
  cue('018', 18,   { song_id: 'dev-song-03', moment_id: 'dev-m-03-1', trigger_text: 'Intro (ah ah ah)', back_levels: lv(2), back_color: 'lila' }),
  cue('019', 19,   { song_id: 'dev-song-03', trigger_type: 'action', trigger_text: 'Solista 1 — "Why, why can\'t this moment…"', scope: 'cor', followspots: '[{"label":"Canó 1","position":"centre"}]' }),
  cue('020', 20,   { song_id: 'dev-song-03', moment_id: 'dev-m-03-2', trigger_text: 'Euphoria, an everlasting piece of art', lyric_line: 10, front_levels: lv(3), front_color: 'calid', back_levels: lv(3), back_color: 'lila' }),
  cue('021', 21,   { song_id: 'dev-song-03', moment_id: 'dev-m-03-4', trigger_text: 'Tornada ×2', front_levels: lv(2), effects: '["mobils"]', front_color: 'rosa' }),
  cue('022', 22,   { song_id: 'dev-song-03', trigger_text: 'We\'re going u-u-u-up', lyric_line: 14, back_levels: lv(3), back_color: 'lila' }),
  cue('023', 23,   { song_id: 'dev-song-03', trigger_type: 'structural', trigger_text: 'FOSC — Track 4 veus en off', effects: '["fosc"]' }),

  // ── 8. You Can't Stop the Beat ──
  cue('046', 46,   { song_id: 'dev-song-08', moment_id: 'dev-m-08-1', trigger_type: 'action', trigger_text: 'Solistes 1 i 2 avancen (duet)', front_levels: lv(0, 1, 0), scope: 'cor' }),
  cue('047', 47,   { song_id: 'dev-song-08', moment_id: 'dev-m-08-2', trigger_text: 'Ever since this whole world began', front_levels: lv(2), front_color: 'calid' }),
  cue('048', 48,   { song_id: 'dev-song-08', moment_id: 'dev-m-08-4', trigger_text: 'Zazaza — solista al mig', front_levels: lv(1, 3, 1), effects: '["chase","mobils"]', front_color: 'rosa' }),
  cue('0485', 48.5,{ song_id: 'dev-song-08', trigger_text: 'You can\'t stop the beat! (final)', back_levels: lv(2), back_color: 'vermell' }),
  cue('049', 49,   { song_id: 'dev-song-08', trigger_type: 'structural', trigger_text: 'BAIXA TELÓ — Mitja part', notes: 'Abans d\'obrir teló: Track 5 + compte enrere (Track 6)' }),

  // ── 9. The Greatest Show ──
  cue('050', 50,   { trigger_type: 'structural', trigger_text: 'OBRIM TELÓ' }),
  cue('051', 51,   { song_id: 'dev-song-09', moment_id: 'dev-m-09-1', trigger_text: 'Ohohoooh', lyric_line: 0, front_levels: lv(1), front_color: 'ambre' }),
  cue('052', 52,   { song_id: 'dev-song-09', trigger_type: 'action', trigger_text: 'PUM — Solista 1 frase', followspots: '[{"label":"Canó 1","position":"centre"}]' }),
  cue('055', 55,   { song_id: 'dev-song-09', moment_id: 'dev-m-09-2', trigger_text: 'So tell me do you wanna go', front_levels: lv(3), front_color: 'calid', effects: '["mobils"]' }),
  cue('058', 58,   { song_id: 'dev-song-09', moment_id: 'dev-m-09-4', trigger_text: 'This is the greatest shooow (×6)', back_levels: lv(3), back_color: 'vermell' }),
  cue('059', 59,   { song_id: 'dev-song-09', trigger_type: 'structural', trigger_text: 'FOSC — Diàleg 3', effects: '["fosc"]' }),

  // ── 13. Viva la Vida ──
  cue('070', 70,   { song_id: 'dev-song-13', moment_id: 'dev-m-13-1', trigger_text: 'Intro a cappella — I used to rule the world', lyric_line: 0, back_levels: lv(1), back_color: 'blau' }),
  cue('071', 71,   { song_id: 'dev-song-13', moment_id: 'dev-m-13-2', trigger_text: 'Intro musical (pam pam pam)', front_levels: lv(2), effects: '["sala"]', front_color: 'calid', transition: 'prog', transition_seconds: 3, notes: 'aug FR + sala; al "I used to roll the dice" ++FR i stop sala' }),
  cue('0715', 71.5,{ song_id: 'dev-song-13', trigger_type: 'structural', trigger_text: 'FOSC — Track 7', effects: '["fosc"]' }),
]

export const SEED_LIGHT_PRESETS = [
  { id: 'dev-lp-1', show_id: SHOW, name: 'Tornada càlida 100%', front_levels: lv(4), back_levels: OFF,   front_color: 'calid', back_color: null,   scope: 'tots', effects: '[]', transition: 'tall', transition_seconds: null },
  { id: 'dev-lp-2', show_id: SHOW, name: 'Solista amb canó',    front_levels: lv(1), back_levels: OFF,   front_color: null,    back_color: null,   scope: 'cor',  effects: '[]', transition: 'tall', transition_seconds: null },
  { id: 'dev-lp-3', show_id: SHOW, name: 'Fosc',                front_levels: OFF,   back_levels: OFF,   front_color: null,    back_color: null,   scope: 'tots', effects: '["fosc"]', transition: 'tall', transition_seconds: null },
  { id: 'dev-lp-4', show_id: SHOW, name: 'Ambient blau contra', front_levels: OFF,   back_levels: lv(2), front_color: null,    back_color: 'blau', scope: 'tots', effects: '[]', transition: 'prog', transition_seconds: 4 },
]
