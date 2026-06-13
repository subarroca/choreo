// Vocabulari del disseny de llums — basat en les memòries reals
// del tècnic ("NO FR", "poc FR", "FR", "+FR", "FOSC", "barrido",
// "chase", "mòbils", "canó", "+ SALA"…)

// ─── Intensitats: 5 passes consistents en % ───────────────────
// Es guarda 0-4; es mostra 0/25/50/75/100 %.
export const LIGHT_LEVELS = [
  { value: 0, label: '0' },
  { value: 1, label: '25' },
  { value: 2, label: '50' },
  { value: 3, label: '75' },
  { value: 4, label: '100' },
]
export const levelPct = (v) => (v ?? 0) * 25

export const LIGHT_SCOPES = [
  { value: 'tots',     label: 'Tothom' },
  { value: 'cor',      label: 'Només cor' },
  { value: 'solistes', label: 'Només solistes' },
]

// ─── Focus per banda: tres per frontal i tres per contra ──────
// (vistos des del públic), cadascun amb intensitat pròpia.
export const LIGHT_ZONES = [
  { value: 'esquerra', label: 'Esquerra', short: 'esq' },
  { value: 'centre',   label: 'Centre',   short: 'cen' },
  { value: 'dreta',    label: 'Dreta',    short: 'dre' },
]
const ZONE_KEYS = LIGHT_ZONES.map(z => z.value)
export const EMPTY_LEVELS = { esquerra: 0, centre: 0, dreta: 0 }

// ─── Efectes ──────────────────────────────────────────────────
export const LIGHT_EFFECTS = [
  { value: 'fosc',     label: 'Blackout', icon: 'Moon' },
  { value: 'barrido',  label: 'Sweep', icon: 'Wind' },
  { value: 'chase',    label: 'Chase', icon: 'Sparkles' },
  { value: 'mobils',   label: 'Movers', icon: 'Move' },
  { value: 'stop_mov', label: 'Freeze', icon: 'Pause' },
]

// Sala i públic: opcions pròpies, fora dels efectes d'escenari
export const AUDIENCE_OPTIONS = [
  { value: 'sala',   label: 'Llums de sala', icon: 'Theater' },
  { value: 'public', label: 'Públic', icon: 'ScanFace' },
]

// Mapa d'icones per efectes (nom de lucide-react)
export function effectIcon(effectValue) {
  const effect = [...LIGHT_EFFECTS, ...AUDIENCE_OPTIONS].find(e => e.value === effectValue)
  return effect?.icon ?? null
}

// ─── Paleta de colors (gelatines habituals) ───────────────────
export const LIGHT_COLORS = [
  { id: 'calid',    label: 'Càlid',    hex: '#fbbf24' },
  { id: 'blanc',    label: 'Blanc',    hex: '#f8fafc' },
  { id: 'ambre',    label: 'Ambre',    hex: '#f97316' },
  { id: 'vermell',  label: 'Vermell',  hex: '#ef4444' },
  { id: 'rosa',     label: 'Rosa',     hex: '#f472b6' },
  { id: 'lila',     label: 'Lila',     hex: '#a78bfa' },
  { id: 'blau',     label: 'Blau',     hex: '#3b82f6' },
  { id: 'cian',     label: 'Cian',     hex: '#22d3ee' },
  { id: 'verd',     label: 'Verd',     hex: '#4ade80' },
]

export const lightColor = (id) => LIGHT_COLORS.find(c => c.id === id) ?? null

// Retorna tots els colors únics d'una banda com a array de hex.
// Si hi ha nivells actius però cap color assignat, retorna gris (neutre).
export function sideColorHexes(cue, side) {
  const zc = cueZoneColors(cue, side)
  const colors = ZONE_KEYS.map(z => zc[z]).filter(Boolean)
  const unique = [...new Set(colors)]
  const hexes = unique.map(id => lightColor(id)?.hex).filter(Boolean)
  if (hexes.length === 0 && sideMax(cueLevels(cue, side)) > 0) return ['#9ca3af']
  return hexes
}

