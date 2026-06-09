// Mock Supabase client for local development (VITE_DEV_MODE=true)
// Persists data to localStorage. Auth is bypassed — always signed in as director.

export const DEV_USER = {
  id: 'dev-user-001',
  email: 'salvador.subarroca@gmail.com',
  user_metadata: { role: 'director', full_name: 'Salvador Subarroca' },
}

const DEV_SESSION = { user: DEV_USER }

function devUuid() {
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
}

function load(table) {
  try { return JSON.parse(localStorage.getItem(`devdb_${table}`) || '[]') }
  catch { return [] }
}

function save(table, rows) {
  localStorage.setItem(`devdb_${table}`, JSON.stringify(rows))
}

// ─── Seed: Membres reals — Condal 2026 ───────────────────────
// Colors del PDF: baritone=vermell, bass=salmó, tenor1=verd fosc, tenor2=verd clar
//                 soprano1=blau fosc, soprano2=blau clar, alto1=fúcsia, alto2=rosa/lila
const SEED_MEMBERS = [
  // ── DIRECTOR ──
  { id: 'dev-m-dir', first_name: 'GI', last_name: '(Director)', name: 'GI', initials: 'GI', voice: 'director', role: 'director', height: 170, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── BARITONS (vermell fosc) ──
  { id: 'dev-m-bar-1', first_name: 'Juli',    last_name: 'Algar',    name: 'Juli Algar',    initials: 'JA', voice: 'baritone', role: 'choir', height: 178, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bar-2', first_name: 'Pau',     last_name: 'Voces',    name: 'Pau Voces',     initials: 'PV', voice: 'baritone', role: 'choir', height: 175, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bar-3', first_name: 'Pau',     last_name: 'Robles',   name: 'Pau Robles',    initials: 'PR', voice: 'baritone', role: 'choir', height: 176, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bar-4', first_name: 'Andreu',  last_name: 'Torres',   name: 'Andreu Torres', initials: 'AT', voice: 'baritone', role: 'choir', height: 180, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bar-5', first_name: 'Ale',     last_name: 'Acosta',   name: 'Ale Acosta',    initials: 'AA', voice: 'baritone', role: 'choir', height: 177, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── BAIXOS (salmó) ──
  { id: 'dev-m-bas-1', first_name: 'Ricard',  last_name: 'Mas',      name: 'Ricard Mas',    initials: 'RM', voice: 'bass', role: 'choir', height: 182, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bas-2', first_name: 'Ramón',   last_name: 'Diez',     name: 'Ramón Diez',    initials: 'RD', voice: 'bass', role: 'choir', height: 179, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bas-3', first_name: 'Marc',    last_name: 'Vives',    name: 'Marc Vives',    initials: 'MV', voice: 'bass', role: 'choir', height: 181, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-bas-4', first_name: 'Pol',     last_name: 'Aviñó',    name: 'Pol Aviñó',     initials: 'PA', voice: 'bass', role: 'choir', height: 183, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── TENORS 1 (verd fosc) ──
  { id: 'dev-m-t1-nh', first_name: 'Nacho',   last_name: 'Hinojal',  name: 'Nacho Hinojal', initials: 'NH', voice: 'tenor2', role: 'choir', height: 175, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-ss', first_name: 'Salvador',last_name: 'Subarroca',name: 'Salvador Subarroca', initials: 'SS', voice: 'tenor1', role: 'choir', height: 176, birth_date: null, joined_at: null, instagram: '', google_account: 'salvador.subarroca@gmail.com' },
  { id: 'dev-m-t1-ll', first_name: 'Lluc',    last_name: 'Lopez',    name: 'Lluc Lopez',    initials: 'LL', voice: 'tenor1', role: 'choir', height: 174, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-mp', first_name: 'Marc',    last_name: 'Pascual',  name: 'Marc Pascual',  initials: 'MP', voice: 'tenor1', role: 'choir', height: 178, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-dr', first_name: 'David',   last_name: 'Rosado',   name: 'David Rosado',  initials: 'DR', voice: 'tenor1', role: 'choir', height: 180, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-sp', first_name: 'Sergi',   last_name: 'Pedrosa',  name: 'Sergi Pedrosa', initials: 'SP', voice: 'tenor1', role: 'choir', height: 177, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-aa', first_name: 'Arnau',   last_name: 'Arguimbau',name: 'Arnau Arguimbau',initials: 'AA', voice: 'tenor1', role: 'choir', height: 176, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-t1-jm', first_name: 'Joan Manel',last_name:'Estrany', name: 'Joan Manel Estrany',initials:'JM',voice: 'tenor1', role: 'choir', height: 179, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── SOPRANOS 1 (blau fosc) ──
  { id: 'dev-m-s1-mf', first_name: 'Marta',   last_name: 'Fernández',name: 'Marta Fernández',initials:'MF', voice: 'soprano1', role: 'choir', height: 163, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s1-sk', first_name: 'Stella',  last_name: 'Kohen',    name: 'Stella Kohen',  initials: 'SK', voice: 'soprano1', role: 'choir', height: 161, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s1-cd', first_name: 'Cris',    last_name: 'Díaz',     name: 'Cris Díaz',     initials: 'CD', voice: 'soprano1', role: 'choir', height: 165, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── SOPRANOS 2 (blau clar) ──
  { id: 'dev-m-s2-js', first_name: 'Judith',  last_name: 'Sabaté',   name: 'Judith Sabaté', initials: 'JS', voice: 'soprano2', role: 'choir', height: 160, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s2-ic', first_name: 'Irene',   last_name: 'Cabedo',   name: 'Irene Cabedo',  initials: 'IC', voice: 'soprano2', role: 'choir', height: 162, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s2-lm', first_name: 'Laura',   last_name: 'Martínez', name: 'Laura Martínez',initials: 'LM', voice: 'soprano2', role: 'choir', height: 164, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s2-gl', first_name: 'Gisela',  last_name: 'Lacasta',  name: 'Gisela Lacasta',initials: 'GL', voice: 'soprano2', role: 'choir', height: 158, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-s2-ms', first_name: 'María',   last_name: 'Saez',     name: 'María Saez',    initials: 'MS', voice: 'soprano2', role: 'choir', height: 166, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── ALTS 1 (fúcsia/lila) ──
  { id: 'dev-m-a1-ap', first_name: 'Adriana', last_name: 'Palomo',   name: 'Adriana Palomo',initials: 'AP', voice: 'alto1', role: 'choir', height: 161, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-ai', first_name: 'Aina',    last_name: 'Pedrola',  name: 'Aina Pedrola',  initials: 'AiP',voice: 'alto1', role: 'choir', height: 160, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-mt', first_name: 'Magalí',  last_name: 'Túnica',   name: 'Magalí Túnica', initials: 'MT', voice: 'alto1', role: 'choir', height: 163, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-ng', first_name: 'Núria',   last_name: 'Galiano',  name: 'Núria Galiano', initials: 'NG', voice: 'alto1', role: 'choir', height: 162, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-sc', first_name: 'Silvia',  last_name: 'Colell',   name: 'Silvia Colell', initials: 'SC', voice: 'alto1', role: 'choir', height: 159, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-sr', first_name: 'Sonia',   last_name: 'Ruiz',     name: 'Sonia Ruiz',    initials: 'SR', voice: 'alto1', role: 'choir', height: 164, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a1-mk', first_name: 'Mariona', last_name: 'Kazumi',   name: 'Mariona Kazumi',initials: 'MK', voice: 'alto1', role: 'choir', height: 161, birth_date: null, joined_at: null, instagram: '', google_account: '' },

  // ── ALTS 2 (rosa/lavanda) ──
  { id: 'dev-m-a2-ac', first_name: 'Alicia',  last_name: 'Cubero',   name: 'Alicia Cubero', initials: 'AC', voice: 'alto2', role: 'choir', height: 160, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a2-ar', first_name: 'Anna',    last_name: 'Restoy',   name: 'Anna Restoy',   initials: 'AR', voice: 'alto2', role: 'choir', height: 163, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a2-am', first_name: 'Anna',    last_name: 'Martin',   name: 'Anna Martin',   initials: 'AM', voice: 'alto2', role: 'choir', height: 162, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a2-mfm',first_name: 'Maria',   last_name: 'Fernandez',name: 'Maria Fernandez',initials:'MF', voice: 'alto2', role: 'choir', height: 161, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a2-cg', first_name: 'Cristina',last_name: 'Grau',     name: 'Cristina Grau', initials: 'CG', voice: 'alto2', role: 'choir', height: 158, birth_date: null, joined_at: null, instagram: '', google_account: '' },
  { id: 'dev-m-a2-mg', first_name: 'Maria',   last_name: 'Granell',  name: 'Maria Granell', initials: 'MG', voice: 'alto2', role: 'choir', height: 160, birth_date: null, joined_at: null, instagram: '', google_account: '' },
]

// ─── Seed: Show Condal 2026 ───────────────────────────────────
const CONDAL_SHOW_ID = 'dev-show-condal2026'
const SEED_SHOWS = [
  {
    id: CONDAL_SHOW_ID,
    name: 'Condal 2026',
    date: '2026-06-06',
    venue: 'Teatre Condal, Barcelona',
    grid_rows: ['Tarima 5', 'Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra 1', 'Terra 2', 'Terra 3'],
    grid_cols: 14,
    row_elevations: [200, 160, 120, 80, 40, 0, 0, 0],
    mics: '["M1","M2","M3","M4","M5","M6"]',
    mic_assignments: '{}',
  },
]

// ─── Seed: Setlist Condal 2026 ────────────────────────────────
const SEED_SONGS = [
  // PRIMERA PART
  { id: 'dev-song-01', show_id: CONDAL_SHOW_ID, title: 'Medley Rey León',         notes: 'Primera part', order: 1 },
  { id: 'dev-song-02', show_id: CONDAL_SHOW_ID, title: 'The Seal Lullaby',         notes: '',             order: 2 },
  { id: 'dev-song-03', show_id: CONDAL_SHOW_ID, title: 'Euphoria',                 notes: '',             order: 3 },
  { id: 'dev-song-04', show_id: CONDAL_SHOW_ID, title: 'Better is One Day',        notes: '',             order: 4 },
  { id: 'dev-song-05', show_id: CONDAL_SHOW_ID, title: 'Rise Up',                  notes: '',             order: 5 },
  { id: 'dev-song-06', show_id: CONDAL_SHOW_ID, title: 'Defying Gravity',           notes: '',             order: 6 },
  { id: 'dev-song-07', show_id: CONDAL_SHOW_ID, title: 'Medley Rent',              notes: '',             order: 7 },
  { id: 'dev-song-08', show_id: CONDAL_SHOW_ID, title: "You Can't Stop the Beat",  notes: 'Fi 1a part',   order: 8 },
  // SEGONA PART
  { id: 'dev-song-09', show_id: CONDAL_SHOW_ID, title: 'The Greatest Show',        notes: 'Segona part',  order: 9 },
  { id: 'dev-song-10', show_id: CONDAL_SHOW_ID, title: 'Baba Yetu',                notes: '',             order: 10 },
  { id: 'dev-song-11', show_id: CONDAL_SHOW_ID, title: 'Hallelujah',               notes: '',             order: 11 },
  { id: 'dev-song-12', show_id: CONDAL_SHOW_ID, title: 'Medley Queen',             notes: '',             order: 12 },
  { id: 'dev-song-13', show_id: CONDAL_SHOW_ID, title: 'Viva la Vida',             notes: '',             order: 13 },
  { id: 'dev-song-14', show_id: CONDAL_SHOW_ID, title: 'Believe',                  notes: '',             order: 14 },
  { id: 'dev-song-15', show_id: CONDAL_SHOW_ID, title: 'Titanium',                 notes: '',             order: 15 },
  { id: 'dev-song-16', show_id: CONDAL_SHOW_ID, title: 'Medley Beyoncé',           notes: 'Fi 2a part',   order: 16 },
]

// ─── Seed: Moments per cançó (basats en el PDF Condal 2026) ───
const SEED_MOMENTS = [
  // 1. Rey León
  { id: 'dev-m-01-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-01', title: 'Posició inicial',                       subtitle: '4 tarimes',                                    order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-01-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-01', title: '"night" "and a voice"',                 subtitle: 'Gent al terra + tarimes',                      order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-01-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-01', title: '"They live in you"',                   subtitle: 'Anem a la posició',                             order: 3, positions: '{}', soloists: '[]' },

  // 2. The Seal Lullaby
  { id: 'dev-m-02-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-02', title: 'Posició',                               subtitle: 'Canvi durant transició + intro',                order: 1, positions: '{}', soloists: '[]' },

  // 3. Euphoria
  { id: 'dev-m-03-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-03', title: 'Intro',                                 subtitle: 'Video + intro piano, buscar posició',           order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-03-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-03', title: 'Primera tornada',                       subtitle: 'Grup al terra i tarimes',                      order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-03-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-03', title: '"we are free we…"',                    subtitle: 'Dues columnes al terra',                        order: 3, positions: '{}', soloists: '[]' },
  { id: 'dev-m-03-4', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-03', title: '"we\'re higher and higher" + 2a torn.', subtitle: 'Dispersió al terra',                           order: 4, positions: '{}', soloists: '[]' },
  { id: 'dev-m-03-5', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-03', title: 'Última tornada',                        subtitle: 'SP i NG al davant del GI',                     order: 5, positions: '{}', soloists: '[]' },

  // 4. Better is One Day
  { id: 'dev-m-04-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-04', title: 'Posició',                               subtitle: '4 tarimes + terra',                            order: 1, positions: '{}', soloists: '[]' },

  // 5. Rise Up
  { id: 'dev-m-05-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-05', title: 'Semicercle',                            subtitle: 'Files pendents de confirmar',                  order: 1, positions: '{}', soloists: '[]' },

  // 6. Defying Gravity
  { id: 'dev-m-06-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-06', title: 'Semicercle',                            subtitle: 'Continuació Rise Up',                          order: 1, positions: '{}', soloists: '[]' },

  // 7. Rent
  { id: 'dev-m-07-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-07', title: 'Will I / Seasons of Love',              subtitle: 'Posició arbres, 4 tarimes + terra',            order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-07-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-07', title: "I'll Cover You Reprise",                subtitle: 'Moment cementiri, posició lliure',            order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-07-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-07', title: 'Nomès tu i jo',                         subtitle: 'Mirem a la parella un altre cop',              order: 3, positions: '{}', soloists: '[]' },
  { id: 'dev-m-07-4', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-07', title: 'Final Finale B',                        subtitle: 'Dues files, noies/nois separats',             order: 4, positions: '{}', soloists: '[]' },

  // 8. You Can't Stop the Beat
  { id: 'dev-m-08-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-08', title: 'Gir — solistes de cara',                subtitle: 'Ens girem, LL i AiP al davant',               order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-08-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-08', title: 'Posició en tarimes',                    subtitle: '4 tarimes completes',                          order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-08-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-08', title: 'Paralles tornada',                      subtitle: 'El de darrere estira la parella',              order: 3, positions: '{}', soloists: '[]' },
  { id: 'dev-m-08-4', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-08', title: 'Pinya — Zaa Zaa Zaa',                  subtitle: 'Anem a la pinya',                              order: 4, positions: '{}', soloists: '[]' },
  { id: 'dev-m-08-5', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-08', title: 'Coreo cap al Marc',                    subtitle: 'Posició final 1a part',                        order: 5, positions: '{}', soloists: '[]' },

  // 9. The Greatest Show
  { id: 'dev-m-09-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-09', title: 'Pose "Ladies and gents"',               subtitle: 'IC, MF, PV al terra, fletxa centre',          order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-09-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-09', title: 'Posició 2',                             subtitle: '4 tarimes plenes',                             order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-09-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-09', title: 'Rotació — dones d\'esquena',            subtitle: 'Tarima 1/2 rotades, grup al terra',           order: 3, positions: '{}', soloists: '[]' },
  { id: 'dev-m-09-4', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-09', title: 'Final',                                 subtitle: '4 tarimes + terra buit',                       order: 4, positions: '{}', soloists: '[]' },

  // 10. Baba Yetu
  { id: 'dev-m-10-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-10', title: 'Posició',                               subtitle: '4 tarimes, MF solista al front',               order: 1, positions: '{}', soloists: '[]' },

  // 11. Hallelujah
  { id: 'dev-m-11-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-11', title: 'Posició (transició Queen)',              subtitle: 'SP solista, 4 tarimes',                       order: 1, positions: '{}', soloists: '[]' },

  // 12. Queen
  { id: 'dev-m-12-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-12', title: 'Posició inicial',                       subtitle: 'Tarimes 3+4, grup al terra',                  order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-12-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-12', title: 'Bohemian Rhapsody',                     subtitle: 'IC, LaM, MP salten forat per SP',             order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-12-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-12', title: '"Daung Daung" — posició',               subtitle: 'Totes 4 tarimes',                             order: 3, positions: '{}', soloists: '[]' },

  // 13. Viva la Vida
  { id: 'dev-m-13-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-13', title: 'Posició inicial',                       subtitle: 'Files 2 i 4 pas dreta',                       order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-13-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-13', title: 'Inici — files van baixant',             subtitle: 'Files 2/4 pas dreta, columnes amb fletxes',  order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-13-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-13', title: 'Amb convidats',                         subtitle: 'Tarima 5, Stella→4a fila, Juli→3a',           order: 3, positions: '{}', soloists: '[]' },
  { id: 'dev-m-13-4', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-13', title: 'Files 2 esq / 4 dreta',                 subtitle: 'Convidats + cor integrats',                   order: 4, positions: '{}', soloists: '[]' },

  // 14. Believe
  { id: 'dev-m-14-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-14', title: '"live" — ens separem',                  subtitle: 'Grup terra al davant',                        order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-14-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-14', title: '"but" — posició ampliada',              subtitle: 'Grup terra creix cap a públic',               order: 2, positions: '{}', soloists: '[]' },
  { id: 'dev-m-14-3', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-14', title: 'Final "festa" → Titanium',              subtitle: 'Pujem una tarima per Titanium',               order: 3, positions: '{}', soloists: '[]' },

  // 15. Titanium
  { id: 'dev-m-15-1', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-15', title: 'Posició (pujem tarima)',                 subtitle: 'Sense solistes, des de Believe',              order: 1, positions: '{}', soloists: '[]' },
  { id: 'dev-m-15-2', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-15', title: 'Desplegament pinya',                    subtitle: 'JS, NG, CG queden al terra',                  order: 2, positions: '{}', soloists: '[]' },

  // 16. Beyoncé (molt complex, ~15 moments)
  { id: 'dev-m-16-01', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Posició inicial',                      subtitle: 'Tarimes 1-3, NG al terra',                    order: 1,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-02', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Posició 2',                            subtitle: 'SS puja a Tarima 4',                          order: 2,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-03', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: '"got me lookin"',                      subtitle: 'Tarimes 2+1+Terra, columnes',                 order: 3,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-04', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Rotació V',                            subtitle: 'Forma de V, SS al costat esquerre',           order: 4,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-05', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Canvi parelles',                       subtitle: 'OJO: MF, PR, JM — canvis de forats!',        order: 5,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-06', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Post canvi',                           subtitle: 'SS a Terra, 3 files',                         order: 6,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-07', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: '1r "Who Run the World"',               subtitle: 'Tothom baixa una fila (fletxes)',              order: 7,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-08', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Post 1r "Who Run the World"',          subtitle: 'SS al terra, 4 files',                        order: 8,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-09', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: '2n "Who Run" + Halo',                  subtitle: '2a fila noies desplaçament dreta',            order: 9,  positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-10', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Listen + Single Ladies',               subtitle: 'Homes apilats al centre, dones esteses',     order: 10, positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-11', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Pinya Survivor',                       subtitle: '1r/2n/3r "viving"',                           order: 11, positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-12', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Sweet Dreams parelles',                subtitle: '4 tarimes parelles mixtes',                   order: 12, positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-13', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: '3 files',                              subtitle: 'SS+AT al capdamunt, 3 columnes',              order: 13, positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-14', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Love on Top',                          subtitle: 'SS a Tarima 4, 4 files completes',            order: 14, positions: '{}', soloists: '[]' },
  { id: 'dev-m-16-15', show_id: CONDAL_SHOW_ID, song_id: 'dev-song-16', title: 'Salutacions',                          subtitle: 'Camino 4 temps, Saludo 4 temps',              order: 15, positions: '{}', soloists: '[]' },
]

// ─── Seed: Posicions ──────────────────────────────────────────
// Standard pyramid formation (from PDF page 5, Rey León posició inicial)
// 36 members across 4 tarimas (NH and AC absent from all PDF diagrams)
const STD = [
  // T4 (row 0) — back/top
  { member_id: 'dev-m-s2-lm',  grid_row: 1, grid_col: 2 },
  { member_id: 'dev-m-s1-cd',  grid_row: 1, grid_col: 3 },
  { member_id: 'dev-m-a2-mg',  grid_row: 1, grid_col: 4 },
  { member_id: 'dev-m-a2-ar',  grid_row: 1, grid_col: 5 },
  { member_id: 'dev-m-a1-sr',  grid_row: 1, grid_col: 6 },
  { member_id: 'dev-m-t1-aa',  grid_row: 1, grid_col: 7 },
  { member_id: 'dev-m-bas-4',  grid_row: 1, grid_col: 8 },
  { member_id: 'dev-m-bar-5',  grid_row: 1, grid_col: 9 },
  // T3 (row 1)
  { member_id: 'dev-m-s1-mf',  grid_row: 2, grid_col: 1 },
  { member_id: 'dev-m-a1-mk',  grid_row: 2, grid_col: 2 },
  { member_id: 'dev-m-a2-mfm', grid_row: 2, grid_col: 3 },
  { member_id: 'dev-m-a1-mt',  grid_row: 2, grid_col: 4 },
  { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 5 },
  { member_id: 'dev-m-t1-jm',  grid_row: 2, grid_col: 6 },
  { member_id: 'dev-m-t1-mp',  grid_row: 2, grid_col: 7 },
  { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 8 },
  { member_id: 'dev-m-bar-3',  grid_row: 2, grid_col: 9 },
  // T2 (row 2)
  { member_id: 'dev-m-s2-ms',  grid_row: 3, grid_col: 1 },
  { member_id: 'dev-m-s2-gl',  grid_row: 3, grid_col: 2 },
  { member_id: 'dev-m-s1-sk',  grid_row: 3, grid_col: 3 },
  { member_id: 'dev-m-a2-cg',  grid_row: 3, grid_col: 4 },
  { member_id: 'dev-m-a1-ap',  grid_row: 3, grid_col: 5 },
  { member_id: 'dev-m-a1-ng',  grid_row: 3, grid_col: 6 },
  { member_id: 'dev-m-t1-ll',  grid_row: 3, grid_col: 7 },
  { member_id: 'dev-m-bas-3',  grid_row: 3, grid_col: 8 },
  { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 9 },
  { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 10 },
  // T1 (row 3) — front
  { member_id: 'dev-m-s2-js',  grid_row: 4, grid_col: 2 },
  { member_id: 'dev-m-s2-ic',  grid_row: 4, grid_col: 3 },
  { member_id: 'dev-m-a2-am',  grid_row: 4, grid_col: 4 },
  { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 5 },
  { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 6 },
  { member_id: 'dev-m-t1-sp',  grid_row: 4, grid_col: 7 },
  { member_id: 'dev-m-t1-dr',  grid_row: 4, grid_col: 8 },
  { member_id: 'dev-m-bas-1',  grid_row: 4, grid_col: 9 },
  { member_id: 'dev-m-bar-2',  grid_row: 4, grid_col: 10 },
]

const SEED_POSITIONS = {
  // ── Page 5: Rey León — posició inicial ────────────────────────
  'dev-m-01-1': [
    { member_id: 'dev-m-s2-lm',  grid_row: 1, grid_col: 2 },
    { member_id: 'dev-m-s1-cd',  grid_row: 1, grid_col: 3 },
    { member_id: 'dev-m-a2-mg',  grid_row: 1, grid_col: 4 },
    { member_id: 'dev-m-a2-ar',  grid_row: 1, grid_col: 5 },
    { member_id: 'dev-m-a1-sr',  grid_row: 1, grid_col: 6 },
    { member_id: 'dev-m-t1-aa',  grid_row: 1, grid_col: 7 },
    { member_id: 'dev-m-bas-4',  grid_row: 1, grid_col: 8 },
    { member_id: 'dev-m-bar-5',  grid_row: 1, grid_col: 9 },
    { member_id: 'dev-m-s1-mf',  grid_row: 2, grid_col: 1 },
    { member_id: 'dev-m-a1-mk',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-a2-mfm', grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-a1-mt',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-t1-jm',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-t1-mp',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-s2-ms',  grid_row: 3, grid_col: 1 },
    { member_id: 'dev-m-s2-gl',  grid_row: 3, grid_col: 2 },
    { member_id: 'dev-m-s1-sk',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-a2-cg',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-a1-ap',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-a1-ng',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-t1-ll',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-js',  grid_row: 4, grid_col: 2 },
    { member_id: 'dev-m-s2-ic',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-a2-am',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-t1-sp',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-t1-dr',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-bas-1',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-bar-2',  grid_row: 4, grid_col: 10 },
  ],
  // ── Page 6: Rey León — "night and a voice" ────────────────────
  // (7 members floating above T4 are skipped; AiP/PV at Terra edges)
  'dev-m-01-2': [
    { member_id: 'dev-m-a2-mfm', grid_row: 1, grid_col: 4 },
    { member_id: 'dev-m-a1-mt',  grid_row: 1, grid_col: 5 },
    { member_id: 'dev-m-t1-ss',  grid_row: 1, grid_col: 6 },
    { member_id: 'dev-m-t1-jm',  grid_row: 1, grid_col: 7 },
    { member_id: 'dev-m-t1-mp',  grid_row: 1, grid_col: 8 },
    { member_id: 'dev-m-bas-2',  grid_row: 1, grid_col: 9 },
    { member_id: 'dev-m-bar-3',  grid_row: 1, grid_col: 10 },
    { member_id: 'dev-m-s2-lm',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-s1-mf',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-a1-mk',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bar-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bar-4',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-s2-ms',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-s2-gl',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-s1-sk',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-a1-ng',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-t1-ll',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-s2-js',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-a2-cg',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-ai',  grid_row: 5, grid_col: 1 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-bas-3',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a1-sc',  grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-t1-sp',  grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-bar-2',  grid_row: 5, grid_col: 13 },
  ],
  // ── Page 7: Rey León — "They live in you" ─────────────────────
  'dev-m-01-3': [
    { member_id: 'dev-m-s2-lm',  grid_row: 1, grid_col: 2 },
    { member_id: 'dev-m-s1-cd',  grid_row: 1, grid_col: 3 },
    { member_id: 'dev-m-a2-mg',  grid_row: 1, grid_col: 4 },
    { member_id: 'dev-m-a2-ar',  grid_row: 1, grid_col: 5 },
    { member_id: 'dev-m-a1-sr',  grid_row: 1, grid_col: 6 },
    { member_id: 'dev-m-t1-aa',  grid_row: 1, grid_col: 7 },
    { member_id: 'dev-m-bas-4',  grid_row: 1, grid_col: 8 },
    { member_id: 'dev-m-bar-5',  grid_row: 1, grid_col: 9 },
    { member_id: 'dev-m-s1-mf',  grid_row: 2, grid_col: 1 },
    { member_id: 'dev-m-a1-mk',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-a2-mfm', grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-a1-mt',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-t1-jm',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-t1-mp',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-s2-ms',  grid_row: 3, grid_col: 1 },
    { member_id: 'dev-m-s2-gl',  grid_row: 3, grid_col: 2 },
    { member_id: 'dev-m-s1-sk',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-a1-sc',  grid_row: 3, grid_col: 4 },  // SC↔CG swapped vs p5
    { member_id: 'dev-m-a1-ap',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-a1-ng',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-t1-ll',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-js',  grid_row: 4, grid_col: 2 },
    { member_id: 'dev-m-s2-ic',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-a2-am',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-a2-cg',  grid_row: 4, grid_col: 5 },  // CG here instead of SC
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-t1-sp',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-t1-dr',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-bas-1',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-bar-2',  grid_row: 4, grid_col: 10 },
  ],
  // ── Page 8: The Seal Lullaby ───────────────────────────────────
  'dev-m-02-1': [
    { member_id: 'dev-m-s2-ic',  grid_row: 1, grid_col: 2 },
    { member_id: 'dev-m-s2-lm',  grid_row: 1, grid_col: 3 },
    { member_id: 'dev-m-a2-mg',  grid_row: 1, grid_col: 4 },
    { member_id: 'dev-m-a1-mt',  grid_row: 1, grid_col: 5 },
    { member_id: 'dev-m-a1-sc',  grid_row: 1, grid_col: 6 },
    { member_id: 'dev-m-t1-aa',  grid_row: 1, grid_col: 7 },
    { member_id: 'dev-m-t1-jm',  grid_row: 1, grid_col: 8 },
    { member_id: 'dev-m-bas-2',  grid_row: 1, grid_col: 9 },
    { member_id: 'dev-m-bas-1',  grid_row: 1, grid_col: 10 },
    { member_id: 'dev-m-s1-cd',  grid_row: 2, grid_col: 1 },
    { member_id: 'dev-m-s1-mf',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-a1-mk',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-a2-cg',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-a1-ng',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-t1-sp',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-4',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-bar-1',  grid_row: 2, grid_col: 10 },
    { member_id: 'dev-m-s2-js',  grid_row: 3, grid_col: 1 },
    { member_id: 'dev-m-s2-gl',  grid_row: 3, grid_col: 2 },
    { member_id: 'dev-m-a2-am',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-a1-sr',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-a1-ap',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-t1-ll',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-t1-dr',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 2 },
    { member_id: 'dev-m-s1-sk',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-a2-mfm', grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-a2-ar',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-t1-mp',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-bar-3',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-bar-5',  grid_row: 4, grid_col: 9 },
  ],
  // ── Page 9: Euphoria — intro ───────────────────────────────────
  'dev-m-03-1': [
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-t1-ll',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-t1-mp',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-t1-aa',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-t1-jm',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-5',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-s2-gl',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-s1-cd',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-mk',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-mt',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 10 },
    { member_id: 'dev-m-a1-sr',  grid_row: 4, grid_col: 11 },
    { member_id: 'dev-m-a2-cg',  grid_row: 5, grid_col: 1 },
    { member_id: 'dev-m-a2-ar',  grid_row: 5, grid_col: 2 },
    { member_id: 'dev-m-a1-ng',  grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-s1-mf',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-s2-lm',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a2-mfm', grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 8 },
    { member_id: 'dev-m-s1-sk',  grid_row: 5, grid_col: 9 },
    { member_id: 'dev-m-a2-mg',  grid_row: 5, grid_col: 10 },
    { member_id: 'dev-m-s2-js',  grid_row: 5, grid_col: 11 },
    { member_id: 'dev-m-t1-sp',  grid_row: 5, grid_col: 12 },
  ],
  // ── Page 10: Euphoria — primera tornada ───────────────────────
  'dev-m-03-2': [
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-t1-ll',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-t1-mp',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-t1-aa',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-t1-jm',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-t1-sp',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-5',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-s2-gl',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-s1-cd',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-mk',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-mt',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 10 },
    { member_id: 'dev-m-a1-sr',  grid_row: 4, grid_col: 11 },
    { member_id: 'dev-m-a2-cg',  grid_row: 5, grid_col: 1 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 2 },
    { member_id: 'dev-m-a2-mfm', grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-a2-mg',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-a1-ng',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a2-ar',  grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-s2-js',  grid_row: 5, grid_col: 8 },
    { member_id: 'dev-m-s2-lm',  grid_row: 5, grid_col: 9 },
    { member_id: 'dev-m-s1-sk',  grid_row: 5, grid_col: 10 },
    { member_id: 'dev-m-s1-mf',  grid_row: 5, grid_col: 11 },
  ],
  // ── Page 11: Euphoria — "we are free we..." ───────────────────
  'dev-m-03-3': [
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-t1-ll',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-t1-mp',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-t1-aa',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-t1-jm',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-t1-sp',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-5',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-s2-gl',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-s1-cd',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-mk',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-mt',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 10 },
    { member_id: 'dev-m-a1-sr',  grid_row: 4, grid_col: 11 },
    { member_id: 'dev-m-a2-cg',  grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-a2-ar',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a2-mfm', grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-a2-mg',  grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-s2-lm',  grid_row: 5, grid_col: 9 },
    { member_id: 'dev-m-s1-sk',  grid_row: 5, grid_col: 10 },
    { member_id: 'dev-m-s1-mf',  grid_row: 5, grid_col: 11 },
    { member_id: 'dev-m-s2-js',  grid_row: 5, grid_col: 12 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 13 },
    { member_id: 'dev-m-a1-ng',  grid_row: 5, grid_col: 8 },
  ],
  // ── Page 12: Euphoria — "we're higher" + 2a tornada ──────────
  'dev-m-03-4': [
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-t1-ll',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-t1-mp',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-t1-aa',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-t1-jm',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-t1-sp',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-5',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-s2-gl',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-s1-cd',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-mk',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-mt',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 10 },
    { member_id: 'dev-m-a1-sr',  grid_row: 4, grid_col: 11 },
    { member_id: 'dev-m-a2-cg',  grid_row: 5, grid_col: 2 },
    { member_id: 'dev-m-a2-mfm', grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-a2-mg',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-a2-ar',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-dir',    grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-s1-sk',  grid_row: 5, grid_col: 9 },
    { member_id: 'dev-m-s2-js',  grid_row: 5, grid_col: 10 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 11 },
    { member_id: 'dev-m-s1-mf',  grid_row: 5, grid_col: 12 },
    { member_id: 'dev-m-s2-lm',  grid_row: 5, grid_col: 13 },
  ],
  // ── Page 13/14: Euphoria — última tornada ─────────────────────
  'dev-m-03-5': [
    { member_id: 'dev-m-t1-ss',  grid_row: 2, grid_col: 2 },
    { member_id: 'dev-m-t1-dr',  grid_row: 2, grid_col: 3 },
    { member_id: 'dev-m-t1-ll',  grid_row: 2, grid_col: 4 },
    { member_id: 'dev-m-bas-4',  grid_row: 2, grid_col: 5 },
    { member_id: 'dev-m-bas-2',  grid_row: 2, grid_col: 6 },
    { member_id: 'dev-m-bas-1',  grid_row: 2, grid_col: 7 },
    { member_id: 'dev-m-bas-3',  grid_row: 2, grid_col: 8 },
    { member_id: 'dev-m-bar-2',  grid_row: 2, grid_col: 9 },
    { member_id: 'dev-m-t1-mp',  grid_row: 3, grid_col: 3 },
    { member_id: 'dev-m-t1-aa',  grid_row: 3, grid_col: 4 },
    { member_id: 'dev-m-t1-jm',  grid_row: 3, grid_col: 5 },
    { member_id: 'dev-m-t1-sp',  grid_row: 3, grid_col: 6 },
    { member_id: 'dev-m-bar-4',  grid_row: 3, grid_col: 7 },
    { member_id: 'dev-m-bar-1',  grid_row: 3, grid_col: 8 },
    { member_id: 'dev-m-bar-3',  grid_row: 3, grid_col: 9 },
    { member_id: 'dev-m-bar-5',  grid_row: 3, grid_col: 10 },
    { member_id: 'dev-m-s2-ms',  grid_row: 4, grid_col: 3 },
    { member_id: 'dev-m-s2-gl',  grid_row: 4, grid_col: 4 },
    { member_id: 'dev-m-s1-cd',  grid_row: 4, grid_col: 5 },
    { member_id: 'dev-m-a1-mk',  grid_row: 4, grid_col: 6 },
    { member_id: 'dev-m-a1-ap',  grid_row: 4, grid_col: 7 },
    { member_id: 'dev-m-a1-mt',  grid_row: 4, grid_col: 8 },
    { member_id: 'dev-m-a1-sc',  grid_row: 4, grid_col: 9 },
    { member_id: 'dev-m-a1-ai',  grid_row: 4, grid_col: 10 },
    { member_id: 'dev-m-a1-sr',  grid_row: 4, grid_col: 11 },
    { member_id: 'dev-m-a1-ng',  grid_row: 4, grid_col: 12 },
    { member_id: 'dev-m-a2-cg',  grid_row: 5, grid_col: 2 },
    { member_id: 'dev-m-a2-mfm', grid_row: 5, grid_col: 3 },
    { member_id: 'dev-m-a2-ar',  grid_row: 5, grid_col: 4 },
    { member_id: 'dev-m-a2-mg',  grid_row: 5, grid_col: 5 },
    { member_id: 'dev-m-a2-am',  grid_row: 5, grid_col: 6 },
    { member_id: 'dev-m-dir',    grid_row: 5, grid_col: 7 },
    { member_id: 'dev-m-s1-sk',  grid_row: 5, grid_col: 9 },
    { member_id: 'dev-m-s2-js',  grid_row: 5, grid_col: 10 },
    { member_id: 'dev-m-s2-ic',  grid_row: 5, grid_col: 11 },
    { member_id: 'dev-m-s1-mf',  grid_row: 5, grid_col: 12 },
    { member_id: 'dev-m-s2-lm',  grid_row: 5, grid_col: 13 },
  ],
  // ── Standard pyramid (remaining songs, approximated from PDF style) ──
  'dev-m-04-1': STD, 'dev-m-05-1': STD, 'dev-m-06-1': STD,
  'dev-m-07-1': STD, 'dev-m-07-2': STD, 'dev-m-07-3': STD, 'dev-m-07-4': STD,
  'dev-m-08-1': STD, 'dev-m-08-2': STD, 'dev-m-08-3': STD, 'dev-m-08-4': STD, 'dev-m-08-5': STD,
  'dev-m-09-1': STD, 'dev-m-09-2': STD, 'dev-m-09-3': STD, 'dev-m-09-4': STD,
  'dev-m-10-1': STD,
  'dev-m-11-1': STD,
  'dev-m-12-1': STD, 'dev-m-12-2': STD, 'dev-m-12-3': STD,
  'dev-m-13-1': STD, 'dev-m-13-2': STD, 'dev-m-13-3': STD, 'dev-m-13-4': STD,
  'dev-m-14-1': STD, 'dev-m-14-2': STD, 'dev-m-14-3': STD,
  'dev-m-15-1': STD, 'dev-m-15-2': STD,
  'dev-m-16-01': STD, 'dev-m-16-02': STD, 'dev-m-16-03': STD, 'dev-m-16-04': STD, 'dev-m-16-05': STD,
  'dev-m-16-06': STD, 'dev-m-16-07': STD, 'dev-m-16-08': STD, 'dev-m-16-09': STD, 'dev-m-16-10': STD,
  'dev-m-16-11': STD, 'dev-m-16-12': STD, 'dev-m-16-13': STD, 'dev-m-16-14': STD, 'dev-m-16-15': STD,
}

function ensureSeedData() {
  // ── Membres ──────────────────────────────────────────────────
  const existingMembers = load('members')
  const existingMemberIds = new Set(existingMembers.map(m => m.id))
  const toAddMembers = SEED_MEMBERS
    .filter(m => !existingMemberIds.has(m.id))
    .map(m => ({ active: true, ...m, created_at: new Date().toISOString() }))
  // Migrate existing seed members to sync name/voice fields
  const migratedMembers = existingMembers.map(m => {
    const seed = SEED_MEMBERS.find(s => s.id === m.id)
    if (!seed) return m
    return { active: true, ...m, name: seed.name, first_name: seed.first_name, last_name: seed.last_name, initials: seed.initials, voice: seed.voice }
  })
  const membersChanged = JSON.stringify(migratedMembers) !== JSON.stringify(existingMembers)
  if (toAddMembers.length || membersChanged) save('members', [...migratedMembers, ...toAddMembers])

  // ── Shows ────────────────────────────────────────────────────
  const existingShows = load('shows')
  const existingShowIds = new Set(existingShows.map(s => s.id))
  // Ensure grid config on legacy shows
  const DEFAULT_ROWS = ['Tarima 5', 'Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra 1', 'Terra 2', 'Terra 3']
  const defaultElevations = rows => {
    const tarimes = rows.filter(r => r.toLowerCase().startsWith('tarima'))
    return rows.map(r => r.toLowerCase().startsWith('tarima')
      ? tarimes.indexOf(r) === -1 ? 0 : (tarimes.length - tarimes.indexOf(r)) * 40
      : 0)
  }
  const migratedShows = existingShows.map(s => {
    const rows = s.grid_rows ?? DEFAULT_ROWS
    return { ...s, grid_rows: rows, grid_cols: s.grid_cols ?? 14, row_elevations: s.row_elevations ?? defaultElevations(rows), mics: s.mics ?? '["M1","M2","M3"]', mic_assignments: s.mic_assignments ?? '{}' }
  })
  const toAddShows = SEED_SHOWS
    .filter(s => !existingShowIds.has(s.id))
    .map(s => ({ ...s, created_at: new Date().toISOString() }))
  const showsChanged = JSON.stringify(migratedShows) !== JSON.stringify(existingShows)
  if (toAddShows.length || showsChanged) save('shows', [...migratedShows, ...toAddShows])

  // ── Songs ────────────────────────────────────────────────────
  const existingSongs = load('songs')
  const existingSongIds = new Set(existingSongs.map(s => s.id))
  const toAddSongs = SEED_SONGS
    .filter(s => !existingSongIds.has(s.id))
    .map(s => ({ ...s, created_at: new Date().toISOString() }))
  if (toAddSongs.length) save('songs', [...existingSongs, ...toAddSongs])

  // ── Moments ──────────────────────────────────────────────────
  const existingMoments = load('moments')
  const existingMomentIds = new Set(existingMoments.map(m => m.id))
  // Migrate: ensure soloists field exists on legacy moments
  const migratedMoments = existingMoments.map(m => m.soloists !== undefined ? m : { ...m, soloists: '[]' })
  const toAddMoments = SEED_MOMENTS
    .filter(m => !existingMomentIds.has(m.id))
    .map(m => ({ ...m, created_at: new Date().toISOString() }))
  const momentsChanged = JSON.stringify(migratedMoments) !== JSON.stringify(existingMoments)
  if (toAddMoments.length || momentsChanged) save('moments', [...migratedMoments, ...toAddMoments])

  // ── Positions ────────────────────────────────────────────────
  const existingPositions = load('positions')
  const momentIdsWithPositions = new Set(existingPositions.map(p => p.moment_id))
  const toAddPositions = []
  for (const [momentId, posList] of Object.entries(SEED_POSITIONS)) {
    if (!momentIdsWithPositions.has(momentId)) {
      posList.forEach(p => toAddPositions.push({
        id: devUuid(),
        created_at: new Date().toISOString(),
        moment_id: momentId,
        member_id: p.member_id,
        grid_row: p.grid_row,
        grid_col: p.grid_col,
      }))
    }
  }
  if (toAddPositions.length) save('positions', [...existingPositions, ...toAddPositions])
}

ensureSeedData()

// ─── Query Builder ────────────────────────────────────────────
class QB {
  constructor(table) {
    this._t = table
    this._op = null
    this._payload = null
    this._filters = []
    this._orderCol = null
    this._orderAsc = true
    this._single = false
  }

  select() { if (!this._op) this._op = 'select'; return this }
  insert(data) { this._op = 'insert'; this._payload = data; return this }
  update(data) { this._op = 'update'; this._payload = data; return this }
  delete() { this._op = 'delete'; return this }

  eq(col, val) { this._filters.push(['eq', col, val]); return this }
  in(col, vals) { this._filters.push(['in', col, vals]); return this }
  order(col, opts = {}) { this._orderCol = col; this._orderAsc = opts.ascending !== false; return this }

  single() { this._single = true; return Promise.resolve(this._exec()) }
  then(res, rej) { return Promise.resolve(this._exec()).then(res, rej) }

  _match(row) {
    return this._filters.every(([type, col, val]) => {
      if (type === 'eq') return String(row[col]) === String(val)
      if (type === 'in') return (val ?? []).map(String).includes(String(row[col]))
      return true
    })
  }

  _exec() {
    let rows = load(this._t)
    const op = this._op ?? 'select'

    if (op === 'select') {
      let res = rows.filter(r => this._match(r))
      if (this._orderCol) {
        const col = this._orderCol, asc = this._orderAsc
        res.sort((a, b) => {
          const av = a[col] ?? '', bv = b[col] ?? ''
          return asc ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0)
        })
      }
      return this._single
        ? { data: res[0] ?? null, error: res.length ? null : { message: 'Row not found' } }
        : { data: res, error: null }
    }

    if (op === 'insert') {
      const items = (Array.isArray(this._payload) ? this._payload : [this._payload])
        .map(r => ({ id: devUuid(), created_at: new Date().toISOString(), ...r }))
      save(this._t, [...rows, ...items])
      return this._single ? { data: items[0], error: null } : { data: items, error: null }
    }

    if (op === 'update') {
      const updated = []
      rows = rows.map(r => {
        if (this._match(r)) { const u = { ...r, ...this._payload }; updated.push(u); return u }
        return r
      })
      save(this._t, rows)
      return this._single ? { data: updated[0] ?? null, error: null } : { data: updated, error: null }
    }

    if (op === 'delete') {
      save(this._t, rows.filter(r => !this._match(r)))
      return { data: null, error: null }
    }

    return { data: null, error: null }
  }
}

const devAuth = {
  getSession: async () => ({ data: { session: DEV_SESSION }, error: null }),
  onAuthStateChange: (cb) => {
    setTimeout(() => cb('SIGNED_IN', DEV_SESSION), 0)
    return { data: { subscription: { unsubscribe: () => {} } } }
  },
  signInWithPassword: async () => ({ data: { session: DEV_SESSION }, error: null }),
  signInWithOAuth: async () => ({ data: {}, error: null }),
  signOut: async () => ({ error: null }),
  getUser: async () => ({ data: { user: DEV_USER }, error: null }),
}

export const devSupabase = {
  from: (table) => new QB(table),
  auth: devAuth,
}
