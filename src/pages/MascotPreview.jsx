import Mascot from '../components/ui/Mascot'
import { VOICE_ORDER, VOICE_COLORS, VOICE_LABELS } from '../lib/constants'

const POSES = ['neutral', 'celebrate', 'dance', 'sing']
const ALL_VOICES = [...VOICE_ORDER, 'director']

export default function MascotPreview() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: 'sans-serif',
      padding: '48px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 56,
      alignItems: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1e1b4b' }}>
          Choreo Mascot
        </h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          4 poses · 8 voice colors
        </p>
      </div>

      {/* All 4 poses, default color */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#94a3b8' }}>
          Poses
        </h2>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          {POSES.map(pose => (
            <div key={pose} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Mascot pose={pose} size={160} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1',
                letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {pose}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* All voice colors, neutral pose */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#94a3b8' }}>
          Voice colors
        </h2>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          {ALL_VOICES.map(voice => (
            <div key={voice} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Mascot pose="neutral" voice={voice} size={100} />
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: VOICE_COLORS[voice].bg,
                color: VOICE_COLORS[voice].fg,
                padding: '2px 8px', borderRadius: 4,
                letterSpacing: '0.05em',
              }}>
                {VOICE_LABELS[voice] ?? voice}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Dark background demo */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#94a3b8' }}>
          On dark background
        </h2>
        <div style={{ background: '#1e1b4b', borderRadius: 20, padding: '28px 40px',
          display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          {['soprano1', 'alto1', 'tenor1', 'baritone'].map(voice => (
            <Mascot key={voice} pose="celebrate" voice={voice} size={110} />
          ))}
        </div>
      </section>

      {/* Small size demo */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#94a3b8' }}>
          Small (60px)
        </h2>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          {ALL_VOICES.map(voice => (
            <Mascot key={voice} pose="neutral" voice={voice} size={60} />
          ))}
        </div>
      </section>

      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        {'<Mascot pose="neutral" voice="soprano1" size={200} />'}
      </p>
    </div>
  )
}