// ─── Tipus de disparador ──────────────────────────────────────
export const TRIGGER_TYPES = [
  { value: 'lyric',      label: 'Lletra' },
  { value: 'action',     label: 'Acció escènica' },
  { value: 'structural', label: 'Estructural' },
]

export const FOLLOWSPOT_POSITIONS = ['esquerra', 'centre', 'dreta']

// ─── Parsers (els camps JSON arriben com a string de Supabase) ─
function parseJsonArray(v) {
  if (Array.isArray(v)) return v
  try { const p = JSON.parse(v || '[]'); return Array.isArray(p) ? p : [] } catch { return [] }
}

export const cueEffects = (cue) => parseJsonArray(cue?.effects)
export const cueFollowspots = (cue) => parseJsonArray(cue?.followspots)

// Nivells per focus d'una banda: { esquerra, centre, dreta } amb valors 0-4
export function cueLevels(cue, side) {
  const raw = side === 'back' ? cue?.back_levels : cue?.front_levels
  let obj = raw
  if (typeof raw === 'string') { try { obj = JSON.parse(raw) } catch { obj = null } }
  if (!obj || typeof obj !== 'object') obj = {}
  const out = {}
  for (const z of ZONE_KEYS) out[z] = Math.max(0, Math.min(4, Number(obj[z]) || 0))
  return out
}

export const sideMax = (levels) => Math.max(...ZONE_KEYS.map(z => levels[z] ?? 0))

// Colors per zona (esquerra/centre/dreta). Backward compat: string antic → totes les zones.
export function cueZoneColors(cue, side) {
  const raw = side === 'front' ? cue?.front_color : cue?.back_color
  if (!raw) return { esquerra: null, centre: null, dreta: null }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return { esquerra: null, centre: null, dreta: null, ...parsed }
  } catch {}
  return { esquerra: raw, centre: raw, dreta: raw }
}

// Primer hex no-nul d'una banda (per a chips i taules).
export const sideColorHex = (cue, side) => {
  const zc = cueZoneColors(cue, side)
  const first = ZONE_KEYS.map(z => zc[z]).find(Boolean)
  return first ? (lightColor(first)?.hex ?? null) : null
}

// ─── Format ───────────────────────────────────────────────────
export function formatCueNumber(n) {
  if (n == null) return ''
  return String(Number(n))
}

// "F 75% càlid" si els tres focus van iguals;
// "F esq25 · cen100 càlid" si van diferents.
function sideSummary(cue, side) {
  const levels = cueLevels(cue, side)
  const vals = ZONE_KEYS.map(z => levels[z])
  const max = Math.max(...vals)
  const name = side === 'front' ? 'F' : 'C'
  if (max === 0) return side === 'front' ? 'NO F' : null
  const active = ZONE_KEYS.filter(z => levels[z] > 0)
  const uniform = active.length === 3 && vals.every(v => v === vals[0])
  let txt = uniform
    ? `${name} ${levelPct(vals[0])}%`
    : `${name} ${active.map(z => `${LIGHT_ZONES.find(x => x.value === z).short}${levelPct(levels[z])}`).join(' · ')}`
  if (side === 'front' && cue.scope && cue.scope !== 'tots') txt += cue.scope === 'cor' ? ' cor' : ' sol.'
  const zc = cueZoneColors(cue, side)
  const colorId = ZONE_KEYS.map(z => zc[z]).find(Boolean)
  const color = colorId ? lightColor(colorId) : null
  if (color) txt += ` ${color.label.toLowerCase()}`
  return txt
}

// Resum compacte de l'estat de llum:
// "F 75% càlid · C cen50 lila · mòbils · sala · prog. 3s"
export function cueSummary(cue) {
  const parts = []
  const effects = cueEffects(cue)
  if (effects.includes('fosc')) {
    parts.push('FOSC')
  } else {
    parts.push(sideSummary(cue, 'front'))
    const back = sideSummary(cue, 'back')
    if (back) parts.push(back)
  }
  for (const e of effects) {
    if (e === 'fosc') continue
    const label = LIGHT_EFFECTS.find(x => x.value === e)?.label ?? AUDIENCE_OPTIONS.find(x => x.value === e)?.label
    parts.push((label ?? e).toLowerCase())
  }
  for (const fs of cueFollowspots(cue)) parts.push(`${fs.label ?? 'canó'} ${fs.position ?? ''}`.trim().toLowerCase())
  if (cue.transition === 'prog') parts.push(cue.transition_seconds ? `prog. ${cue.transition_seconds}s` : 'prog.')
  return parts.join(' · ')
}

