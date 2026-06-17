import { Check, X } from '../../lib/icons'
import { SECTIONS } from '../../lib/roles.js'
import { ICON } from '../../lib/ui'

const ROLE_BADGE = {
  admin:    'text-red-400',
  director: 'text-cyan-400',
  member:   'text-ghost',
}

function Cell({ active, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`w-7 h-7 mx-auto flex items-center justify-center rounded transition-colors ${
        active
          ? 'bg-cyan-700/30 text-cyan-400 hover:bg-cyan-700/50'
          : 'bg-fill text-ghost/30 hover:text-ghost hover:bg-fill/80'
      }`}>
      {active ? <Check size={ICON.xs} /> : <X size={ICON.xs} />}
    </button>
  )
}

export default function PermissionsMatrix({ users, perms, onToggle }) {
  const members = users.filter(u => u.role !== 'admin' && u.role !== 'director')

  if (!members.length) return <p className="text-faint text-sm py-8">Cap membre sense rol admin/director.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-muted font-medium py-2 pr-4 w-40">Usuari</th>
            {SECTIONS.map(s => (
              <th key={s.key} className="text-center text-ghost font-normal pb-2 px-1 min-w-[72px]">
                <div className="text-xs">{s.label}</div>
                <div className="flex gap-0.5 justify-center mt-1 text-ghost/50">
                  <span className="w-7 text-center">v</span>
                  <span className="w-7 text-center">e</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rim">
          {members.map(u => {
            const uPerms = perms[u.id] ?? {}
            return (
              <tr key={u.id} className="hover:bg-fill/20 transition-colors">
                <td className="py-2 pr-4">
                  <div className="font-medium text-body truncate max-w-[150px]">{u.full_name || u.email}</div>
                  <div className={`text-xs ${ROLE_BADGE[u.role] ?? 'text-ghost'}`}>{u.role ?? 'member'}</div>
                </td>
                {SECTIONS.map(s => (
                  <td key={s.key} className="py-1 px-1">
                    <div className="flex gap-0.5 justify-center">
                      <Cell active={uPerms[s.key]?.view ?? true} onChange={v => onToggle(u.id, s.key, 'view', v)} />
                      <Cell active={uPerms[s.key]?.edit ?? false} onChange={v => onToggle(u.id, s.key, 'edit', v)} />
                    </div>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-ghost mt-3">v = veure &nbsp; e = editar</p>
    </div>
  )
}
