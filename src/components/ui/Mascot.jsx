/**
 * Choreo mascot — personified eighth note (corxera).
 *
 * Props:
 *   pose   "neutral" | "celebrate" | "dance" | "sing"   default: "neutral"
 *   voice  key from VOICE_COLORS (soprano1 … bass, director, musician, extra)
 *   color  { bg, fg } override — takes priority over voice
 *   size   px width                                      default: 200
 *
 * Geometry (viewBox 0 0 210 260):
 *   Oval  cx=95 cy=148 rx=52 ry=40 rotate(-20)
 *   Stem  x=144, y 124→27, strokeWidth=15 (same color as body)
 *   Flag  thick at top (widens quickly from stem), tapers to thin tip at bottom
 *   Highlight  crescent/wedge via clipPath — always lighter, simulates sphere
 */

import { VOICE_COLORS } from '../../lib/constants'

const DARK          = '#1e1b4b'
const DEFAULT_COLOR = { bg: '#4f46e5', fg: '#ffffff' }

// ─── pose data ────────────────────────────────────────────────────────────────

const POSES = {
  neutral: {
    leftArm:  'M 46,164 C 32,168 25,181 23,196',
    rightArm: 'M 140,156 C 154,163 161,176 162,190',
    leftLeg:  'M 87,184 C 83,194 79,203 76,211',
    rightLeg: 'M 109,184 C 113,194 117,203 119,211',
    leftEnd:  [23, 196],
    rightEnd: [162, 190],
    face: { leftEye: 'open', rightEye: 'open', mouth: 'smile-closed' },
  },
  celebrate: {
    leftArm:  'M 46,164 C 31,150 24,132 22,114',
    rightArm: 'M 140,156 C 155,142 162,125 164,107',
    leftLeg:  'M 87,184 C 83,194 79,203 76,211',
    rightLeg: 'M 109,184 C 113,194 117,203 119,211',
    leftEnd:  null,
    rightEnd: null,
    face: { leftEye: 'squint', rightEye: 'squint', mouth: 'smile-open' },
  },
  dance: {
    leftArm:  'M 46,164 C 31,149 27,130 31,114',
    rightArm: 'M 140,156 C 156,156 167,155 175,154',
    leftLeg:  'M 87,184 C 82,193 74,201 68,211',
    rightLeg: 'M 109,184 C 114,194 119,202 123,211',
    leftEnd:  null,
    rightEnd: null,
    face: { leftEye: 'open', rightEye: 'wink', mouth: 'smile-slight' },
  },
  sing: {
    leftArm:  'M 46,164 C 38,146 56,118 74,85',
    rightArm: 'M 140,156 C 156,150 164,141 168,133',
    leftLeg:  'M 87,184 C 83,194 79,203 76,211',
    rightLeg: 'M 109,184 C 113,194 117,203 119,211',
    leftEnd:  null,
    rightEnd: null,
    face: { leftEye: 'open', rightEye: 'open', mouth: 'mouth-O' },
  },
}

// ─── celebrate confetti (now rendered inside sticker group) ───────────────────

const CONFETTI = [
  { t:'c', cx:18,  cy:82,  r:6,   fill:'#f59e0b' },
  { t:'c', cx:28,  cy:52,  r:3.5, fill:'#ef4444' },
  { t:'c', cx:9,   cy:118, r:5,   fill:'#10b981' },
  { t:'c', cx:38,  cy:36,  r:2.5, fill:'#f97316' },
  { t:'c', cx:15,  cy:155, r:3.5, fill:'#8b5cf6' },
  { t:'c', cx:22,  cy:196, r:7,   fill:'#3b82f6' },
  { t:'c', cx:44,  cy:22,  r:4,   fill:'#ec4899' },
  { t:'c', cx:192, cy:76,  r:5,   fill:'#ef4444' },
  { t:'c', cx:174, cy:44,  r:7,   fill:'#3b82f6' },
  { t:'c', cx:200, cy:110, r:3.5, fill:'#f59e0b' },
  { t:'c', cx:183, cy:148, r:6,   fill:'#10b981' },
  { t:'c', cx:198, cy:185, r:4,   fill:'#ec4899' },
  { t:'c', cx:72,  cy:16,  r:5.5, fill:'#6366f1' },
  { t:'c', cx:118, cy:20,  r:3,   fill:'#f97316' },
  { t:'c', cx:148, cy:13,  r:6,   fill:'#fbbf24' },
  { t:'r', cx:32,  cy:66,  w:14, h:6,  rot:-38, fill:'#ef4444' },
  { t:'r', cx:14,  cy:172, w:10, h:5,  rot:52,  fill:'#8b5cf6' },
  { t:'r', cx:91,  cy:14,  w:13, h:5,  rot:18,  fill:'#fbbf24' },
  { t:'r', cx:180, cy:58,  w:15, h:5,  rot:33,  fill:'#ec4899' },
  { t:'r', cx:196, cy:148, w:11, h:5,  rot:-50, fill:'#10b981' },
  { t:'r', cx:163, cy:20,  w:16, h:5,  rot:22,  fill:'#f59e0b' },
  { t:'r', cx:50,  cy:10,  w:10, h:4,  rot:-15, fill:'#3b82f6' },
  { t:'r', cx:22,  cy:132, w:24, h:4,  rot:-22, fill:'#f97316' },
  { t:'r', cx:188, cy:122, w:24, h:4,  rot:28,  fill:'#6366f1' },
  { t:'r', cx:105, cy:10,  w:18, h:3,  rot:8,   fill:'#ef4444' },
]