// Resum ultra-compacte per als chips (només efectes i transicions,
// sense info de colors/nivells que ja es veuen visualment)
export function cueSummaryCompact(cue) {
  const parts = []
  const effects = cueEffects(cue)

  if (effects.includes('fosc')) {
    parts.push('FOSC')
  }

  for (const e of effects) {
    if (e === 'fosc') continue
    const label = LIGHT_EFFECTS.find(x => x.value === e)?.label ?? AUDIENCE_OPTIONS.find(x => x.value === e)?.label
    parts.push((label ?? e).toLowerCase())
  }

  if (cue.transition === 'prog') {
    parts.push(cue.transition_seconds ? `prog. ${cue.transition_seconds}s` : 'prog.')
  }

  return parts.length > 0 ? parts.join(' · ') : ''
}

// Següent número de cue lliure (enter següent al màxim)
export function nextCueNumber(cues) {
  if (!cues?.length) return 1
  return Math.floor(Math.max(...cues.map(c => Number(c.cue_number) || 0))) + 1
}

export function sortCues(cues) {
  return [...cues].sort((a, b) => (Number(a.cue_number) || 0) - (Number(b.cue_number) || 0))
}

// Línies de lletra d'una cançó (índexs estables per ancorar cues)
export function lyricsLines(lyrics) {
  return (lyrics ?? '').split('\n')
}

// Moment efectiu d'un cue: el seu propi, o el de l'últim cue anterior
// que en tingui (les posicions persisteixen fins que canvien).
export function effectiveMomentId(cue, allCues) {
  if (!cue) return null
  if (cue.moment_id) return cue.moment_id
  const n = Number(cue.cue_number) || 0
  const prev = sortCues(allCues).filter(c => (Number(c.cue_number) || 0) < n && c.moment_id)
  return prev.length ? prev[prev.length - 1].moment_id : null
}

// ─── Reproducció (mode karaoke) ───────────────────────────────
// Seqüència de passos d'una cançó: línies de lletra en ordre,
// amb els cues intercalats al seu punt (per línia ancorada o,
// si no en tenen, com a pas propi en ordre de número).
export function buildPlaybackSteps(lines, cues) {
  const steps = []
  let pointer = 0
  const pushLine = (i, cueObj = null) => steps.push({ line: i, cue: cueObj })
  for (const cue of sortCues(cues)) {
    if (cue.lyric_line != null && cue.lyric_line < lines.length && cue.lyric_line >= pointer) {
      while (pointer < cue.lyric_line) {
        if (lines[pointer].trim()) pushLine(pointer)
        pointer++
      }
      pushLine(cue.lyric_line, cue)
      pointer = cue.lyric_line + 1
    } else {
      steps.push({ line: null, cue })
    }
  }
  while (pointer < lines.length) {
    if (lines[pointer].trim()) pushLine(pointer)
    pointer++
  }
  return steps
}

// Camps d'estat de llum que un preset copia a un cue
export const PRESET_FIELDS = [
  'front_levels', 'back_levels', 'front_color', 'back_color',
  'scope', 'effects', 'transition', 'transition_seconds',
]

export function presetToCueFields(preset) {
  const f = {}
  for (const k of PRESET_FIELDS) f[k] = preset[k] ?? null
  f.front_levels ??= JSON.stringify(EMPTY_LEVELS)
  f.back_levels ??= JSON.stringify(EMPTY_LEVELS)
  f.scope ??= 'tots'
  f.effects ??= '[]'; f.transition ??= 'tall'
  f.preset_id = preset.id
  return f
}
