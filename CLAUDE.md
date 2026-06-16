# Choreo — Project Instructions

## Tech Stack

React + Vite, JSX, Tailwind CSS, Supabase (backend/auth), dnd-kit (drag-and-drop).

## File Size Limit — Hard Rule

**No file may exceed 600 lines.** This applies to all `.jsx`, `.js`, and `.ts` files.

If a file is approaching 600 lines, stop and refactor before adding more code.

### What to do when a file grows too large

1. **Extract sub-components** — break large render blocks into focused components.
2. **Extract custom hooks** — move `useState`/`useEffect`/event logic into a dedicated hook.
3. **Extract utilities** — move pure helper functions and constants into a lib module.

### Where to put extracted code

| What you're extracting | Where it goes |
|---|---|
| UI component (JSX) | `src/components/` |
| Stateful logic / side effects | `src/hooks/` — name it `use<Feature>.js` |
| Pure helpers, constants, formatters | `src/lib/` |
| Full page views | `src/pages/` |

Keep each file focused on a single responsibility. Prefer many small files over one large file.

## Icon Registry — Hard Rule

All icons must come from `src/lib/icons.js`. **Never import directly from `lucide-react`** in any component or page.

```js
// Correct
import { Icons } from '../lib/icons'
<Icons.close size={16} />

// Also correct (migration alias)
import { X } from '../lib/icons'

// WRONG — do not do this
import { X } from 'lucide-react'
```

### Additional constraints

- **No duplicate values**: each `lucide-react` component may be assigned to at most one key in the `Icons` object. If the same shape is needed for two different concepts, choose a visually distinct icon for one of them.
- **camelCase English keys only**: concept names must be `camelCase`, ASCII, and semantically meaningful in English. No Catalan words, no lucide icon names as keys (e.g. `mapPin`, `clock` are borderline — prefer `venue`, `time` when renaming).
- **Validate with**: `node scripts/check-icons.js` — exits non-zero if any rule is violated.

## No Emojis in Code — Hard Rule

**Never use emoji characters in JSX, strings, or template literals in source code.** This includes status indicators (✓ ✗ ⚡ ~), decorative symbols (🎭 🕐 📍), and any Unicode emoji.

Use Lucide icons instead:
- Status: `<Check />`, `<X />`, `<AlertTriangle />`, `<Zap />`
- Decorative/semantic: find or add an appropriate key in `src/lib/icons.js`

If no suitable icon exists, add one to `Icons` in `src/lib/icons.js` first, then use it.

## Architecture

### Directory Structure

```
src/
├── pages/          # Route-level views (12 pages)
├── components/
│   ├── editor/     # Stage position editor (canvas, sidebar, toolbar, context menus)
│   ├── lights/     # Lighting design (3D view, cue editor, player, score view)
│   ├── setlist/    # Show setlist (songs, parts, cast, drag-drop)
│   └── ui/         # Shared primitives (Button, Input, ConfirmDialog)
├── hooks/          # Custom React hooks (auth, data, drag, queries)
├── lib/            # Pure utilities, constants, canvas rendering, Supabase client
├── locales/        # UI strings (ca.js) — single source of truth for all Catalan text
```

### Data Flow

Supabase (or localStorage in dev mode) → custom hooks → React components → Canvas/Pixi.js rendering.

- **Dev mode** (`VITE_DEV_MODE=true`): mock Supabase client backed by localStorage (`src/lib/devDb.js`)
- **Production**: real Supabase with PostgREST API
- **Optimistic updates**: local state mutates first, then debounced DB write
- **Auth**: Supabase auth with roles (admin/director/member) + per-section granular permissions

## Features & Routes

| Route | Page | Feature |
|-------|------|---------|
| `/` | Shows | CRUD concerts (name, date, venue, poster) |
| `/show/:id` | Setlist | Songs organized in parts, moments per song, cast management |
| `/show/:id/song/:sid/moment/:mid` | Editor | Grid-based member positioning (square/alternate/free/semicircle modes), drag-drop, auto-arrange templates |
| `/show/:id/lights` | Lights | Light cue design (front/back zones, colors, effects, followspots), lyric triggers, presets, karaoke playback, 3D visualization |
| `/show/:id/mics` | Mics | Microphone assignments per moment |
| `/show/:id/rider` | Rider | Printable technical rider (cover + cue sheets + mic grid) |
| `/show/:id/rehearsal` | Rehearsal | Position guide per member (neighbors, grid position, visual grid) |
| `/show/:id/poster` | Poster | Upload/manage show poster |
| `/members` | Members | Roster with voice part, height, birthdate, active status |
| `/songs` | Songs | Repertoire library (lyrics, composer, attachments) |
| `/admin` | Admin | Role-based permissions per user and section |
| `/login` | Login | Email/password + Google OAuth |

## Data Model (Supabase Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts | id, email, full_name, role (admin/director/member), voice, voice_sections |
| `members` | Choir singers | id, name, voice, height, birth_date, active, initials |
| `shows` | Concerts | id, name, date, venue, grid_rows, grid_cols, row_elevations, mics, mic_assignments |
| `parts` | Show sections | id, show_id, title, order_index |
| `songs` | Songs in setlist | id, show_id, part_id, title, repertoire_song_id, order_index |
| `moments` | Staging snapshots | id, song_id, title, subtitle, grid_mode, order_index |
| `positions` | Member placements | id, moment_id, member_id, grid_row, grid_col, free_x, free_y |
| `soloists` | Moment soloists | id, moment_id, member_id, mic_number |
| `repertoire_songs` | Song library | id, title, composer, type, lyrics, attachments |
| `show_exclusions` | Members out | show_id, member_id |
| `light_cues` | Lighting cues | id, song_id, cue_number, trigger_type, lyric_line, front/back_levels/colors, effects, followspots |
| `light_presets` | Cue templates | id, name, front/back_levels/colors |
| `user_permissions` | Access control | user_id, section, can_view, can_edit |

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Session, profile, role, permissions, sign out |
| `useEditorData` | Load show/song/moment data, position CRUD, debounced saves |
| `useEditorDrag` | Canvas pointer events, hit-testing, drag logic, pinch zoom, multi-touch |
| `useLightCues` | Light cues & presets CRUD, optimistic updates |
| `useSupabaseQuery` | Generic async fetch with loading/error/refetch |

## Key Patterns

- **Canvas interaction**: pointer events → `eventToCanvas()` normalize → `pixelToCell()` grid snap → state update
- **dnd-kit**: used in Setlist (song/moment reorder) and EditorSidebar (row reorder). Members use native HTML5 drag to canvas.
- **Voice colors**: defined in `src/lib/constants.js` — 8 voice parts + director/musician/extra, each with bg/fg hex
- **Grid modes**: square (regular grid), alternate (offset rows), free (x,y 0-1), semicircle
- **Auto-arrange**: templates in `src/lib/editorArrange.js` (SATB, ABTS, BSAT, STBA by cols or rows)
- **Lighting**: cues tied to songs via `song_id`, triggered by lyric line or action. 3 views: PixiStageView (3D), MiniStage (top-down SVG), AudienceView (front SVG)

## Dependencies

React 18, react-router-dom 7, @supabase/supabase-js, @dnd-kit/core + sortable, pixi.js 8, lucide-react, Tailwind 3, vite-plugin-pwa.

## Language

All UI text is in Catalan and must be centralized in `src/locales/ca.js` — import `{ t }` from there. Dates formatted as `ca-ES`. Variable names, code comments, route paths, and object keys are all in English.