// ─── dance motion arcs ────────────────────────────────────────────────────────

const DANCE_ARCS = [
  { d: 'M 17,106 Q 27,99 23,88',     w: 2.8, op: 0.55 },
  { d: 'M 11,117 Q 22,109 17,97',    w: 2.0, op: 0.35 },
  { d: 'M 182,143 Q 191,151 187,162', w: 2.8, op: 0.55 },
  { d: 'M 188,135 Q 197,144 193,156', w: 2.0, op: 0.35 },
  { d: 'M 48,222 Q 58,215 55,205',    w: 2.2, op: 0.40 },
  { d: 'M 122,222 Q 133,215 130,205', w: 2.2, op: 0.40 },
]

// ─── sub-components ───────────────────────────────────────────────────────────

function Eye({ type, cx, cy, fg }) {
  if (type === 'open') {
    return <ellipse cx={cx} cy={cy} rx={5} ry={6} fill={fg} />
  }
  if (type === 'squint') {
    return (
      <path
        d={`M ${cx-7},${cy+1} Q ${cx},${cy-7} ${cx+7},${cy+1}`}
        stroke={fg} strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
    )
  }
  if (type === 'wink') {
    return (
      <path
        d={`M ${cx-7},${cy+2} Q ${cx},${cy-6} ${cx+7},${cy+2}`}
        stroke={fg} strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
    )
  }
  return null
}

function Mouth({ type, fg }) {
  if (type === 'smile-closed') {
    return (
      <path d="M 84,160 Q 95,169 106,160"
        stroke={fg} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    )
  }
  if (type === 'smile-slight') {
    return (
      <path d="M 88,160 Q 95,166 102,160"
        stroke={fg} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    )
  }
  if (type === 'smile-open') {
    return (
      <g>
        <path d="M 83,158 Q 95,172 107,158" fill={DARK} opacity="0.65" />
        <path d="M 83,158 Q 95,172 107,158"
          stroke={fg} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 87,158 L 103,158"
          stroke={fg} strokeWidth="1.8" fill="none" opacity="0.55" />
      </g>
    )
  }
  if (type === 'mouth-O') {
    return (
      <ellipse cx={95} cy={161} rx={7} ry={9}
        fill={DARK} opacity="0.65" stroke={fg} strokeWidth="2" />
    )
  }
  return null
}

// ─── microphone ───────────────────────────────────────────────────────────────
// rotate(-25, 84, 85): capsule ends up at ≈(94,106), mouth at ≈(95,161) → pointing down toward mouth

