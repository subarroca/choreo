import { Graphics, GraphicsContext, BlurFilter, Container } from 'pixi.js'
import { VOICE_COLORS } from './constants'
import { lightColor, LIGHT_ZONES } from './lights'

const FRAME = 16
const WARM_HEX = '#fde68a'

const lerp = (a, b, t) => a + (b - a) * t
const hexToNum = hex => parseInt(hex.replace('#', ''), 16)

let _xConv = 0.55
let _camXOff = 0
function xScreen(xNorm, t, W) {
  return W / 2 + _camXOff + (xNorm - 0.5) * (W - 2 * FRAME - 40) * (_xConv + (1 - _xConv) * t)
}

function tintNum(base, light, s) {
  if (s <= 0) return base
  const m = s * 0.45
  const br = (base >> 16) & 0xff, bg = (base >> 8) & 0xff, bb = base & 0xff
  const lr = (light >> 16) & 0xff, lg = (light >> 8) & 0xff, lb = light & 0xff
  return (Math.round(br * (1 - m) + lr * m) << 16) |
    (Math.round(bg * (1 - m) + lg * m) << 8) |
    Math.round(bb * (1 - m) + lb * m)
}

let _personCtx = null
function getPersonCtx() {
  if (_personCtx) return _personCtx
  const c = new GraphicsContext()
  c.circle(0, -0.90, 0.08).fill(0xeeeeee)
  c.roundRect(-0.09, -0.78, 0.18, 0.32, 0.04).fill(0xffffff)
  c.roundRect(-0.12, -0.75, 0.03, 0.24, 0.012).fill(0xcccccc)
  c.roundRect(0.09, -0.75, 0.03, 0.24, 0.012).fill(0xcccccc)
  c.roundRect(-0.055, -0.44, 0.048, 0.44, 0.02).fill(0xdddddd)
  c.roundRect(0.007, -0.44, 0.048, 0.44, 0.02).fill(0xdddddd)
  _personCtx = c
  return c
}

export function drawPixiScene(app, data) {
  const { W, H, fosc, sala, toPublic, showLights,
    frontLevels, backLevels, frontZoneColors, backZoneColors,
    followspots, tokens, platforms } = data

  app.stage.removeChildren()

  const p = data.persp ?? {}
  const baseConv = (p.xConvBack ?? 80) / 100
  const perspF = (p.perspFactor ?? 100) / 100
  _xConv = 1.0 - (1.0 - baseConv) * perspF
  _camXOff = W * ((p.camX ?? 0) / 100)
  const rawYBack = H * ((p.yBackPct ?? 50) / 100)
  const rawYFront = H * ((p.yFrontPct ?? 60) / 100)
  const zoomF = (p.zoom ?? 100) / 100
  const zoomCenter = (rawYBack + rawYFront) / 2
  const camOffset = H * ((p.camY ?? 0) / 100)
  const Y_BACK = zoomCenter + (rawYBack - zoomCenter) * zoomF + camOffset
  const Y_FRONT = zoomCenter + (rawYFront - zoomCenter) * zoomF + camOffset
  const FS_X = { esquerra: 0.25, centre: 0.5, dreta: 0.75 }

  drawBackground(app, W, H)
  drawCyclorama(app, W, H, Y_BACK, backLevels, backZoneColors, fosc)
  drawStageFloor(app, W, H, Y_BACK, Y_FRONT)
  drawPlatforms(app, W, H, Y_BACK, Y_FRONT, platforms, zoomF)
  if (!fosc) drawBackRimLights(app, W, Y_BACK, Y_FRONT, tokens, backLevels, backZoneColors)
  if (!fosc) drawFrontBeams(app, W, H, Y_BACK, Y_FRONT, frontLevels, frontZoneColors)
  if (!fosc) drawShadows(app, W, Y_BACK, Y_FRONT, tokens, frontLevels)
  drawMembers(app, W, Y_BACK, Y_FRONT, tokens, frontLevels, backLevels, frontZoneColors, backZoneColors, fosc, showLights)
  drawFollowspots(app, W, Y_BACK, Y_FRONT, followspots, tokens, FS_X)
  if (fosc) drawBlackout(app, W, H)
  if (!fosc) drawHaze(app, W, Y_BACK, Y_FRONT, frontLevels, frontZoneColors)
  if (toPublic) drawPublicFocus(app, W, H)
  drawAudience(app, W, H, sala)
  drawProscenium(app, W, H)
}

