#!/usr/bin/env node
// check-icons.js — validates the icon registry rules:
//
//   1. No file in src/ imports directly from 'lucide-react'
//      (all icons must flow through src/lib/icons.js)
//
//   2. No lucide icon component (_l.X) is assigned to more than one key
//      in the Icons object (no silent duplicates)
//
//   3. All keys in Icons must be camelCase ASCII identifiers
//      (no Catalan words, no strange names, no snake_case)

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC  = join(ROOT, 'src')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.[jt]sx?$/.test(entry)) out.push(full)
  }
  return out
}

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/

// ─── Rule 1: no direct lucide-react imports in src/ ──────────────────────────

let violations = []

const iconsPath = join(SRC, 'lib', 'icons.js')

for (const file of walk(SRC)) {
  if (file === iconsPath) continue            // icons.js itself is allowed
  const src = readFileSync(file, 'utf8')
  if (/from\s+['"]lucide-react['"]/.test(src)) {
    violations.push(`Direct lucide-react import: ${relative(ROOT, file)}`)
  }
}

// ─── Rule 2 + 3: parse Icons object from icons.js ────────────────────────────

const iconsSrc = readFileSync(iconsPath, 'utf8')

// Match lines like:  keyName:  _l.SomeIcon,
const ENTRY = /^\s{2}([a-zA-Z_$][a-zA-Z0-9_$]*):\s+(_l\.[A-Z][a-zA-Z0-9]*),/gm
const entries = []
let m
while ((m = ENTRY.exec(iconsSrc)) !== null) {
  entries.push({ key: m[1], lucide: m[2] })
}

// Rule 2 — duplicate lucide values
const seen = {}
for (const { key, lucide } of entries) {
  if (!seen[lucide]) seen[lucide] = []
  seen[lucide].push(key)
}
for (const [lucide, keys] of Object.entries(seen)) {
  if (keys.length > 1) {
    violations.push(
      `Duplicate icon value ${lucide} assigned to multiple keys: ${keys.join(', ')}`
    )
  }
}

// Rule 3 — key naming: camelCase ASCII only
for (const { key } of entries) {
  if (!CAMEL_CASE.test(key)) {
    violations.push(`Non-camelCase key in Icons: '${key}'`)
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('check-icons: all OK')
  process.exit(0)
} else {
  console.error(`check-icons: ${violations.length} violation(s) found:\n`)
  for (const v of violations) console.error(`  ✗ ${v}`)
  process.exit(1)
}
