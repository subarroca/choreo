// ────────────────────────────────────────────────────────────────────────
// Permission model — single source of truth for sections and role templates.
//
// Hybrid model: `profiles.role` (admin/director/member) sets the base, and
// `user_permissions` rows refine a member's access per section. Role TEMPLATES
// below are convenience presets the Admin UI applies to fill the granular
// toggles; once applied they remain editable per user.
// ────────────────────────────────────────────────────────────────────────

// Every gated area of the app. `view` controls visibility (nav, pages, tabs);
// `edit` controls mutation (forms, drag-drop, create/delete).
export const SECTIONS = [
  { key: 'shows',      label: 'Espectacles', desc: 'Veure i gestionar concerts' },
  { key: 'members',    label: 'Persones',    desc: 'Roster de cantaires' },
  { key: 'repertoire', label: 'Repertori',   desc: 'Biblioteca de cançons' },
  { key: 'staging',    label: 'Posicions',   desc: 'Editor de posicions i moments' },
  { key: 'lights',     label: 'Llums',       desc: 'Disseny de cues d’il·luminació' },
  { key: 'mics',       label: 'Micros',      desc: 'Assignacions de micròfons' },
  { key: 'attendance', label: 'Assajos',     desc: 'Assistència i italianes' },
  { key: 'rider',      label: 'Rider',       desc: 'Document tècnic imprimible' },
  { key: 'users',      label: 'Usuaris',     desc: 'Gestió de permisos (només admin)' },
]

export const SECTION_KEYS = SECTIONS.map(s => s.key)

const ALL_EDIT = Object.fromEntries(SECTION_KEYS.map(k => [k, { view: true, edit: true }]))

// Helper to build a permission map from a compact spec.
//   edit: sections with view+edit · view: sections view-only · rest: hidden
function build({ edit = [], view = [] }) {
  const map = {}
  for (const k of SECTION_KEYS) map[k] = { view: false, edit: false }
  for (const k of view) if (map[k]) map[k] = { view: true, edit: false }
  for (const k of edit) if (map[k]) map[k] = { view: true, edit: true }
  return map
}

// Role templates. `admin`/`director` get full access via role bypass in useAuth;
// they are listed here so the simulator and Admin presets are complete.
export const ROLE_TEMPLATES = {
  admin:         { label: 'Admin',          perms: { ...ALL_EDIT } },
  director:      { label: 'Director',        perms: build({ edit: SECTION_KEYS.filter(k => k !== 'users') }) },
  choreographer: { label: 'Coreògraf',       perms: build({ edit: ['staging', 'shows'], view: ['members', 'repertoire', 'attendance', 'mics', 'rider'] }) },
  lighting:      { label: 'Il·luminador',    perms: build({ edit: ['lights'], view: ['shows', 'repertoire', 'rider', 'attendance'] }) },
  sound:         { label: 'Tècnic de so',    perms: build({ edit: ['mics'], view: ['shows', 'rider', 'staging', 'attendance'] }) },
  cap_de_corda:  { label: 'Cap de corda',    perms: build({ edit: ['attendance'], view: ['members', 'shows', 'staging', 'repertoire'] }) },
  member:        { label: 'Cantaire',        perms: build({ view: ['shows', 'repertoire', 'attendance', 'staging'] }) },
}

export const TEMPLATE_KEYS = Object.keys(ROLE_TEMPLATES)

// Default permission map for a base role (used before user_permissions load).
export function defaultPermissions(role) {
  if (role === 'admin') return { ...ALL_EDIT }
  if (role === 'director') return ROLE_TEMPLATES.director.perms
  return ROLE_TEMPLATES.member.perms
}

// Derive which template a member's effective permissions most resemble — used to
// pick the right landing dashboard. Returns a template key.
export function derivePersona(role, perms) {
  if (role === 'admin' || role === 'director') return role
  if (!perms) return 'member'
  if (perms.staging?.edit) return 'choreographer'
  if (perms.lights?.edit) return 'lighting'
  if (perms.mics?.edit) return 'sound'
  if (perms.attendance?.edit) return 'cap_de_corda'
  return 'member'
}
