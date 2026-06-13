import AppShell from './AppShell.jsx'

/**
 * Compatibility wrapper around the fixed-height AppShell + left rail.
 * Keeps the original API (children / fullWidth / narrow) so pages can migrate
 * to PageContainer/PageHeader incrementally.
 *
 *   fullWidth → children own the full content column (work views, canvases)
 *   narrow    → centered, max-w-2xl, internally scrolling
 *   default   → centered, max-w-5xl, internally scrolling
 */
export default function Layout({ children, fullWidth = false, narrow = false }) {
  if (fullWidth) {
    return <AppShell>{children}</AppShell>
  }
  return (
    <AppShell>
      <div className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
        <div className={`p-4 md:p-6 mx-auto w-full ${narrow ? 'max-w-2xl' : 'max-w-5xl'}`}>
          {children}
        </div>
      </div>
    </AppShell>
  )
}
