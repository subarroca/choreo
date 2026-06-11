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