function Microphone() {
  return (
    <g transform="rotate(-25, 84, 85)">
      <rect x="78" y="62" width="12" height="30" rx="6" fill={DARK} />
      <rect x="80" y="65" width="4" height="23" rx="2" fill="rgba(255,255,255,0.22)" />
      <ellipse cx="84" cy="107" rx="13" ry="16" fill={DARK} />
      <line x1="76" y1="101" x2="92" y2="101" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="74" y1="107" x2="94" y2="107" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="76" y1="113" x2="92" y2="113" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <ellipse cx="80" cy="101" rx="5.5" ry="6.5" fill="rgba(255,255,255,0.28)" />
    </g>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Mascot({ pose = 'neutral', voice, color, size = 200 }) {
  const p      = POSES[pose] ?? POSES.neutral
  const col    = color ?? (voice ? VOICE_COLORS[voice] : null) ?? DEFAULT_COLOR
  const bg     = col.bg
  const fg     = col.fg

  const aspectRatio = 260 / 210
  const height      = Math.round(size * aspectRatio)
  const filterId    = `sticker-${pose}-${bg.replace('#', '')}`
  const clipId      = `bodyClip-${pose}-${bg.replace('#', '')}`

  return (
    <svg
      viewBox="0 0 210 260"
      width={size}
      height={height}
      role="img"
      aria-label="Choreo mascot"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* sticker filter */}
        <filter id={filterId} x="-32%" y="-26%" width="164%" height="158%">
          <feMorphology operator="dilate" radius="10" in="SourceAlpha" result="dilated" />
          <feFlood floodColor="#ffffff" result="whiteFlood" />
          <feComposite in="whiteFlood" in2="dilated" operator="in" result="whiteBorder" />
          <feMorphology operator="dilate" radius="10" in="SourceAlpha" result="shadowBase" />
          <feGaussianBlur in="shadowBase" stdDeviation="9" result="blurShadow" />
          <feOffset in="blurShadow" dx="3" dy="9" result="offsetShadow" />
          <feFlood floodColor="rgba(30,27,75,0.28)" result="shadowTint" />
          <feComposite in="shadowTint" in2="offsetShadow" operator="in" result="coloredShadow" />
          <feMerge>
            <feMergeNode in="coloredShadow" />
            <feMergeNode in="whiteBorder" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* clip path = body oval, used to create the wedge/crescent highlight */}
        <clipPath id={clipId}>
          <ellipse cx="95" cy="148" rx="52" ry="40" transform="rotate(-20, 95, 148)" />
        </clipPath>
      </defs>

      {/* dance arcs outside sticker (no border) */}
      {pose === 'dance' && (
        <g>
          {DANCE_ARCS.map((arc, i) => (
            <path key={i} d={arc.d}
              stroke={DARK} strokeWidth={arc.w}
              strokeLinecap="round" fill="none"
              opacity={arc.op}
            />
          ))}
        </g>
      )}

      {/* ── everything inside here gets the sticker border + shadow ── */}
      <g filter={`url(#${filterId})`}>

        {/* confetti — celebrate only, inside sticker so it gets the border */}
        {pose === 'celebrate' && (
          <g>
            {CONFETTI.map((item, i) =>
              item.t === 'c'
                ? <circle key={i} cx={item.cx} cy={item.cy} r={item.r} fill={item.fill} />
                : (
                  <rect key={i}
                    x={item.cx - item.w / 2} y={item.cy - item.h / 2}
                    width={item.w} height={item.h} rx="2"
                    fill={item.fill}
                    transform={`rotate(${item.rot}, ${item.cx}, ${item.cy})`}
                  />
                )
            )}
          </g>
        )}

        {/* stem — same color as body, thicker */}
        <line x1="144" y1="124" x2="144" y2="27"
          stroke={bg} strokeWidth="15" strokeLinecap="round" />

        {/* corxera flag — same color as body
            Outer curve peaks wide near the top (y≈34) then tapers to a thin tip.
            Inner edge stays close to stem → shape is thick near stem, thin at tip. */}
        <path
          d="M 144,27 C 168,24 166,42 154,62 C 150,68 145,64 146,52 C 147,40 147,33 144,27 Z"
          fill={bg}
        />

        {/* left arm */}
        <path d={p.leftArm}
          stroke={bg} strokeWidth="16" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />

        {/* right arm */}
        <path d={p.rightArm}
          stroke={bg} strokeWidth="16" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />

        {/* left leg */}
        <path d={p.leftLeg}
          stroke={bg} strokeWidth="14" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />

        {/* right leg */}
        <path d={p.rightLeg}
          stroke={bg} strokeWidth="14" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />

        {/* feet */}
        <ellipse cx="69"  cy="214" rx="17" ry="10" fill={bg} />
        <ellipse cx="122" cy="214" rx="17" ry="10" fill={bg} />

        {/* oval face/body */}
        <ellipse
          cx="95" cy="148" rx="52" ry="40"
          fill={bg}
          transform="rotate(-20, 95, 148)"
        />

        {/* wedge highlight — spherical lighting from upper-left
            An ellipse offset toward upper-left, clipped by the body oval,
            creates a crescent/wedge that always brightens (white fill). */}
        <ellipse
          cx="66" cy="120" rx="50" ry="38"
          fill="white" opacity="0.30"
          transform="rotate(-20, 66, 120)"
          clipPath={`url(#${clipId})`}
        />

        {/* eyes */}
        <Eye type={p.face.leftEye}  cx={81}  cy={135} fg={fg} />
        <Eye type={p.face.rightEye} cx={109} cy={135} fg={fg} />

        {/* nose */}
        <ellipse cx="95" cy="147" rx="3" ry="2.5" fill={DARK} opacity="0.45" />

        {/* mouth */}
        <Mouth type={p.face.mouth} fg={fg} />

        {/* hand circles — neutral only */}
        {p.leftEnd && (
          <circle cx={p.leftEnd[0]} cy={p.leftEnd[1]} r={10} fill={bg} />
        )}
        {p.rightEnd && (
          <circle cx={p.rightEnd[0]} cy={p.rightEnd[1]} r={10} fill={bg} />
        )}

        {/* microphone — sing only */}
        {pose === 'sing' && <Microphone />}

      </g>
    </svg>
  )
}