function drawBackground(app, W, H) {
  const bg = new Graphics()
  bg.roundRect(0, 0, W, H, 8).fill(0x04060c)
  bg.rect(FRAME, FRAME, W - 2 * FRAME, H - FRAME - 32).fill(0x070c18)
  app.stage.addChild(bg)
}

function drawCyclorama(app, W, H, Y_BACK, backLevels, backZoneColors, fosc) {
  const cycH = Y_BACK - FRAME + 6
  const cyc = new Graphics()
  cyc.rect(FRAME, FRAME, W - 2 * FRAME, cycH).fill(0x080e1e)
  app.stage.addChild(cyc)
  if (fosc) return

  const zoneW = (W - 2 * FRAME) / 3
  for (let i = 0; i < LIGHT_ZONES.length; i++) {
    const z = LIGHT_ZONES[i]
    const lvl = backLevels[z.value]
    if (lvl <= 0) continue
    const hex = lightColor(backZoneColors[z.value])?.hex ?? WARM_HEX
    const color = hexToNum(hex)
    const t = lvl / 4

    const x = FRAME + zoneW * i
    const cx = x + zoneW / 2
    const wash = new Graphics()
    wash.rect(x, FRAME, zoneW, cycH).fill({ color, alpha: t * 0.40 })
    app.stage.addChild(wash)

    const glow = new Graphics()
    glow.ellipse(cx, FRAME + cycH * 0.6, zoneW * 0.35, cycH * 0.4)
    glow.fill({ color, alpha: t * 0.20 })
    glow.filters = [new BlurFilter({ strength: 22, quality: 3 })]
    app.stage.addChild(glow)

    const hotspot = new Graphics()
    hotspot.ellipse(cx, FRAME + cycH * 0.7, zoneW * 0.2, cycH * 0.2)
    hotspot.fill({ color: 0xffffff, alpha: t * 0.08 })
    hotspot.filters = [new BlurFilter({ strength: 14, quality: 3 })]
    app.stage.addChild(hotspot)
  }
}

function drawStageFloor(app, W, H, Y_BACK, Y_FRONT) {
  const backHalfW = (W - 2 * FRAME) / 2 * _xConv
  const floor = new Graphics()
  floor.poly([
    W / 2 - backHalfW, Y_BACK + 6,
    W / 2 + backHalfW, Y_BACK + 6,
    W - FRAME, Y_FRONT + 8,
    FRAME, Y_FRONT + 8,
  ]).fill(0x0b1422)
  app.stage.addChild(floor)

  const edge = new Graphics()
  edge.moveTo(W / 2 - backHalfW, Y_BACK + 6)
  edge.lineTo(W / 2 + backHalfW, Y_BACK + 6)
  edge.stroke({ color: 0x182540, width: 1, alpha: 0.4 })
  app.stage.addChild(edge)
}

function drawPlatforms(app, W, H, Y_BACK, Y_FRONT, platforms, zoomF) {
  for (const p of platforms) {
    const y = lerp(Y_BACK, Y_FRONT, p.t) - p.elev
    const halfW = (W - 2 * FRAME - 40) * (_xConv + (1 - _xConv) * p.t) / 2
    const scale = 0.55 + 0.45 * p.t
    const platH = Math.max(2, 4 * scale * zoomF)

    const plat = new Graphics()
    plat.poly([
      W / 2 - halfW, y,
      W / 2 + halfW, y,
      W / 2 + halfW + 1, y + platH,
      W / 2 - halfW - 1, y + platH,
    ]).fill(0x1e2a3e)
    plat.moveTo(W / 2 - halfW, y)
    plat.lineTo(W / 2 + halfW, y)
    plat.stroke({ color: 0x4a6080, width: 1.5 })
    app.stage.addChild(plat)
  }
}

