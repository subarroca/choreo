// Safe JSON parsing helpers. Replace scattered `try { JSON.parse(...) } catch {}`
// blocks across the app with a single, predictable utility.

// Parse a JSON string into an array. Returns `fallback` (default []) on any
// failure or if the parsed value is not an array. Already-array inputs pass
// through unchanged (handy for columns that may be JSON text or real arrays).
export function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

// Parse a JSON string into an object/value. Returns `fallback` on failure.
export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
