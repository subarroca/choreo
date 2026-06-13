// Voice colours: 600 = primary voice, 400 = secondary
// red / fuchsia / green / blue — dark bg → white fg, light bg → dark fg
export const VOICE_COLORS = {
  soprano1: { bg: '#2563eb', fg: '#fff' },        // blue-600
  soprano2: { bg: '#60a5fa', fg: '#1e3a8a' },     // blue-400
  alto1:    { bg: '#c026d3', fg: '#fff' },         // fuchsia-600
  alto2:    { bg: '#e879f9', fg: '#701a75' },      // fuchsia-400
  tenor1:   { bg: '#16a34a', fg: '#fff' },         // green-600
  tenor2:   { bg: '#4ade80', fg: '#14532d' },      // green-400
  baritone: { bg: '#dc2626', fg: '#fff' },         // red-600
  bass:     { bg: '#f87171', fg: '#7f1d1d' },      // red-400
  director: { bg: '#fbbf24', fg: '#78350f' },      // amber-400
  musician: { bg: '#9ca3af', fg: '#111827' },      // gray-400
  extra:    { bg: '#d1d5db', fg: '#111827' },      // gray-300
}

export const VOICE_LABELS = {
  soprano1: 'Soprano 1', soprano2: 'Soprano 2',
  alto1:    'Alto 1',    alto2:    'Alto 2',
  tenor1:   'Tenor 1',   tenor2:   'Tenor 2',
  baritone: 'Baríton',   bass:     'Baix',
  director: 'Admin',
  musician: 'Músic',
  extra:    'Extra',
}

export const VOICE_SHORT = {
  soprano1: 'S1', soprano2: 'S2',
  alto1: 'A1', alto2: 'A2',
  tenor1: 'T1', tenor2: 'T2',
  baritone: 'B1', bass: 'B2',
  director: 'A', musician: 'M', extra: 'X',
}

export const ROLE_LABELS = {
  choir:    'Cor',
  director: 'Admin',
  musician: 'Músic',
  extra:    'Extra',
}
