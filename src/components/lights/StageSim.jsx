import { useState, lazy, Suspense } from 'react'
import { Map, Eye, Sparkles } from 'lucide-react'
import MiniStage from './MiniStage'
import AudienceView from './AudienceView'

const PixiStageView = lazy(() => import('./PixiStageView'))

export default function StageSim(props) {
  const [mode, setMode] = useState(() => localStorage.getItem('stageSimMode') || 'plan')

  function set(e, m) {
    e.stopPropagation()
    setMode(m)
    localStorage.setItem('stageSimMode', m)
  }

  const btnCls = (active) =>
    `flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
      active ? 'bg-cyan-700/40 text-cyan-300' : 'text-gray-500 hover:text-white'
    }`

  return (
    <div>
      <div className="flex justify-end mb-1">
        <div className="flex rounded-lg border border-gray-700 overflow-hidden bg-gray-950/80 backdrop-blur-sm">
          <button onClick={e => set(e, 'plan')} className={btnCls(mode === 'plan')} title="Vista planta (zenital)">
            <Map size={13} /> Planta
          </button>
          <button onClick={e => set(e, 'audience')} className={btnCls(mode === 'audience') + ' border-l border-gray-700'} title="Vista espectador (frontal)">
            <Eye size={13} /> Espectador
          </button>
          <button onClick={e => set(e, 'pixi')} className={btnCls(mode === 'pixi') + ' border-l border-gray-700'} title="Vista 3D (WebGL)">
            <Sparkles size={13} /> 3D
          </button>
        </div>
      </div>
      {mode === 'pixi' ? (
        <Suspense fallback={<div className="w-full aspect-[720/400] bg-gray-950 rounded-lg animate-pulse" />}>
          <PixiStageView {...props} />
        </Suspense>
      ) : mode === 'audience' ? (
        <AudienceView {...props} />
      ) : (
        <MiniStage {...props} />
      )}
    </div>
  )
}
