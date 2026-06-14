import { VOICE_COLORS } from '../lib/constants'

const REASONS = {
  viatge:   { label: 'Viatge' },
  feina:    { label: 'Feina' },
  malaltia: { label: 'Malaltia' },
  altre:    { label: 'Altre' },
}

function isUpcoming(isoDate) {
  return isoDate >= new Date().toISOString().slice(0, 10)
}

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function deriveInitials(m) {
  if (m.last_name) return (m.last_name[0] + (m.first_name?.[0] ?? '')).toUpperCase()
  return ((m.name || '').trim().split(' ').map(w => w[0]).join('').slice(0, 2)).toUpperCase() || '?'
}

export default function SummaryView({ members, rehearsals, summaryData }) {
  if (!summaryData) return <p className="text-sm text-faint">Carregant resum…</p>
  if (!rehearsals.length) return <p className="text-sm text-ghost">Sense dades d'assistència.</p>

  const past = rehearsals.filter(r => !isUpcoming(r.date))

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left px-2 py-2 text-ghost font-normal border-b border-rim sticky left-0 bg-page z-10 whitespace-nowrap">Persona</th>
              {past.map(r => (
                <th key={r.id} className="px-2 py-2 text-ghost font-normal border-b border-rim text-center whitespace-nowrap">
                  {formatDate(r.date)}
                </th>
              ))}
              <th className="px-3 py-2 text-ghost font-normal border-b border-rim text-center whitespace-nowrap">% Assist.</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const c = VOICE_COLORS[m.voice] ?? VOICE_COLORS.extra
              const memberData = summaryData[m.id] ?? {}
              const presents = past.filter(r => (memberData[r.id]?.status ?? 'present') === 'present').length
              const pct = past.length ? Math.round((presents / past.length) * 100) : null
              return (
                <tr key={m.id} className="hover:bg-fill/20 transition-colors">
                  <td className="px-2 py-2 border-b border-rim/40 sticky left-0 bg-page z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: c.bg, color: c.fg }}>
                        {deriveInitials(m)}
                      </span>
                      <span className="font-semibold text-body whitespace-nowrap">
                        {m.last_name ?? m.name}
                      </span>
                    </div>
                  </td>
                  {past.map(r => {
                    const rec = memberData[r.id]
                    const s = rec?.status ?? 'present'
                    const reason = rec?.reason
                    return (
                      <td key={r.id} className="px-2 py-2 border-b border-rim/40 text-center" title={reason ? REASONS[reason]?.label : undefined}>
                        {s === 'present' && <span className="text-green-400 font-bold">✓</span>}
                        {s === 'absent'  && <span className="text-red-400 font-bold">✗</span>}
                        {s === 'excused' && (
                          <span className="text-amber-400" title={reason ? REASONS[reason]?.label : 'Excusat'}>~</span>
                        )}
                        {!rec && <span className="text-gray-700">—</span>}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 border-b border-rim/40 text-center font-semibold">
                    {pct !== null ? (
                      <span className={pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {pct}%
                      </span>
                    ) : <span className="text-ghost">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ghost">Mostra només assajos passats ({past.length} de {rehearsals.length} totals).</p>
    </div>
  )
}
