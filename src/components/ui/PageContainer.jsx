/**
 * Standard route-level page wrapper inside the AppShell.
 * Fixed height with an always-visible header (`shrink-0`) and an internally
 * scrolling body — never scrolls the document body.
 *
 * Usage:
 *   <PageContainer header={<PageHeader title="…" actions={…} />}>
 *     …scrollable content…
 *   </PageContainer>
 *
 * Pass `bare` to drop the default body padding (e.g. full-bleed canvases).
 */
export default function PageContainer({ header, children, bare = false, bodyClassName = '' }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {header && <div className="shrink-0">{header}</div>}
      <div className={`flex-1 min-h-0 overflow-y-auto ${bare ? '' : 'p-4 md:p-6 pb-16 md:pb-6'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  )
}
