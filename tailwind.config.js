/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds (bg-page, bg-pane, bg-fill, bg-raised)
        page:  'rgb(var(--c-page)  / <alpha-value>)',
        pane:  'rgb(var(--c-pane)  / <alpha-value>)',
        fill:  'rgb(var(--c-fill)  / <alpha-value>)',
        raised:'rgb(var(--c-raised)/ <alpha-value>)',
        // Borders (border-rim = subtle, border-line = default, border-wire = strong)
        rim:   'rgb(var(--c-rim)   / <alpha-value>)',
        line:  'rgb(var(--c-line)  / <alpha-value>)',
        wire:  'rgb(var(--c-wire)  / <alpha-value>)',
        // Text (text-body, text-soft, text-muted, text-faint, text-ghost)
        body:  'rgb(var(--c-body)  / <alpha-value>)',
        soft:  'rgb(var(--c-soft)  / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        ghost: 'rgb(var(--c-ghost) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
