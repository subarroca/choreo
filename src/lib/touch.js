// Touch/pointer detection helpers.
// Tablets in landscape report widths ≥768px, so width-based checks alone
// misclassify them as desktop — always combine with pointer capability.

export function isCoarsePointer() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches
}

// True when the UI should use touch-first affordances (bottom sheets,
// radial menus, large targets): coarse pointer or narrow viewport.
export function isTouchUI() {
  return isCoarsePointer() || window.innerWidth < 768
}
