import { Plus } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SidebarSection from './SidebarSection'
import SortableRow from './SortableRow'
import MembersList from './MembersList'

export default function EditorSidebar({
  sidebarOpen, onCloseSidebar,
  mode, MODES, onChangeMode,
  isPanelOpen, togglePanel,
  rowItems, rowSensors, onRowDragEnd, onEditRow, onEditElevation, onRemoveRow, onAddRow,
  COLS, onUpdateCols,
  trajectoryMode, voiceGroups, placements, momentSoloists, showMics,
  collapsedVoices, setCollapsedVoices, pendingMemberId, setPendingMemberId,
  unplacedCount, onContextMenu, onSoloistMic,
}) {
  return (
    <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-56 lg:w-44 shrink-0 border-r border-rim bg-page flex flex-col overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-2.5 space-y-3">

        {/* Mode selector — compact icon strip */}
        <div className="flex gap-1 rounded-lg border border-line bg-fill p-1">
          {MODES.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => onChangeMode(id)} title={label}
              className={`flex-1 flex items-center justify-center h-8 rounded transition-colors ${mode === id ? 'bg-cyan-600 text-white shadow-sm' : 'text-faint hover:text-body hover:bg-page'}`}>
              <Icon size={16} />
            </button>
          ))}
        </div>

        <SidebarSection title="Graella" open={isPanelOpen('grid', false)} onToggle={() => togglePanel('grid', false)}>
          <div className="space-y-0.5">
            <DndContext sensors={rowSensors} collisionDetection={closestCenter} onDragEnd={onRowDragEnd}>
              <SortableContext items={rowItems.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {rowItems.map(({ id, label, elevation }, i) => (
                  <SortableRow key={id} id={id} label={label} elevation={elevation}
                    onEdit={val => onEditRow(i, val)}
                    onEditElevation={val => onEditElevation(i, val)}
                    onRemove={() => onRemoveRow(i)} />
                ))}
              </SortableContext>
            </DndContext>
            <button onClick={onAddRow} className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-400 transition-colors mt-0.5 py-2 px-1 -mx-1 rounded hover:bg-fill">
              <Plus size={12} /> Fila
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-faint">Col.</span>
            <button onClick={() => onUpdateCols(COLS - 1)} className="w-9 h-9 text-muted hover:text-body bg-fill rounded-lg text-base">−</button>
            <span className="text-xs text-soft w-5 text-center tabular-nums">{COLS}</span>
            <button onClick={() => onUpdateCols(COLS + 1)} className="w-9 h-9 text-muted hover:text-body bg-fill rounded-lg text-base">+</button>
          </div>
        </SidebarSection>

        {!trajectoryMode && (
          <SidebarSection title="Persones" open={isPanelOpen('members')} onToggle={() => togglePanel('members')}
            badge={unplacedCount > 0 ? ` (${unplacedCount})` : ''}>
            <MembersList
              voiceGroups={voiceGroups} placements={placements}
              momentSoloists={momentSoloists} showMics={showMics}
              collapsedVoices={collapsedVoices} setCollapsedVoices={setCollapsedVoices}
              pendingMemberId={pendingMemberId} setPendingMemberId={setPendingMemberId}
              onContextMenu={onContextMenu} onSoloistMic={onSoloistMic} />
          </SidebarSection>
        )}

      </div>
    </div>
  )
}
