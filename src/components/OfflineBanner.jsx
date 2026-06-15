import { WifiOff } from '../lib/icons'
import { useOnline } from '../hooks/useOnline.js'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-medium shadow-lg">
      <WifiOff size={14} />
      Sense connexió — els canvis es guardaran quan tornis a estar en línia
    </div>
  )
}
