// Arrangement pattern picker — shared by the desktop dropdown and the
// touch bottom sheet in EditorToolbar.
export default function ArrangePanel({
  arrangeAxis, onSetArrangeAxis, arrangeReplaceAll, onSetArrangeReplaceAll, onPick,
  VOICE_GROUPS, ARRANGEMENT_PATTERNS, VOICE_COLORS,
}) {
  return (
    <>
      <div className="flex gap-1 mb-3">
        {['cols','rows'].map(ax => (
          <button key={ax} onClick={() => onSetArrangeAxis(ax)}
            className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${arrangeAxis === ax ? 'border-violet-600 text-violet-300 bg-violet-900/30' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
            {ax === 'cols' ? '← Columnes (E→D)' : '↑ Files (D→F)'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {ARRANGEMENT_PATTERNS.map(pat => {
          const letters = pat.split('')
          const groupSizes = letters.map(l => (VOICE_GROUPS[l] ?? []).length)
          const total = groupSizes.reduce((a, b) => a + b, 0)
          return (
            <button key={pat} onClick={() => onPick(pat)}
              className="flex flex-col items-center gap-1 p-1.5 rounded-lg border border-gray-700 hover:border-violet-600 hover:bg-violet-900/20 transition-colors min-h-[48px]">
              <div className="flex w-full h-5 rounded overflow-hidden gap-px">
                {letters.map((l, i) => {
                  const voices = VOICE_GROUPS[l] ?? []
                  const pct = total > 0 ? groupSizes[i] / total * 100 : 25
                  const sampleVoice = voices[0]
                  const c = sampleVoice ? (VOICE_COLORS[sampleVoice] ?? VOICE_COLORS.extra) : VOICE_COLORS.extra
                  return <div key={i} style={{ width: pct + '%', background: c.bg }} />
                })}
              </div>
              <span className="text-xs text-gray-400 font-mono">{pat}</span>
            </button>
          )
        })}
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none py-1">
        <input type="checkbox" checked={arrangeReplaceAll} onChange={e => onSetArrangeReplaceAll(e.target.checked)}
          className="accent-violet-500 w-4 h-4" />
        Substituir tot (esborra posicions actuals)
      </label>
    </>
  )
}
