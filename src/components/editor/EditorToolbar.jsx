import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Waypoints, Pencil,
  ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Plus, Target, LayoutTemplate, X,
  Menu, Crosshair, MoreHorizontal, Undo2, Redo2,
} from 'lucide-react'
import ArrangePanel from './ArrangePanel'

function OverflowTile({ Icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border min-h-[76px] text-xs transition-colors ${active ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}>
      <Icon size={24} />
      <span>{label}</span>
    </button>
  )
}

export default function EditorToolbar({
  moments, momentId, show, song, allShowSongs, showId, songId,
  selectedIds, trajectoryMode, trajectoryMemberId, members, choirMembers, highlightId, rotated,
  directorManualX, editingMoment, addingMoment, showArrange, showFocusPicker, arrangeAxis,
  arrangeReplaceAll, mode, sidebarOpen,
  onNavigateToSong, onSetHighlightId, onEnterTrajectoryMode, onShiftSelected, onSetRotated,
  onSetSidebarOpen, onSetEditingMoment, onOpenAddMoment, onSetTrajectoryMode, onSetFocusPicker,
  onSetShowArrange, onSetArrangeAxis, onSetArrangeReplaceAll, onAutoPlace, onClearSelection,
  onResetDirector, canUndo, canRedo, onUndo, onRedo, navigate,
  VOICE_GROUPS, ARRANGEMENT_PATTERNS, VOICE_COLORS,
}) {
  const [showOverflow, setShowOverflow] = useState(false)
  const [overflowArrange, setOverflowArrange] = useState(false)
  const closeOverflow = () => { setShowOverflow(false); setOverflowArrange(false) }

  const mIdx = moments.findIndex(m => m.id === momentId)
  const curMoment = moments[mIdx]
  const prevMoment = moments[mIdx - 1]
  const nextMoment = moments[mIdx + 1]
  const sIdx = allShowSongs.findIndex(s => s.id === songId)
  const prevSong = allShowSongs[sIdx - 1]
  const nextSong = allShowSongs[sIdx + 1]
  const highlightedMember = highlightId ? members.find(m => m.id === highlightId) : null

  return (
    <div className="flex items-center justify-between gap-0 px-2 py-1 bg-gray-900 border-b border-gray-800 shrink-0 min-h-[44px]">
      {/* Mobile sidebar toggle */}
      <button onClick={() => onSetSidebarOpen(v => !v)}
        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0 mr-1">
        <Menu size={18} />
      </button>

      {/* ── Left: nav block (natural width, not expanding) ── */}
      <div className="flex items-center gap-0.5 shrink-0 min-w-0 max-w-[min(50%,420px)]">
        {/* Prev song */}
        <button onClick={() => prevSong && onNavigateToSong(prevSong.id)} disabled={!prevSong}
          className="w-8 h-10 flex items-center justify-center rounded text-gray-600 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
          title={prevSong ? `Cançó anterior: ${prevSong.title}` : ''}>
          <ChevronLeft size={12} /><ChevronLeft size={12} className="-ml-2" />
        </button>
        {/* Prev moment */}
        <button onClick={() => prevMoment && navigate(`/show/${showId}/song/${songId}/moment/${prevMoment.id}`)} disabled={!prevMoment}
          className="w-8 h-10 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
          title={prevMoment?.title}>
          <ChevronLeft size={15} />
        </button>

        {/* Centre: show/song + moment selector */}
        <div className="min-w-0 px-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 leading-none mb-0.5 truncate">
            <Link to="/" className="hover:text-gray-300 shrink-0 truncate max-w-[80px]">{show?.name ?? '…'}</Link>
            <span className="shrink-0">/</span>
            <Link to={`/show/${showId}`} className="hover:text-gray-300 truncate">{song?.title ?? '…'}</Link>
          </div>
          <select value={momentId}
            onChange={e => navigate(`/show/${showId}/song/${songId}/moment/${e.target.value}`)}
            className="bg-transparent border-0 text-sm font-medium text-white focus:outline-none cursor-pointer truncate leading-tight py-0 max-w-[220px]">
            {moments.map((m, i) => (
              <option key={m.id} value={m.id} className="bg-gray-800">
                {i + 1}/{moments.length} · {m.title}{m.subtitle ? ` · ${m.subtitle}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Next moment */}
        <button onClick={() => nextMoment && navigate(`/show/${showId}/song/${songId}/moment/${nextMoment.id}`)} disabled={!nextMoment}
          className="w-8 h-10 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
          title={nextMoment?.title}>
          <ChevronRight size={15} />
        </button>
        {/* Next song */}
        <button onClick={() => nextSong && onNavigateToSong(nextSong.id)} disabled={!nextSong}
          className="w-8 h-10 flex items-center justify-center rounded text-gray-600 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
          title={nextSong ? `Cançó següent: ${nextSong.title}` : ''}>
          <ChevronRight size={12} /><ChevronRight size={12} className="-ml-2" />
        </button>

        {/* Edit + Add moment */}
        <button onClick={() => { if (curMoment) { onSetEditingMoment(curMoment) } }}
          className={`w-9 h-10 flex items-center justify-center rounded-lg transition-colors shrink-0 ${editingMoment ? 'text-cyan-400 bg-cyan-900/30' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
          title="Editar moment">
          <Pencil size={15} />
        </button>
        <button onClick={onOpenAddMoment}
          className="w-9 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          title="Afegir moment">
          <Plus size={15} />
        </button>
      </div>

      {/* ── Separator ── */}
      <div className="mx-3 self-stretch border-l border-gray-700" />

      {/* ── Right: tools ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo/Redo */}
        <button onClick={onUndo} disabled={!canUndo} title="Desfer (Ctrl+Z)"
          className="w-9 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <Undo2 size={16} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Refer (Ctrl+Y)"
          className="w-9 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <Redo2 size={16} />
        </button>

        {/* Movement arrows — only when something is selected */}
        {!trajectoryMode && selectedIds.size > 0 && (
          <div className="flex rounded-lg border border-gray-700 overflow-hidden h-10">
            {[[ArrowUp,-1,0],[ArrowDown,1,0],[ArrowLeft,0,-1],[ArrowRight,0,1]].map(([Icon,dr,dc]) => (
              <button key={`${dr}${dc}`} onClick={() => onShiftSelected(dr, dc)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-r border-gray-700 last:border-0">
                <Icon size={16} />
              </button>
            ))}
          </div>
        )}

        {/* Selected count badge */}
        {!trajectoryMode && selectedIds.size > 0 && (
          <span className="flex items-center gap-1 text-xs text-cyan-400 border border-cyan-800 px-2 py-1 rounded-full">
            {selectedIds.size}
            <button onClick={onClearSelection} className="flex items-center"><X size={10} /></button>
          </span>
        )}

        {/* Orientation (rotation) — collapses into overflow below lg */}
        <button onClick={() => { const n = !rotated; onSetRotated(n); localStorage.setItem('rotated', n) }}
          className={`hidden lg:flex items-center gap-1.5 px-3 h-10 rounded-lg text-xs border transition-colors ${rotated ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}
          title="Orientation">
          <RotateCcw size={15} />{rotated ? '180°' : '0°'}
        </button>

        {/* Focus (highlight self) */}
        {!trajectoryMode && (
          <div className="relative">
            <button onClick={() => onSetFocusPicker(v => !v)}
              className={`flex items-center gap-1.5 px-3 h-10 rounded-lg text-xs border transition-colors ${highlightId ? 'border-cyan-600 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              <Crosshair size={15} />
              <span className="hidden md:inline max-w-[80px] truncate">{highlightedMember ? highlightedMember.name.split(' ')[0] : 'Focus'}</span>
              {highlightId && (
                <button onClick={e => { e.stopPropagation(); onSetHighlightId(''); localStorage.removeItem('highlightMemberId'); onSetFocusPicker(false) }}
                  className="ml-0.5 hover:text-white flex items-center"><X size={10} /></button>
              )}
            </button>
            {showFocusPicker && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 w-48 max-h-64 overflow-y-auto">
                <button onClick={() => { onSetHighlightId(''); localStorage.removeItem('highlightMemberId'); onSetFocusPicker(false) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                  — None —
                </button>
                {members.filter(m => m.role === 'director').map(m => (
                  <button key={m.id} onClick={() => { onSetHighlightId(m.id); localStorage.setItem('highlightMemberId', m.id); onSetFocusPicker(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${highlightId === m.id ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-300 hover:bg-gray-800'}`}>
                    {m.name} (dir.)
                  </button>
                ))}
                {choirMembers.map(m => (
                  <button key={m.id} onClick={() => { onSetHighlightId(m.id); localStorage.setItem('highlightMemberId', m.id); onSetFocusPicker(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${highlightId === m.id ? 'text-cyan-400 bg-cyan-900/20' : 'text-gray-300 hover:bg-gray-800'}`}>
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trajectory */}
        <button onClick={() => trajectoryMode ? onEnterTrajectoryMode('') : onSetTrajectoryMode(true)}
          className={`flex items-center gap-1.5 px-3 h-10 rounded-lg text-xs border transition-colors ${trajectoryMode ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
          <Waypoints size={15} /><span className="hidden md:inline">Traject.</span>
        </button>
        {trajectoryMode && (
          <select value={trajectoryMemberId} onChange={e => onEnterTrajectoryMode(e.target.value)}
            className="bg-gray-800 border border-violet-700 rounded-lg text-xs text-violet-300 px-2 h-10 focus:outline-none max-w-[120px]">
            <option value="">Tria persona…</option>
            {choirMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}

        {/* Arrange — collapses into overflow below lg */}
        {!trajectoryMode && (
          <div className="relative hidden lg:block">
            <button onClick={() => onSetShowArrange(v => !v)}
              className={`flex items-center gap-1.5 px-3 h-10 rounded-lg text-xs border transition-colors ${showArrange ? 'border-violet-600 text-violet-400 bg-violet-900/20' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
              <LayoutTemplate size={15} /> Disposar…
            </button>
            {showArrange && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 w-72">
                <ArrangePanel
                  arrangeAxis={arrangeAxis} onSetArrangeAxis={onSetArrangeAxis}
                  arrangeReplaceAll={arrangeReplaceAll} onSetArrangeReplaceAll={onSetArrangeReplaceAll}
                  onPick={pat => { onAutoPlace(pat, arrangeAxis, arrangeReplaceAll); onSetShowArrange(false) }}
                  VOICE_GROUPS={VOICE_GROUPS} ARRANGEMENT_PATTERNS={ARRANGEMENT_PATTERNS} VOICE_COLORS={VOICE_COLORS} />
              </div>
            )}
          </div>
        )}

        {/* Director auto-reset — collapses into overflow below lg */}
        {directorManualX != null && !trajectoryMode && (
          <button onClick={onResetDirector}
            className="hidden lg:flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 border border-yellow-800 px-3 h-9 rounded-lg transition-colors">
            <Target size={15} /> Auto
          </button>
        )}

        {/* Overflow "⋯" — touch/small screens */}
        <button onClick={() => setShowOverflow(true)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Overflow bottom sheet */}
      {showOverflow && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={closeOverflow} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl pb-safe lg:hidden">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>
            {overflowArrange ? (
              <div className="p-4">
                <p className="text-sm text-white font-semibold mb-3 flex items-center gap-2"><LayoutTemplate size={16} /> Disposar veus</p>
                <ArrangePanel
                  arrangeAxis={arrangeAxis} onSetArrangeAxis={onSetArrangeAxis}
                  arrangeReplaceAll={arrangeReplaceAll} onSetArrangeReplaceAll={onSetArrangeReplaceAll}
                  onPick={pat => { onAutoPlace(pat, arrangeAxis, arrangeReplaceAll); closeOverflow() }}
                  VOICE_GROUPS={VOICE_GROUPS} ARRANGEMENT_PATTERNS={ARRANGEMENT_PATTERNS} VOICE_COLORS={VOICE_COLORS} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-4">
                <OverflowTile Icon={RotateCcw} label={rotated ? '180°' : '0°'} active={rotated}
                  onClick={() => { const n = !rotated; onSetRotated(n); localStorage.setItem('rotated', n) }} />
                {!trajectoryMode && (
                  <OverflowTile Icon={LayoutTemplate} label="Disposar" onClick={() => setOverflowArrange(true)} />
                )}
                {directorManualX != null && !trajectoryMode && (
                  <OverflowTile Icon={Target} label="Director auto" onClick={() => { onResetDirector(); closeOverflow() }} />
                )}
              </div>
            )}
            <div className="h-4" />
          </div>
        </>
      )}
    </div>
  )
}
