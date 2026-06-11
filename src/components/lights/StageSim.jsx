import { useState } from 'react'
import { Map, Eye } from 'lucide-react'
import MiniStage from './MiniStage'
import AudienceView from './AudienceView'

// Simulació amb dues vistes commutables: planta (zenital, l'actual)
// i espectador (frontal, des del centre de platea). La tria es recorda.
export default function StageSim(props) {
  const [mode, setMode] = useState(() => localStorage.getItem('stageSimMode') || 'plan')

  // stopPropagation: dins el reproductor, tocar l'escenari avança el pas —
  // canviar de vista no ha de disparar el GO.
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
    <div className="relative">
      <div className="absolute top-1.5 right-1.5 z-10 flex rounded-lg border border-gray-700 overflow-hidden bg-gray-950/80 backdrop-blur-sm">
        <button onClick={e => set(e, 'plan')} className={btnCls(mode === 'plan')} title="Vista planta (zenital)">
          <Map size={13} /> Planta
        </button>
        <button onClick={e => set(e, 'audience')} className={btnCls(mode === 'audience') + ' border-l border-gray-700'} title="Vista espectador (frontal)">
          <Eye size={13} /> Espectador
        </button>
      </div>
      {mode === 'audience' ? <AudienceView {...props} /> : <MiniStage {...props} />}
    </div>
  )
}