function drawBackRimLights(app, W, Y_BACK, Y_FRONT, tokens, backLevels, backZoneColors) {
  for (const tk of tokens) {
    const lvl = backLevels[tk.zone]
    if (lvl <= 0) continue
    const t = lvl / 4
    const hex = lightColor(backZoneColors[tk.zone])?.hex ?? WARM_HEX
    const color = hexToNum(hex)
    const x = xScreen(tk.xNorm, tk.t, W)
    const y = lerp(Y_BACK, Y_FRONT, tk.t) - tk.elev
    const h = tk.h

    const rim = new Graphics()
    rim.ellipse(x, y - h * 0.5, h * 0.15, h * 0.48)
    rim.fill({ color, alpha: t * 0.4 })
    rim.filters = [new BlurFilter({ strength: 7, quality: 3 })]
    app.stage.addChild(rim)

    const edge = new Graphics()
    edge.ellipse(x, y - h * 0.9, h * 0.09, h * 0.05)
    edge.fill({ color: 0xffffff, alpha: t * 0.22 })
    edge.filters = [new BlurFilter({ strength: 3, quality: 2 })]
    app.stage.addChild(edge)
  }
}

function drawFrontBeams(app, W, H, Y_BACK, Y_FRONT, frontLevels, frontZoneColors) {
  const barY = FRAME
  const zoneW = (W - 2 * FRAME) / 3
  const floorY = Y_FRONT + 8

  for (let i = 0; i < LIGHT_ZONES.length; i++) {
    const z = LIGHT_ZONES[i]
    const lvl = frontLevels[z.value]
    if (lvl <= 0) continue
    const hex = lightColor(frontZoneColors[z.value])?.hex ?? WARM_HEX
    const color = hexToNum(hex)
    const t = lvl / 4
    const zoneX0 = FRAME + zoneW * i
    const zoneCX = zoneX0 + zoneW / 2
    const targetY = lerp(Y_BACK, Y_FRONT, 0.5)

    for (let b = 0; b < 3; b++) {
      const frac = (b + 0.5) / 3
      const barX = zoneX0 + zoneW * frac
      const targetX = barX
      const halfTop = 3
      const halfBot = zoneW * 0.22

      const beam = new Graphics()
      beam.poly([
        barX - halfTop, barY,
        barX + halfTop, barY,
        targetX + halfBot, floorY,
        targetX - halfBot, floorY,
      ]).fill({ color, alpha: t * 0.09 })
      app.stage.addChild(beam)

      const glow = new Graphics()
      glow.poly([
        barX - halfTop * 0.5, barY,
        barX + halfTop * 0.5, barY,
        targetX + halfBot * 0.65, floorY,
        targetX - halfBot * 0.65, floorY,
      ]).fill({ color, alpha: t * 0.06 })
      glow.filters = [new BlurFilter({ strength: 14, quality: 3 })]
      app.stage.addChild(glow)
    }

    const pool = new Graphics()
    pool.ellipse(zoneCX, targetY + 8, zoneW * 0.40, 18)
    pool.fill({ color, alpha: t * 0.22 })
    pool.filters = [new BlurFilter({ strength: 14, quality: 3 })]
    app.stage.addChild(pool)
  }
}

function drawShadows(app, W, Y_BACK, Y_FRONT, tokens, frontLevels) {
  const g = new Graphics()
  for (const tk of tokens) {
    const lvl = frontLevels[tk.zone] / 4
    if (lvl < 0.1) continue
    const x = xScreen(tk.xNorm, tk.t, W)
    const y = lerp(Y_BACK, Y_FRONT, tk.t) - tk.elev
    const h = tk.h
    g.ellipse(x, y + 2, h * 0.10, h * 0.035)
    g.fill({ color: 0x000000, alpha: lvl * 0.3 })
  }
  g.filters = [new BlurFilter({ strength: 3, quality: 2 })]
  app.stage.addChild(g)
}

