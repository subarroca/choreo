// ────────────────────────────────────────────────────────────────────────
// UI design tokens — single source of truth for interaction primitives.
// See DESIGN.md for the rationale behind these values.
// ────────────────────────────────────────────────────────────────────────

// Icon sizes (lucide-react `size` prop). Use these instead of magic numbers.
//   sm → buttons & list rows · md → panel headers · lg → mobile nav toggles
export const ICON = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, hero: 40 }

// Standard paddings / gaps, as Tailwind class fragments.
export const ROW_PAD = 'px-3 py-2.5'      // list rows, nav items
export const FORM_GAP = 'space-y-3'       // vertical form field stacks

// Canonical input/label classes live in components/ui/Input.jsx (inputCls,
// labelCls); import them from there to keep a single definition.

// ── Accent logic ────────────────────────────────────────────────────────
// Semantic meaning of accent colours across the whole app:
//   cyan   → selection / primary action / active nav
//   amber  → special state (soloist, permission simulation, warning)
//   red    → destructive / error
//   voice  → member identity only (VOICE_COLORS in lib/constants.js) — never UI accent
export const ACCENT = {
  active: 'bg-cyan-700/40 text-cyan-300',           // selected / active item (dark-first)
  // activeNav — active nav/tab with a correct light-mode variant. Use this for
  // any menu/tab/segmented control so light and dark both read as "selected".
  activeNav: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-700/40 dark:text-cyan-300',
  activeSoft: 'bg-cyan-600/15 text-cyan-600 dark:text-cyan-300',
  special: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  danger: 'text-red-600 dark:text-red-400',
}
