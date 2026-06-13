// Mock Supabase client for local development (VITE_DEV_MODE=true)
// Persists data to localStorage. Auth is bypassed — always signed in as director.

import { SEED_MEMBERS, SEED_SHOWS, SEED_PARTS, SEED_SONGS, SEED_REPERTOIRE, SEED_MOMENTS, SEED_SECTIONS } from './devSeedData.js'
import { SEED_POSITIONS } from './devSeedPositions.js'
import { SEED_LIGHT_CUES, SEED_LIGHT_PRESETS } from './devSeedLights.js'

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

  // ── Parts ─────────────────────────────────────────────────────
  const existingParts = load('parts')
  const existingPartIds = new Set(existingParts.map(p => p.id))
  const toAddParts = SEED_PARTS.filter(p => !existingPartIds.has(p.id))
  if (toAddParts.length) save('parts', [...existingParts, ...toAddParts])

  // ── Songs ─────────────────────────────────────────────────────
  const existingSongs = load('songs')
  const existingSongIds = new Set(existingSongs.map(s => s.id))
  // Migrate: add part_id + repertoire_song_id from seed if missing
  const migratedSongs = existingSongs.map(s => {
    const seed = SEED_SONGS.find(ss => ss.id === s.id)
    if (!seed) return s
    const needsMigration = !s.part_id || !s.repertoire_song_id
    return needsMigration ? { ...s, part_id: seed.part_id, repertoire_song_id: seed.repertoire_song_id } : s
  })
  const songsChanged = JSON.stringify(migratedSongs) !== JSON.stringify(existingSongs)
  const toAddSongs = SEED_SONGS
    .filter(s => !existingSongIds.has(s.id))
    .map(s => ({ ...s, created_at: new Date().toISOString() }))
  if (toAddSongs.length || songsChanged) save('songs', [...migratedSongs, ...toAddSongs])

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

  // ── Repertori ────────────────────────────────────────────────
  const existingRepertoire = load('repertoire_songs')
  const existingRepIds = new Set(existingRepertoire.map(s => s.id))
  // Migrate: sync lyrics from seed, ensure type field
  const allSeedRep = [...SEED_REPERTOIRE, ...SEED_SECTIONS]
  const migratedRep = existingRepertoire.map(s => {
    const seed = allSeedRep.find(r => r.id === s.id)
    const patched = { ...s, type: s.type ?? (seed?.type ?? 'song') }
    if (!patched.lyrics && seed?.lyrics) patched.lyrics = seed.lyrics
    return patched
  })
  const repChanged = JSON.stringify(migratedRep) !== JSON.stringify(existingRepertoire)
  const toAddRep = allSeedRep
    .filter(s => !existingRepIds.has(s.id))
    .map(s => ({ type: 'song', ...s, created_at: new Date().toISOString(), created_by: DEV_USER.id }))
  if (toAddRep.length || repChanged) save('repertoire_songs', [...migratedRep, ...toAddRep])

  // ── Cues de llum ─────────────────────────────────────────────
  const existingCues = load('light_cues')
  const existingCueIds = new Set(existingCues.map(c => c.id))
  // Migrate: seed rows re-sync from seed; user rows get the new shape
  // (color → front_color; nivell únic + franges → 3 focus per banda)
  const ZONES = ['esquerra', 'centre', 'dreta']
  const toLevels = (level, zonesJson) => {
    let zones = []
    try { zones = JSON.parse(zonesJson || '[]') } catch { zones = [] }
    const active = zones.length ? zones : ZONES
    const v = Math.min(4, level ?? 0)
    return JSON.stringify(Object.fromEntries(ZONES.map(z => [z, active.includes(z) ? v : 0])))
  }
  const migrateLightShape = (c) => {
    if (c.front_levels !== undefined) return c
    const { color, front_level, back_level, front_zones, back_zones, ...rest } = c
    return {
      ...rest,
      front_levels: toLevels(front_level, front_zones),
      back_levels: toLevels(back_level, back_zones),
      front_color: c.front_color ?? color ?? null,
      back_color: c.back_color ?? null,
    }
  }
  const migratedCues = existingCues.map(c => {
    const seed = SEED_LIGHT_CUES.find(s => s.id === c.id)
    const migrated = seed ? { ...c, ...seed } : migrateLightShape(c)
    return { preset_id: null, ...migrated }
  })
  const cuesChanged = JSON.stringify(migratedCues) !== JSON.stringify(existingCues)
  const toAddCues = SEED_LIGHT_CUES
    .filter(c => !existingCueIds.has(c.id))
    .map(c => ({ ...c, created_at: new Date().toISOString() }))
  if (toAddCues.length || cuesChanged) save('light_cues', [...migratedCues, ...toAddCues])

  // ── Presets de llum ──────────────────────────────────────────
  const existingPresets = load('light_presets')
  const existingPresetIds = new Set(existingPresets.map(p => p.id))
  const migratedPresets = existingPresets.map(p => {
    const seed = SEED_LIGHT_PRESETS.find(s => s.id === p.id)
    const migrated = seed ? { ...p, ...seed } : migrateLightShape(p)
    return { code: null, ...migrated }
  })
  const presetsChanged = JSON.stringify(migratedPresets) !== JSON.stringify(existingPresets)
  const toAddPresets = SEED_LIGHT_PRESETS
    .filter(p => !existingPresetIds.has(p.id))
    .map(p => ({ ...p, created_at: new Date().toISOString() }))
  if (toAddPresets.length || presetsChanged) save('light_presets', [...migratedPresets, ...toAddPresets])

  // ── Choirs ───────────────────────────────────────────────────
  const existingChoirs = load('choirs')
  const SEED_CHOIRS = [
    { id: 'dev-choir-1', name: 'Cor del Condal', description: 'Cor principal de demo' },
    { id: 'dev-choir-2', name: 'Cor Jove', description: 'Cor jove de demo' },
  ]
  const existingChoirIds = new Set(existingChoirs.map(c => c.id))
  const toAddChoirs = SEED_CHOIRS.filter(c => !existingChoirIds.has(c.id))
    .map(c => ({ ...c, created_at: new Date().toISOString() }))
  if (toAddChoirs.length) save('choirs', [...existingChoirs, ...toAddChoirs])

  // ── Migrate: add choir_id to members and shows ────────────────
  const membersAfterSeed = load('members')
  const membersNeedChoir = membersAfterSeed.some(m => !m.choir_id)
  if (membersNeedChoir) save('members', membersAfterSeed.map(m => m.choir_id ? m : { ...m, choir_id: 'dev-choir-1' }))

  const showsAfterSeed = load('shows')
  const showsNeedChoir = showsAfterSeed.some(s => !s.choir_id)
  if (showsNeedChoir) save('shows', showsAfterSeed.map(s => s.choir_id ? s : { ...s, choir_id: 'dev-choir-1' }))

  const repAfterSeed = load('repertoire_songs')
  const repNeedChoir = repAfterSeed.some(s => !s.choir_id)
  if (repNeedChoir) save('repertoire_songs', repAfterSeed.map(s => s.choir_id ? s : { ...s, choir_id: 'dev-choir-1' }))

  // ── Profiles (dev user) ──────────────────────────────────────
  const existingProfiles = load('profiles')
  if (!existingProfiles.find(p => p.id === DEV_USER.id)) {
    save('profiles', [...existingProfiles, {
      id: DEV_USER.id,
      email: DEV_USER.email,
      full_name: DEV_USER.user_metadata.full_name,
      role: DEV_USER.user_metadata.role,
    }])
  }
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
