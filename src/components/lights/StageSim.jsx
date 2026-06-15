import { lazy, Suspense, useState } from 'react'
import { Map, Sparkles } from '../../lib/icons'
import MiniStage from './MiniStage'

const PixiStageView = lazy(() => import('./PixiStageView'))

export default function StageSim(props) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('stageSimMode')
    return saved === 'audience' ? 'plan' : (saved || 'plan')
  })

  function set(e, m) {
    e.stopPropagation()
    setMode(m)
    localStorage.setItem('stageSimMode', m)
  }

  const btnCls = (active) =>
    `flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
      active ? 'bg-cyan-700/40 text-cyan-300' : 'text-faint hover:text-white'
    }`

  return (
    <div>
      <div className="flex justify-end mb-1">
        <div className="flex rounded-lg border border-line overflow-hidden bg-page/80 backdrop-blur-sm">
          <button onClick={e => set(e, 'plan')} className={btnCls(mode === 'plan')} title="Vista planta (zenital)">
            <Map size={13} /> Planta
          </button>
          <button onClick={e => set(e, 'pixi')} className={btnCls(mode === 'pixi') + ' border-l border-line'} title="Vista 3D (WebGL)">
            <Sparkles size={13} /> 3D
          </button>
        </div>
      </div>
      {mode === 'pixi' ? (
        <Suspense fallback={<div className="w-full aspect-[720/400] bg-page rounded-lg animate-pulse" />}>
          <PixiStageView {...props} />
        </Suspense>
      ) : (
        <MiniStage {...props} />
      )}
    </div>
  )
}
