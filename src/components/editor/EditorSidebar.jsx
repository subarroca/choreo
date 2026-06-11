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
    <div className={`absolute lg:relative inset-y-0 left-0 z-30 lg:z-auto w-56 lg:w-44 shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-2.5 space-y-3">

        <SidebarSection title="Mode" open={isPanelOpen('mode')} onToggle={() => togglePanel('mode')}>
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            {MODES.map(({ id, Icon, label }) => (
              <button key={id} onClick={() => onChangeMode(id)} title={label}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs transition-colors ${mode === id ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
                <Icon size={12} /><span className="text-xs leading-none">{label}</span>
              </button>
            ))}
          </div>
        </SidebarSection>

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
            <button onClick={onAddRow} className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors mt-0.5">
              <Plus size={9} /> Fila
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-gray-500">Col.</span>
            <button onClick={() => onUpdateCols(COLS - 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs">−</button>
            <span className="text-xs text-gray-300 w-5 text-center tabular-nums">{COLS}</span>
            <button onClick={() => onUpdateCols(COLS + 1)} className="w-5 h-5 text-gray-400 hover:text-white bg-gray-800 rounded text-xs">+</button>
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