function drawMembers(app, W, Y_BACK, Y_FRONT, tokens, frontLevels, backLevels, frontZoneColors, backZoneColors, fosc, showLights) {
  const ctx = getPersonCtx()

  for (const tk of tokens) {
    const { m, xNorm, t, elev, h, zone } = tk
    const vc = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
    const x = xScreen(xNorm, t, W)
    const y = lerp(Y_BACK, Y_FRONT, t) - elev

    const lit = fosc ? 0 : frontLevels[zone] / 4
    const backLit = fosc ? 0 : backLevels[zone] / 4
    const isBacklit = lit === 0 && backLit > 0

    let tint, alpha
    if (!showLights) {
      tint = hexToNum(vc.bg)
      alpha = 1
    } else if (fosc) {
      tint = 0x060606
      alpha = 0.1
    } else if (isBacklit) {
      tint = 0x080808
      alpha = 1
    } else if (lit > 0) {
      const fHex = lightColor(frontZoneColors[zone])?.hex ?? WARM_HEX
      tint = tintNum(hexToNum(vc.bg), hexToNum(fHex), lit)
      alpha = 0.2 + 0.8 * lit
    } else {
      tint = 0x111111
      alpha = 0.15
    }

    const g = new Graphics(ctx)
    g.scale.set(h)
    g.position.set(x, y)
    g.tint = tint
    g.alpha = showLights ? alpha : 1
    app.stage.addChild(g)

    if (showLights && lit > 0.3 && !fosc) {
      const hl = new Graphics()
      hl.circle(x, y - h * 0.5, h * 0.12)
      hl.fill({ color: 0xffffff, alpha: lit * 0.06 })
      hl.filters = [new BlurFilter({ strength: 4, quality: 2 })]
      app.stage.addChild(hl)
    }
  }
}

function drawFollowspots(app, W, Y_BACK, Y_FRONT, followspots, tokens, FS_X) {
  const ctx = getPersonCtx()

  for (let i = 0; i < followspots.length; i++) {
    const fs = followspots[i]
    const target = fs.member_id ? tokens.find(tk => tk.m.id === fs.member_id) : null
    let tx, feetY, faceY
    if (target) {
      tx = xScreen(target.xNorm, target.t, W)
      feetY = lerp(Y_BACK, Y_FRONT, target.t) - target.elev
      faceY = feetY - target.h * 0.75
    } else {
      tx = xScreen(FS_X[fs.position] ?? 0.5, 0.85, W)
      feetY = Y_FRONT - 6
      faceY = feetY - 30
    }
    const apexX = W / 2 + (i - (followspots.length - 1) / 2) * 90
    const apexY = -8  // Posició dels canons fora del canvas (simulant sostre)

    const cone = new Graphics()
    cone.poly([apexX - 6, apexY, apexX + 6, apexY, tx + 30, faceY + 12, tx - 30, faceY + 12])
    cone.fill({ color: 0xfef3c7, alpha: 0.16 })
    app.stage.addChild(cone)

    const cg = new Graphics()
    cg.poly([apexX - 3, apexY, apexX + 3, apexY, tx + 20, faceY + 8, tx - 20, faceY + 8])
    cg.fill({ color: 0xfef3c7, alpha: 0.10 })
    cg.filters = [new BlurFilter({ strength: 10, quality: 3 })]
    app.stage.addChild(cg)

    const pool = new Graphics()
    pool.ellipse(tx, feetY + 5, 32, 10)
    pool.fill({ color: 0xfef3c7, alpha: 0.35 })
    pool.filters = [new BlurFilter({ strength: 8, quality: 3 })]
    app.stage.addChild(pool)

    const bright = new Graphics()
    bright.ellipse(tx, feetY + 5, 18, 6)
    bright.fill({ color: 0xffffff, alpha: 0.20 })
    bright.filters = [new BlurFilter({ strength: 4, quality: 2 })]
    app.stage.addChild(bright)

    if (target) {
      const g = new Graphics(ctx)
      const vc = VOICE_COLORS[target.m.voice] ?? VOICE_COLORS.extra
      g.scale.set(target.h)
      g.position.set(tx, feetY)
      g.tint = hexToNum(vc.bg)
      app.stage.addChild(g)
    }
  }
}

function drawBlackout(app, W, H) {
  const overlay = new Graphics()
  overlay.rect(FRAME, FRAME, W - 2 * FRAME, H - FRAME - 32)
  overlay.fill({ color: 0x020510, alpha: 0.9 })
  app.stage.addChild(overlay)
}

