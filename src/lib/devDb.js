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
  { id: 'dev-m-s1-1', name: 'Anna Soler',    initials: 'AS', voice: 'soprano1', role: 'choir' },
  { id: 'dev-m-s1-2', name: 'Clara Puig',    initials: 'CP', voice: 'soprano1', role: 'choir' },
  { id: 'dev-m-s2-1', name: 'Marta Blau',    initials: 'MB', voice: 'soprano2', role: 'choir' },
  { id: 'dev-m-s2-2', name: 'Núria Ferrer',  initials: 'NF', voice: 'soprano2', role: 'choir' },
  { id: 'dev-m-a1-1', name: 'Elena Roca',    initials: 'ER', voice: 'alto1',    role: 'choir' },
  { id: 'dev-m-a1-2', name: 'Júlia Mas',     initials: 'JM', voice: 'alto1',    role: 'choir' },
  { id: 'dev-m-a2-1', name: 'Laia Font',     initials: 'LF', voice: 'alto2',    role: 'choir' },
  { id: 'dev-m-a2-2', name: 'Sofia Mir',     initials: 'SM', voice: 'alto2',    role: 'choir' },
  { id: 'dev-m-t1-1', name: 'Carles Vidal',  initials: 'CV', voice: 'tenor1',   role: 'choir' },
  { id: 'dev-m-t1-2', name: 'Marc Sala',     initials: 'MS', voice: 'tenor1',   role: 'choir' },
  { id: 'dev-m-t2-1', name: 'Pere Grau',     initials: 'PG', voice: 'tenor2',   role: 'choir' },
  { id: 'dev-m-t2-2', name: 'Jordi Font',    initials: 'JF', voice: 'tenor2',   role: 'choir' },
  { id: 'dev-m-br-1', name: 'Ricard Bosch',  initials: 'RB', voice: 'baritone', role: 'choir' },
  { id: 'dev-m-br-2', name: 'Pau Serra',     initials: 'PS', voice: 'baritone', role: 'choir' },
  { id: 'dev-m-ba-1', name: 'Miquel Torres', initials: 'MT', voice: 'bass',     role: 'choir' },
  { id: 'dev-m-ba-2', name: 'Sergi Camps',   initials: 'SC', voice: 'bass',     role: 'choir' },
]

function ensureSeedData() {
  // Ensure show has grid config
  const shows = load('shows')
  const DEFAULT_ROWS = ['Tarima 4', 'Tarima 3', 'Tarima 2', 'Tarima 1', 'Terra']
  const updatedShows = shows.map(s => ({
    ...s,
    grid_rows: s.grid_rows ?? DEFAULT_ROWS,
    grid_cols: s.grid_cols ?? 14,
  }))
  if (JSON.stringify(updatedShows) !== JSON.stringify(shows)) save('shows', updatedShows)

  // Add any missing seed members (by id)
  const existing = load('members')
  const existingIds = new Set(existing.map(m => m.id))
  const toAdd = SEED_MEMBERS
    .filter(m => !existingIds.has(m.id))
    .map(m => ({ ...m, created_at: new Date().toISOString() }))
  if (toAdd.length) save('members', [...existing, ...toAdd])
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
