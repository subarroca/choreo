// ────────────────────────────────────────────────────────────────────────
// Permission model — single source of truth for sections and role templates.
//
// Hybrid model: `profiles.role` (admin/director/member) sets the base, and
// `user_permissions` rows refine a member's access per section. Role TEMPLATES
// below are convenience presets the Admin UI applies to fill the granular
// toggles; once applied they remain editable per user.
// ────────────────────────────────────────────────────────────────────────

import { t } from '../locales/ca'

// Every gated area of the app. `view` controls visibility (nav, pages, tabs);
// `edit` controls mutation (forms, drag-drop, create/delete).
export const SECTIONS = [
  { key: 'shows',      label: t.sections.shows.label,      desc: t.sections.shows.desc },
  { key: 'members',    label: t.sections.members.label,    desc: t.sections.members.desc },
  { key: 'repertoire', label: t.sections.repertoire.label, desc: t.sections.repertoire.desc },
  { key: 'staging',    label: t.sections.staging.label,    desc: t.sections.staging.desc },
  { key: 'lights',     label: t.sections.lights.label,     desc: t.sections.lights.desc },
  { key: 'mics',       label: t.sections.mics.label,       desc: t.sections.mics.desc },
  { key: 'attendance', label: t.sections.attendance.label, desc: t.sections.attendance.desc },
  { key: 'rider',      label: t.sections.rider.label,      desc: t.sections.rider.desc },
  { key: 'users',      label: t.sections.users.label,      desc: t.sections.users.desc },
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
  admin:         { label: t.roles.admin,        perms: { ...ALL_EDIT } },
  director:      { label: t.roles.director,     perms: build({ edit: SECTION_KEYS.filter(k => k !== 'users') }) },
  choreographer: { label: t.roles.choreographer, perms: build({ edit: ['staging', 'shows'], view: ['members', 'repertoire', 'attendance', 'mics', 'rider'] }) },
  lighting:      { label: t.roles.lighting,     perms: build({ edit: ['lights'], view: ['shows', 'repertoire', 'rider', 'attendance'] }) },
  sound:         { label: t.roles.sound,        perms: build({ edit: ['mics'], view: ['shows', 'rider', 'staging', 'attendance'] }) },
  cap_de_corda:  { label: t.roles.capDeCorda,   perms: build({ edit: ['attendance'], view: ['members', 'shows', 'staging', 'repertoire'] }) },
  member:        { label: t.roles.member,       perms: build({ view: ['shows', 'repertoire', 'attendance', 'staging'] }) },
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
