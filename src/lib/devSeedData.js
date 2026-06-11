// Seed data constants for local development mock DB
// Imported by devSeedPositions.js and devDb.js

// ─── Seed: Membres reals — Condal 2026 ───────────────────────
// Colors del PDF: baritone=vermell, bass=salmó, tenor1=verd fosc, tenor2=verd clar
//                 soprano1=blau fosc, soprano2=blau clar, alto1=fúcsia, alto2=rosa/lila
export const SEED_MEMBERS = [
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
export const SEED_SHOWS = [
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

// ─── Seed: Parts del Condal 2026 ─────────────────────────────
export const SEED_PARTS = [
  { id: 'dev-part-1', show_id: CONDAL_SHOW_ID, title: 'Primera Part', order_index: 0 },
  { id: 'dev-part-2', show_id: CONDAL_SHOW_ID, title: 'Segona Part',  order_index: 1 },
]

// ─── Seed: Setlist Condal 2026 ────────────────────────────────
export const SEED_SONGS = [
  // PRIMERA PART
  { id: 'dev-song-01', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-01', title: 'Medley Rey León',        notes: '', order: 1 },
  { id: 'dev-song-02', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-02', title: 'The Seal Lullaby',        notes: '', order: 2 },
  { id: 'dev-song-03', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-03', title: 'Euphoria',                notes: '', order: 3 },
  { id: 'dev-song-04', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-04', title: 'Better is One Day',       notes: '', order: 4 },
  { id: 'dev-song-05', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-05', title: 'Rise Up',                 notes: '', order: 5 },
  { id: 'dev-song-06', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-06', title: 'Defying Gravity',         notes: '', order: 6 },
  { id: 'dev-song-07', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-07', title: 'Medley Rent',             notes: '', order: 7 },
  { id: 'dev-song-08', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-1', repertoire_song_id: 'rep-08', title: "You Can't Stop the Beat", notes: '', order: 8 },
  // SEGONA PART
  { id: 'dev-song-09', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-09', title: 'The Greatest Show',       notes: '', order: 9 },
  { id: 'dev-song-10', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-10', title: 'Baba Yetu',               notes: '', order: 10 },
  { id: 'dev-song-11', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-11', title: 'Hallelujah',              notes: '', order: 11 },
  { id: 'dev-song-12', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-12', title: 'Medley Queen',            notes: '', order: 12 },
  { id: 'dev-song-13', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-13', title: 'Viva la Vida',            notes: '', order: 13 },
  { id: 'dev-song-14', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-14', title: 'Believe',                 notes: '', order: 14 },
  { id: 'dev-song-15', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-15', title: 'Titanium',                notes: '', order: 15 },
  { id: 'dev-song-16', show_id: CONDAL_SHOW_ID, part_id: 'dev-part-2', repertoire_song_id: 'rep-16', title: 'Medley Beyoncé',          notes: '', order: 16 },
]

// ─── Seed: Repertori global (Condal 2026) ────────────────────
export const SEED_REPERTOIRE = [
  {
    id: 'rep-01', title: 'Medley Rey León', composer: 'Elton John / Hans Zimmer',
    notes: 'Circle of Life + He Lives in You. Arranjament coral.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Circle of Life (YouTube)', url: 'https://www.youtube.com/watch?v=GibiNy4d4gc' },
      { type: 'reference', label: 'He Lives in You (YouTube)', url: 'https://www.youtube.com/watch?v=e2pVBNtbSCc' },
    ]),
    lyrics: `CIRCLE OF LIFE\nNants ingonyama bagithi Baba\nSithi uhm ingonyama\nNants ingonyama bagithi baba\nSithi uhhmm ingonyama\nIngonyama\n\nFrom the day we arrive on the planet\nAnd blinking, step into the sun\nThere's more to be seen than can ever be seen\nMore to do than can ever be done\n\nSome say eat or be eaten\nSome say live and let live\nBut all are agreed as they join the stampede\nYou should never take more than you give\n\nIn the circle of life\nIt's the wheel of fortune\nIt's the leap of faith\nIt's the band of hope\nTill we find our place\nOn the path unwinding\nIn the circle, the circle of life`,
  },
  {
    id: 'rep-02', title: 'The Seal Lullaby', composer: 'Eric Whitacre',
    notes: 'Text de Rudyard Kipling. Peça a cappella.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Eric Whitacre (YouTube)', url: 'https://www.youtube.com/watch?v=3D7ZNITpA5g' },
    ]),
    lyrics: `Oh! Hush thee, my baby, the night is behind us,\nAnd black are the waters that sparkled so green.\nThe moon, o'er the combers, looks downward to find us\nAt rest in the hollows that rustle between.\n\nWhere billow meets billow, then soft be thy pillow,\nAh, weary wee flipperling, curl at thy ease!\nThe storm shall not wake thee, nor shark overtake thee,\nAsleep in the arms of the slow-swinging seas.`,
  },
  {
    id: 'rep-03', title: 'Euphoria', composer: 'Loreen / Thomas G:son',
    notes: 'Eurovision 2012. Arranjament per a cor mixte.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Loreen - Euphoria (YouTube)', url: 'https://www.youtube.com/watch?v=Pfo-8z86x80' },
    ]),
    lyrics: `I am captured by a spell\nA paradise, a living hell\nI feel you coursing through my veins\nConsume my heart, ignite my brain\n\nI close my eyes, I'm in a trance\nLost in your hypnotic dance\nYou light me up, you burn me down\nI'm king and fool, I'm lost and found\n\nEuphoria\nForever, till the end of time\nFrom now on, only you and I\nEuphoria\nWe're going up, up, up, up, up`,
  },
  {
    id: 'rep-04', title: 'Better is One Day', composer: 'Matt Redman',
    notes: 'Cançó gospel/worship. Arranjament coral.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Better is One Day (YouTube)', url: 'https://www.youtube.com/watch?v=V-UHtbGIsto' },
    ]),
    lyrics: `How lovely is Your dwelling place\nO Lord Almighty\nFor my soul longs and even faints for You\nFor here my heart is satisfied\nWithin Your presence\nI sing beneath the shadow of Your wings\n\nBetter is one day in Your courts\nBetter is one day in Your house\nBetter is one day in Your courts\nThan thousands elsewhere`,
  },
  {
    id: 'rep-05', title: 'Rise Up', composer: 'Cassandra Batie / Jennifer Decilveo',
    notes: 'Popularitzat per Andra Day. Arranjament SATB.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Andra Day - Rise Up (YouTube)', url: 'https://www.youtube.com/watch?v=lwgr_IMeEgA' },
    ]),
    lyrics: `You're broken down and tired\nOf living life on a merry go round\nAnd you can't find the fighter\nBut I see it in you so we gonna walk it out\nAnd move mountains\n\nI'll rise up, I'll rise like the day\nI'll rise up, I'll rise unafraid\nI'll rise up, and I'll do it a thousand times again\n\nFor you, for you\nFor you, for you`,
  },
  {
    id: 'rep-06', title: 'Defying Gravity', composer: 'Stephen Schwartz',
    notes: 'Del musical Wicked. Soprano solista.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Defying Gravity - Wicked (YouTube)', url: 'https://www.youtube.com/watch?v=pKMbnlJDhUE' },
    ]),
    lyrics: `Something has changed within me\nSomething is not the same\nI'm through with playing by the rules\nOf someone else's game\n\nToo late for second-guessing\nToo late to go back to sleep\nIt's time to trust my instincts\nClose my eyes and leap!\n\nIt's time to try defying gravity\nI think I'll try defying gravity\nAnd you can't pull me down!`,
  },
  {
    id: 'rep-07', title: 'Medley Rent', composer: 'Jonathan Larson',
    notes: 'Seasons of Love + No Day But Today + La Vie Bohème.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Seasons of Love (YouTube)', url: 'https://www.youtube.com/watch?v=hj7LRuusFqo' },
    ]),
    lyrics: `Five hundred twenty-five thousand six hundred minutes\nFive hundred twenty-five thousand moments so dear\nFive hundred twenty-five thousand six hundred minutes\nHow do you measure, measure a year?\n\nIn daylights, in sunsets\nIn midnights, in cups of coffee\nIn inches, in miles\nIn laughter, in strife\n\nIn five hundred twenty-five thousand six hundred minutes\nHow do you measure a year in the life?\nHow about love?`,
  },
  {
    id: 'rep-08', title: "You Can't Stop the Beat", composer: 'Marc Shaiman / Scott Wittman',
    notes: 'Del musical Hairspray. Fi de la primera part.',
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: "You Can't Stop the Beat (YouTube)", url: 'https://www.youtube.com/watch?v=zCVlimtn7kA' },
    ]),
    lyrics: `You can't stop an avalanche as it races down the hill\nYou can try to stop the seasons, girl, but ya know you never will\nAnd you can try to stop my dancin' feet\nBut I just cannot stand still\n\n'Cause the world keeps spinning 'round and 'round\nAnd my heart's keeping time to the speed of sound\nI was lost 'til I heard the drums\nThen I found my way\n\n'Cause you can't stop the beat!`,
  },
  {
    id: 'rep-09', title: 'The Greatest Show', composer: 'Pasek & Paul / Ryan Lewis',
    notes: "De la pel·lícula The Greatest Showman. Inici de la 2a part.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'The Greatest Show (YouTube)', url: 'https://www.youtube.com/watch?v=yjki-9e536U' },
    ]),
    lyrics: `Whoa-oh, whoa-oh, whoa-oh, oh\nThis is the greatest show\n\nWoah-oh-oh\n\nLadies and gents, this is the moment you've waited for\nBeen searching in the dark, your sweat soaking through the floor\nAnd buried in your bones there's an ache that you can't ignore\nTaking your breath, stealing your mind\nAnd all that was real is left behind\n\nDon't fight it, it's coming for you, running at ya\nIt's only this moment, don't care what comes after\nYour fever dream, can't you see it getting closer?\nJust surrender 'cause you feel the feeling taking over`,
  },
  {
    id: 'rep-10', title: 'Baba Yetu', composer: 'Christopher Tin',
    notes: "Oració del Pare Nostre en swahili. Grammy 2011.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Baba Yetu - Christopher Tin (YouTube)', url: 'https://www.youtube.com/watch?v=IJiHDmyhE1A' },
    ]),
    lyrics: `Baba yetu, yetu uliye\nMbinguni yetu, yetu amina\nBaba yetu, yetu uliye\nJina lako litukuzwe\n\nUtupe leo chakula chetu\nTunachohitaji utusamehe\nMakosa yetu, hey!\nKama nasi tunavyowasamehe\nWaliotukosea usitutie\nKatika majaribu\nLakini utuokoe\nNa yule muovu milele\n\nAmina!`,
  },
  {
    id: 'rep-11', title: 'Hallelujah', composer: 'Leonard Cohen',
    notes: "Versió coral. Arranjament per a SATB.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Hallelujah - Leonard Cohen (YouTube)', url: 'https://www.youtube.com/watch?v=ttEMYvpoR-k' },
    ]),
    lyrics: `I've heard there was a secret chord\nThat David played, and it pleased the Lord\nBut you don't really care for music, do you?\nIt goes like this, the fourth, the fifth\nThe minor fall, the major lift\nThe baffled king composing Hallelujah\n\nHallelujah, Hallelujah\nHallelujah, Hallelujah`,
  },
  {
    id: 'rep-12', title: 'Medley Queen', composer: 'Freddie Mercury / Brian May / Roger Taylor',
    notes: "Bohemian Rhapsody + We Are the Champions + Somebody to Love",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Bohemian Rhapsody (YouTube)', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
      { type: 'reference', label: 'We Are the Champions (YouTube)', url: 'https://www.youtube.com/watch?v=04854XqcfBY' },
    ]),
    lyrics: `Is this the real life?\nIs this just fantasy?\nCaught in a landslide\nNo escape from reality\n\nOpen your eyes\nLook up to the skies and see\nI'm just a poor boy, I need no sympathy\nBecause it's easy come, easy go\nLittle high, little low\nAny way the wind blows\nDoesn't really matter to me, to me\n\nWe are the champions, my friends\nAnd we'll keep on fighting 'til the end\nWe are the champions\nWe are the champions\nNo time for losers\n'Cause we are the champions of the world`,
  },
  {
    id: 'rep-13', title: 'Viva la Vida', composer: 'Coldplay',
    notes: "Arranjament per a cor mixte amb percussió.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Viva la Vida - Coldplay (YouTube)', url: 'https://www.youtube.com/watch?v=dvgZkm1xWPE' },
    ]),
    lyrics: `I used to rule the world\nSeas would rise when I gave the word\nNow in the morning I sleep alone\nSweep the streets I used to own\n\nI used to roll the dice\nFeel the fear in my enemy's eyes\nListened as the crowd would sing:\n"Now the old king is dead! Long live the king!"\n\nOne minute I held the key\nNext the walls were closed on me\nAnd I discovered that my castles stand\nUpon pillars of salt and pillars of sand`,
  },
  {
    id: 'rep-14', title: 'Believe', composer: 'Brian Higgins / Stuart McLennan / Paul Barry / Steven Torch / Timothy Powell / Matt Gray',
    notes: "Cher, 1998. Arranjament per a cor.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Cher - Believe (YouTube)', url: 'https://www.youtube.com/watch?v=nZXRV4MezEw' },
    ]),
    lyrics: `No matter how hard I try\nYou keep pushing me aside\nAnd I can't break through\nThere's no talking to you\n\nIt's so sad that you're leaving\nIt takes time to believe it\nBut after all is said and done\nYou're going to be the lonely one\n\nDo you believe in life after love?\nI can feel something inside me say\nI really don't think you're strong enough, no`,
  },
  {
    id: 'rep-15', title: 'Titanium', composer: 'David Guetta / Sia / Giorgio Tuinfort / Nick van de Wall',
    notes: "David Guetta ft. Sia. Arranjament SATB.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'David Guetta ft. Sia - Titanium (YouTube)', url: 'https://www.youtube.com/watch?v=JRfuAukYTKg' },
    ]),
    lyrics: `I'm bulletproof, nothing to lose\nFire away, fire away\nRicochet, you take your aim\nFire away, fire away\nYou shoot me down but I won't fall\nI am titanium\n\nShoot me down but I won't fall\nI am titanium\nI am titanium\nI am titanium`,
  },
  {
    id: 'rep-16', title: 'Medley Beyoncé', composer: 'Beyoncé Knowles / various',
    notes: "Crazy in Love + Halo + Single Ladies. Fi de l'espectacle.",
    is_public: false,
    attachments: JSON.stringify([
      { type: 'reference', label: 'Crazy in Love (YouTube)', url: 'https://www.youtube.com/watch?v=ViwtNLUqkMY' },
      { type: 'reference', label: 'Halo (YouTube)', url: 'https://www.youtube.com/watch?v=Lp7e973zozc' },
    ]),
    lyrics: `CRAZY IN LOVE\nUh oh, uh oh, uh oh, oh no no\nI look and stare so deep in your eyes\nI touch on you more and more every time\nWhen you leave I'm begging you not to go\n\nHALO\nRemember those walls I built?\nWell, baby, they're tumbling down\nAnd they didn't even put up a fight\nThey didn't even make a sound\n\nI found a way to let you in\nBut I never really had a doubt\nStanding in the light of your halo\nI got my angel now`,
  },
]

// ─── Seed: Moments per cançó (basats en el PDF Condal 2026) ───
export const SEED_MOMENTS = [
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
export const STD = [
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
