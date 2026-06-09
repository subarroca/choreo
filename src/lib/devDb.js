// Mock Supabase client for local development (VITE_DEV_MODE=true)
// Persists data to localStorage. Auth is bypassed — always signed in as director.

export const DEV_USER = {
  id: 'dev-user-001',
  email: 'dev@localhost',
  user_metadata: { role: 'director', full_name: 'Dev Director' },
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

// ─── Seed initialization ──────────────────────────────────────
const SEED_MEMBERS = [
  { id: 'dev-m-dir-1', first_name: 'Arnau',   last_name: 'Casals',  name: 'Arnau Casals',  initials: 'AC', voice: 'director', role: 'director', height: 177, birth_date: '1979-05-20', joined_at: '2008-09-01', instagram: '', google_account: 'arnau.casals@gmail.com' },
  { id: 'dev-m-s1-1', first_name: 'Anna',    last_name: 'Soler',   name: 'Anna Soler',    initials: 'AS', voice: 'soprano1', role: 'choir', height: 162, birth_date: '1998-03-14', joined_at: '2020-09-01', instagram: 'annasoler', google_account: 'anna.soler@gmail.com' },
  { id: 'dev-m-s1-2', first_name: 'Clara',   last_name: 'Puig',    name: 'Clara Puig',    initials: 'CP', voice: 'soprano1', role: 'choir', height: 165, birth_date: '2001-07-22', joined_at: '2022-01-10', instagram: '', google_account: '' },
  { id: 'dev-m-s2-1', first_name: 'Marta',   last_name: 'Blau',    name: 'Marta Blau',    initials: 'MB', voice: 'soprano2', role: 'choir', height: 158, birth_date: '1995-11-05', joined_at: '2018-09-01', instagram: 'martablau', google_account: '' },
  { id: 'dev-m-s2-2', first_name: 'Núria',   last_name: 'Ferrer',  name: 'Núria Ferrer',  initials: 'NF', voice: 'soprano2', role: 'choir', height: 170, birth_date: '2000-04-30', joined_at: '2021-09-15', instagram: '', google_account: '' },
  { id: 'dev-m-a1-1', first_name: 'Elena',   last_name: 'Roca',    name: 'Elena Roca',    initials: 'ER', voice: 'alto1',    role: 'choir', height: 167, birth_date: '1993-08-18', joined_at: '2016-01-01', instagram: 'elenaroca', google_account: 'elena.roca@gmail.com' },
  { id: 'dev-m-a1-2', first_name: 'Júlia',   last_name: 'Mas',     name: 'Júlia Mas',     initials: 'JM', voice: 'alto1',    role: 'choir', height: 160, birth_date: '2002-02-09', joined_at: '2023-09-01', instagram: '', google_account: '' },
  { id: 'dev-m-a2-1', first_name: 'Laia',    last_name: 'Font',    name: 'Laia Font',     initials: 'LF', voice: 'alto2',    role: 'choir', height: 172, birth_date: '1997-06-25', joined_at: '2019-09-01', instagram: 'laiafont', google_account: '' },
  { id: 'dev-m-a2-2', first_name: 'Sofia',   last_name: 'Mir',     name: 'Sofia Mir',     initials: 'SM', voice: 'alto2',    role: 'choir', height: 155, birth_date: '2003-10-13', joined_at: '2023-01-15', instagram: '', google_account: '' },
  { id: 'dev-m-t1-1', first_name: 'Carles',  last_name: 'Vidal',   name: 'Carles Vidal',  initials: 'CV', voice: 'tenor1',   role: 'choir', height: 178, birth_date: '1990-05-07', joined_at: '2014-09-01', instagram: 'carlesvidal', google_account: 'carles.vidal@gmail.com' },
  { id: 'dev-m-t1-2', first_name: 'Marc',    last_name: 'Sala',    name: 'Marc Sala',     initials: 'MS', voice: 'tenor1',   role: 'choir', height: 175, birth_date: '1999-12-01', joined_at: '2021-09-01', instagram: '', google_account: '' },
  { id: 'dev-m-t2-1', first_name: 'Pere',    last_name: 'Grau',    name: 'Pere Grau',     initials: 'PG', voice: 'tenor2',   role: 'choir', height: 182, birth_date: '1988-09-20', joined_at: '2012-01-01', instagram: '', google_account: '' },
  { id: 'dev-m-t2-2', first_name: 'Jordi',   last_name: 'Font',    name: 'Jordi Font',    initials: 'JF', voice: 'tenor2',   role: 'choir', height: 176, birth_date: '1994-03-11', joined_at: '2017-09-01', instagram: 'jordifont', google_account: '' },
  { id: 'dev-m-br-1', first_name: 'Ricard',  last_name: 'Bosch',   name: 'Ricard Bosch',  initials: 'RB', voice: 'baritone', role: 'choir', height: 180, birth_date: '1985-07-16', joined_at: '2010-09-01', instagram: '', google_account: 'ricard.bosch@gmail.com' },
  { id: 'dev-m-br-2', first_name: 'Pau',     last_name: 'Serra',   name: 'Pau Serra',     initials: 'PS', voice: 'baritone', role: 'choir', height: 174, birth_date: '1996-01-28', joined_at: '2020-01-15', instagram: 'pauserra', google_account: '' },
  { id: 'dev-m-ba-1', first_name: 'Miquel',  last_name: 'Torres',  name: 'Miquel Torres', initials: 'MT', voice: 'bass',     role: 'choir', height: 185, birth_date: '1982-11-03', joined_at: '2008-09-01', instagram: '', google_account: 'miquel.torres@gmail.com' },
  { id: 'dev-m-ba-2', first_name: 'Sergi',   last_name: 'Camps',   name: 'Sergi Camps',   initials: 'SC', voice: 'bass',     role: 'choir', height: 183, birth_date: '1991-04-19', joined_at: '2015-09-01', instagram: '', google_account: '' },
]

function ensureSeedData() {
  // Ensure show has grid config
  const shows = load('shows')
  const DEFAULT_ROWS = ['Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra']
  const defaultElevations = rows => rows.map((_, i, a) => (a.length - 1 - i) * 40)
  const updatedShows = shows.map(s => {
    const rows = s.grid_rows ?? DEFAULT_ROWS
    return {
      ...s,
      grid_rows: rows,
      grid_cols: s.grid_cols ?? 14,
      row_elevations: s.row_elevations ?? defaultElevations(rows),
    }
  })
  if (JSON.stringify(updatedShows) !== JSON.stringify(shows)) save('shows', updatedShows)

  // Add any missing seed members (by id), and migrate existing ones with new fields
  const existing = load('members')
  const existingIds = new Set(existing.map(m => m.id))
  const toAdd = SEED_MEMBERS
    .filter(m => !existingIds.has(m.id))
    .map(m => ({ active: true, ...m, created_at: new Date().toISOString() }))
  // Migrate existing seed members to add new fields if missing
  const migrated = existing.map(m => {
    const seed = SEED_MEMBERS.find(s => s.id === m.id)
    const base = seed ? {
      first_name: seed.first_name, last_name: seed.last_name,
      height: seed.height, birth_date: seed.birth_date,
      joined_at: seed.joined_at, instagram: seed.instagram,
      google_account: seed.google_account,
    } : {}
    return { active: true, ...base, ...m }
  })
  const changed = JSON.stringify(migrated) !== JSON.stringify(existing)
  if (toAdd.length || changed) save('members', [...migrated, ...toAdd])
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
