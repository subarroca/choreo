# UI & UX Design Rules — Choir Positions

## Navigation
- Fixed menu order: **Repertori → Espectacles → Persones** (and Admin if applicable).
- The logo always links to `/` (shows list).

## Section structure (list pages)
All list pages must follow exactly this pattern:

```
[ Section title (h1 font-bold text-2xl) ]     [ "New X" button ]
[ Search bar (if applicable) ]
[ Filter chips (if applicable) ]
─────────────────────────────────────────
[ List of items ]
```

| Element | Rule |
|---|---|
| Title | `text-2xl font-bold text-white` — always visible, never hidden |
| "New" button | Right-aligned next to title, `bg-cyan-600 hover:bg-cyan-300`, `Plus` icon + short text |
| Search bar | Full container width, `Search` icon on the left, `border-gray-700 focus:border-cyan-300` |
| Container width | `max-w-2xl` for simple lists (`narrow`), `max-w-5xl` for complex views |
| Empty state | Entity icon (40px, `opacity-30`) + two explanatory text lines, centered |
| Loading state | `"Carregant..."` text in `text-gray-500` |

## Detail editing (sidesheet / modal)
- **Never** expand an edit form inline inside the list.
- Editing or viewing an item opens a **sidesheet** (right-side slide-over panel).
- Sidesheet spec: dark backdrop, panel fixed to the right, `w-full max-w-md`, `translate-x` transition.
- For very simple items (2–3 fields), a centered **modal** is acceptable instead.
- New item creation can use the sidesheet or an inline form at the top of the list (sidesheet preferred for consistency).
- **Reference implementation:** `PersonProfileOverlay` in `src/components/PersonProfileOverlay.jsx`.

## Buttons
| Type | Classes |
|---|---|
| Primary action | `bg-cyan-600 hover:bg-cyan-300 text-white rounded-lg px-4 py-2 text-sm` |
| Destructive action | `text-gray-600 hover:text-red-500` (icon-only) or `bg-red-700 hover:bg-red-600` if confirmation needed |
| Cancel | `text-gray-400 hover:text-white` no background |
| Icon-only action | `w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors` |
| Minimum touch target | **40×40 px** minimum for all interactive elements. Use `w-10 h-10`. Never use `py-1` or `p-1` on clickable elements in the main UI. |

## Touch / mobile sizing (tablet-first)
- **Minimum touch target: 40×40 px** for every interactive element (buttons, links, chips, selects).
- Toolbar buttons: `h-10` (40px) minimum. Use `w-10 h-10` for icon-only buttons.
- Body text in lists: `text-sm` (14px) minimum — never `text-xs` for primary content.
- Secondary metadata: `text-xs` acceptable.
- Form inputs: `py-2.5` minimum (not `py-1` in main forms).
- Icons inside primary buttons: `size={18}` minimum.
- Icons inside secondary list buttons: `size={14}` minimum.
- Avoid `hidden md:flex` for critical functionality — must be accessible on mobile.

## Brand color
- Primary color: **cyan** (`cyan-600` / `#0891b2`).
- Rationale: voice colors already use blue (soprano), fuchsia (alto), green (tenor), red (bass), amber (director). Cyan does not conflict with any of them.
- All primary action buttons, input focus rings, and active indicators must use cyan.
- **Do not** change voice colors defined in `src/lib/constants.js`.

## Voice filter chips
- Voice filter chips must **not** have a solid color background — improves contrast on dark backgrounds.
- Active style: `border-[color] text-[color]` without `bg-[color]/20`.
- Inactive style: `border-gray-700 text-gray-500 hover:text-white`.

## Member list cards
- Member cards must **not** have a left color bar or a gray outer border.
- Voice color is already communicated via the circular avatar and voice text label.

## Microphone table
- Mics are labeled with plain numbers: **1, 2, 3...** (not M1, M2...).
- Table layout: moments as rows, mics as columns.

## Shows — quick access
- If the user has exactly **one** show, `/` redirects directly to that show without the list step.
- With multiple shows, the list displays them with their poster thumbnail and a map-link icon next to the venue.

## Editor toolbar
- Two visually distinct halves separated by a vertical divider (`border-l border-gray-700`):
  - **Left:** prev/next song+moment navigation + show/song breadcrumb + moment selector.
  - **Right:** tools (movement arrows, orientation, focus, trajectory, arrange).
- Left half has natural (shrink-wrap) width — it must not expand to fill the bar.
- Movement arrows appear only when `selectedIds.size > 0`.
- "Alternative selection" mode button (MousePointer2) is hidden — Shift+click is the only selection method.
- Compact (pinya) buttons are hidden.
- "Focus" button (Crosshair icon) replaces the old "Jo soc…" dropdown. Opens a popover picker.
- Canvas selection rectangle and selected-token ring use **cyan** (`#06b6d4` / `#22d3ee`), not blue.
