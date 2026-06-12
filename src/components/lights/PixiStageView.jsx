import { useRef, useEffect, useCallback, useState } from 'react'
import { CELL, LABEL_W, DEFAULT_ROW_LABELS, DEFAULT_COLS, getMemberPixelPos } from '../../lib/editorCanvas'
import { cueEffects, cueFollowspots, cueLevels, cueZoneColors } from '../../lib/lights'
import { drawPixiScene } from '../../lib/pixiStageRenderer'

const W = 720, H = 400

const PERSP_DEFAULTS = { yBackPct: 50, yFrontPct: 60, xConvBack: 80, hBack: 40, hFront: 52, zoom: 163, camX: 0, camY: 23, perspFactor: 69 }

const PERSP_CONTROLS = [
  { key: 'yBackPct', label: 'Y darrere', min: 15, max: 65 },
  { key: 'yFrontPct', label: 'Y davant', min: 40, max: 95 },
  { key: 'xConvBack', label: 'Conv. X', min: 25, max: 95 },
  { key: 'hBack', label: 'h darrere', min: 12, max: 60 },
  { key: 'hFront', label: 'h davant', min: 30, max: 100 },
  { key: 'zoom', label: 'Zoom', min: 100, max: 350 },
  { key: 'camX', label: 'Cam X', min: -50, max: 50 },
  { key: 'camY', label: 'Cam Y', min: -50, max: 50 },
  { key: 'perspFactor', label: 'Perspectiva', min: 50, max: 150 },
]

export default function PixiStageView({ show, members, placements = {}, gridMode = 'alternate', cue, showLights = true, className = '' }) {
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const mountedRef = useRef(false)
  const [debug, setDebug] = useState(false)
  const [superadmin, setSuperadmin] = useState(() => localStorage.getItem('pixiSuperadmin') === 'true')
  const [persp, setPersp] = useState(PERSP_DEFAULTS)

  const toggleSuperadmin = () => {
    setSuperadmin(s => {
      const next = !s
      localStorage.setItem('pixiSuperadmin', String(next))
      return next
    })
  }

  const getSceneData = useCallback(() => {
    const rowLabels = show?.grid_rows ?? DEFAULT_ROW_LABELS
    const ROWS = rowLabels.length
    const COLS = show?.grid_cols ?? DEFAULT_COLS
    const rowElev = show?.row_elevations ?? rowLabels.map(() => 0)
    const GW = COLS * CELL, GH = ROWS * CELL
    const dims = { ROWS, COLS, rowLabels, GW, GH, CW: LABEL_W + GW, CH: GH }

    const effects = showLights ? cueEffects(cue) : []
    const fosc = effects.includes('fosc')
    const sala = showLights && effects.includes('sala')
    const toPublic = showLights && effects.includes('public')
    const frontZoneColors = cueZoneColors(cue, 'front')
    const backZoneColors = cueZoneColors(cue, 'back')
    const frontLevels = cueLevels(cue, 'front')
    const backLevels = cueLevels(cue, 'back')
    const followspots = showLights ? cueFollowspots(cue) : []

    const { hBack, hFront } = persp
    const zoomF = (persp.zoom ?? 100) / 100
    const tokens = members
      .filter(m => m.role !== 'director' && placements[m.id])
      .map(m => {
        const pos = placements[m.id]
        const pt = getMemberPixelPos(pos, gridMode, dims)
        if (!pt) return null
        const xNorm = (pt.x - LABEL_W) / GW
        const t = Math.max(0, Math.min(1, pt.y / GH))
        const elev = (!pos.free && pos.row != null ? (rowElev[pos.row] ?? 0) : 0) * 0.30 * zoomF
        const h = (hBack + (hFront - hBack) * t) * Math.max(0.85, Math.min(1.15, (m.height ?? 170) / 170)) * zoomF
        const zone = xNorm < 1 / 3 ? 'esquerra' : xNorm < 2 / 3 ? 'centre' : 'dreta'
        return { m, xNorm, t, elev, h, zone }
      })
      .filter(Boolean)
      .sort((a, b) => a.t - b.t)

    const platforms = gridMode !== 'free' ? rowLabels.map((_, r) => {
      const elev = (rowElev[r] ?? 0) * 0.30
      if (elev <= 0) return null
      const t = ROWS > 1 ? (r + 0.5) / ROWS : 0.5
      return { t, elev, key: r }
    }).filter(Boolean) : []

    return {
      W, H, fosc, sala, toPublic, showLights,
      frontLevels, backLevels,
      frontZoneColors, backZoneColors,
      followspots, tokens, platforms, effects, persp,
    }
  }, [show, members, placements, gridMode, cue, showLights, persp])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let destroyed = false

    async function init() {
      const { Application } = await import('pixi.js')
      if (destroyed) return

      const app = new Application()
      await app.init({
        width: W, height: H, background: '#0a0f1a',
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      if (destroyed) { app.destroy(true); return }

      el.appendChild(app.canvas)
      app.canvas.style.width = '100%'
      app.canvas.style.height = 'auto'
      app.canvas.style.pointerEvents = 'none'
      appRef.current = app
      mountedRef.current = true
      drawPixiScene(app, getSceneData())
    }

    init()
    return () => {
      destroyed = true
      mountedRef.current = false
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mountedRef.current || !appRef.current) return
    drawPixiScene(appRef.current, getSceneData())
  }, [getSceneData])

  return (
    <div>
      <div
        ref={containerRef}
        className={className}
        role="img"
        aria-label="Vista 3D de l'escenari"
        style={{ lineHeight: 0 }}
      />
      <div className="flex items-center gap-2 mt-1">
        <button
          onDoubleClick={e => { e.stopPropagation(); toggleSuperadmin() }}
          className={`text-[10px] font-mono transition-opacity ${superadmin ? 'text-gray-600 hover:text-gray-400' : 'text-gray-800 hover:text-gray-700 opacity-30'}`}
          title={superadmin ? 'Doble click per sortir' : 'Doble click per entrar a superadmin'}
        >
          🔧
        </button>
        {superadmin && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setDebug(d => !d) }}
              className="text-[10px] text-gray-600 hover:text-gray-400 font-mono"
            >
              {debug ? '▼' : '▶'} persp
            </button>
            {debug && (
              <code className="text-[10px] text-gray-600 select-all">
                {JSON.stringify(persp)}
              </code>
            )}
            {debug && (
              <button
                onClick={e => { e.stopPropagation(); setPersp(PERSP_DEFAULTS) }}
                className="text-[10px] text-gray-600 hover:text-gray-400"
              >
                reset
              </button>
            )}
          </>
        )}
      </div>
      {superadmin && debug && (
        <div className="grid gap-1 mt-1">
          {PERSP_CONTROLS.map(c => (
            <label key={c.key} className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="w-16 shrink-0">{c.label}</span>
              <input
                type="range" min={c.min} max={c.max} value={persp[c.key]}
                onChange={e => { e.stopPropagation(); setPersp(p => ({ ...p, [c.key]: +e.target.value })) }}
                className="flex-1 h-3 accent-cyan-500"
              />
              <span className="w-6 text-right font-mono">{persp[c.key]}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
