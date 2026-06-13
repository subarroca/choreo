import { X } from 'lucide-react'

const SECTIONS = [
  {
    title: 'Editor de posicions',
    shortcuts: [
      { key: '←↑↓→', desc: 'Moure persona(es) seleccionada(es)' },
      { key: 'Ctrl+Z', desc: 'Desfer últim canvi' },
      { key: 'Ctrl+Y', desc: 'Refer' },
      { key: 'Esc', desc: 'Sortir del mode trajectòria' },
      { key: 'Clic dret', desc: 'Menú contextual de persona' },
      { key: 'Doble clic', desc: 'Posar persona al centre del ratolí' },
      { key: '?', desc: 'Mostrar aquestes dreceres' },
    ],
  },
  {
    title: 'Assaig',
    shortcuts: [
      { key: '← / ↑', desc: 'Moment anterior' },
      { key: '→ / ↓', desc: 'Moment següent' },
      { key: 'Espai', desc: 'Iniciar/pausar run-through automàtic' },
      { key: 'Mantén premut', desc: 'Seleccionar persona en el canvas' },
      { key: 'Swipe', desc: 'Navegar entre moments (mòbil)' },
    ],
  },
  {
    title: 'Llums (player)',
    shortcuts: [
      { key: '→ / Espai', desc: 'GO (pas següent)' },
      { key: '←', desc: 'Pas anterior' },
      { key: 'Esc', desc: 'Tancar player' },
    ],
  },
]

export default function ShortcutsModal({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose} />
      <div className="fixed inset-y-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-white">Dreceres de teclat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">{section.title}</p>
              <div className="space-y-1">
                {section.shortcuts.map(({ key, desc }) => (
                  <div key={key} className="flex items-center gap-3 py-1.5">
                    <kbd className="shrink-0 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 font-mono min-w-[90px] text-center">
                      {key}
                    </kbd>
                    <span className="text-sm text-gray-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