function drawHaze(app, W, Y_BACK, Y_FRONT, frontLevels, frontZoneColors) {
  const maxLvl = Math.max(frontLevels.esquerra, frontLevels.centre, frontLevels.dreta)
  if (maxLvl <= 0) return

  const zoneW = (W - 2 * FRAME) / 3
  const hazeLayer = new Container()
  hazeLayer.alpha = (maxLvl / 4) * 0.28

  for (let i = 0; i < LIGHT_ZONES.length; i++) {
    const z = LIGHT_ZONES[i]
    const lvl = frontLevels[z.value]
    if (lvl <= 0) continue
    const hex = lightColor(frontZoneColors[z.value])?.hex ?? WARM_HEX
    const color = hexToNum(hex)
    const zoneX0 = FRAME + zoneW * i
    const cx = zoneX0 + zoneW / 2

    for (let row = 0; row < 3; row++) {
      const fy = lerp(Y_BACK, Y_FRONT, 0.2 + row * 0.3)
      const spread = zoneW * (0.18 + row * 0.06)
      const h = new Graphics()
      h.ellipse(cx, fy, spread, 12 + row * 4)
      h.fill({ color, alpha: 0.3 + row * 0.1 })
      h.filters = [new BlurFilter({ strength: 20 + row * 6, quality: 3 })]
      hazeLayer.addChild(h)
    }
  }

  const ambient = new Graphics()
  ambient.rect(FRAME, Y_BACK, W - 2 * FRAME, Y_FRONT - Y_BACK)
  ambient.fill({ color: 0xccbbaa, alpha: 0.03 * (maxLvl / 4) })
  ambient.filters = [new BlurFilter({ strength: 18, quality: 2 })]
  hazeLayer.addChild(ambient)

  app.stage.addChild(hazeLayer)
}

function drawPublicFocus(app, W, H) {
  for (const p of [0.3, 0.5, 0.7]) {
    const cone = new Graphics()
    cone.poly([W * p - 7, FRAME, W * p + 7, FRAME, W * p + 60, H, W * p - 60, H])
    cone.fill({ color: 0xfbbf24, alpha: 0.13 })
    app.stage.addChild(cone)

    const glow = new Graphics()
    glow.poly([W * p - 4, FRAME, W * p + 4, FRAME, W * p + 40, H, W * p - 40, H])
    glow.fill({ color: 0xfbbf24, alpha: 0.07 })
    glow.filters = [new BlurFilter({ strength: 14, quality: 3 })]
    app.stage.addChild(glow)
  }
}

function drawAudience(app, W, H, sala) {
  const aud = new Graphics()
  aud.rect(0, H - 32, W, 32).fill(sala ? 0x241a0c : 0x04060c)
  app.stage.addChild(aud)

  for (let i = 0; i < 14; i++) {
    const x = 28 + i * ((W - 56) / 13) + (i % 2 ? 7 : -4)
    const r = 10 + (i % 3) * 2
    const seat = new Graphics()
    seat.circle(x, H - 10 + (i % 2) * 3, r).fill(sala ? 0x3a2d18 : 0x090e18)
    app.stage.addChild(seat)
  }

  if (sala) {
    const tint = new Graphics()
    tint.rect(0, H - 36, W, 36).fill({ color: 0xfbbf24, alpha: 0.08 })
    app.stage.addChild(tint)
  }
}

function drawProscenium(app, W, H) {
  const curtainL = new Graphics()
  curtainL.rect(0, 0, FRAME, H - 32).fill(0x04060c)
  app.stage.addChild(curtainL)

  const curtainR = new Graphics()
  curtainR.rect(W - FRAME, 0, FRAME, H - 32).fill(0x04060c)
  app.stage.addChild(curtainR)

  const frame = new Graphics()
  frame.roundRect(0, 0, W, H, 8).stroke({ color: 0x1a2540, width: 2.5 })
  frame.moveTo(0, H - 32).lineTo(W, H - 32).stroke({ color: 0x1a2540, width: 1 })
  app.stage.addChild(frame)
}
