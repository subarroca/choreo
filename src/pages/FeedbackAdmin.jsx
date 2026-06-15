import { useState, useMemo } from 'react'
import { MessageSquarePlus, CheckCircle, Circle, ClipboardCopy, ClipboardCheck, Filter } from '../lib/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import useFeedback from '../hooks/useFeedback.js'
import Layout from '../components/Layout'
import PageContainer from '../components/ui/PageContainer'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { ICON } from '../lib/ui'

const CATEGORY = {
  bug:     { label: 'Bug',     cls: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800' },
  millora: { label: 'Millora', cls: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800' },
  idea:    { label: 'Idea',    cls: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildClaudePrompt(pendingItems) {
  const bugs     = pendingItems.filter(f => f.category === 'bug')
  const millores = pendingItems.filter(f => f.category === 'millora' || !f.category)
  const idees    = pendingItems.filter(f => f.category === 'idea')

  const fmt = (items, offset = 0) =>
    items.map((f, i) => {
      const who = f.profile?.full_name ?? f.profile?.email ?? 'Usuari anònim'
      const date = formatDate(f.created_at)
      return `${offset + i + 1}. [pàgina: ${f.url ?? '?'}] — "${f.message}" (${who}, ${date})`
    }).join('\n')

  const sections = []
  if (bugs.length)     sections.push(`🐛 BUGS (${bugs.length})\n${fmt(bugs)}`)
  if (millores.length) sections.push(`💡 MILLORES (${millores.length})\n${fmt(millores, bugs.length)}`)
  if (idees.length)    sections.push(`🌟 IDEES (${idees.length})\n${fmt(idees, bugs.length + millores.length)}`)

  return [
    `Ets l'assistent de l'app Choreo (gestió de cors).`,
    `Aquí tens ${pendingItems.length} suggeriments/bugs pendents de resoldre, enviats pels usuaris:`,
    '',
    sections.join('\n\n'),
    '',
    `Analitza'ls, agrupa'ls per àrea funcional, prioritza els bugs crítics i proposa un pla d'implementació pas a pas.`,
  ].join('\n')
}

export default function FeedbackAdmin() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { items, loading, resolve, unresolve, pendingCount } = useFeedback()
  const [tab, setTab] = useState('pending')
  const [urlFilter, setUrlFilter] = useState('')
  const [copied, setCopied] = useState(false)

  if (role && role !== 'admin' && role !== 'director') {
    navigate('/')
    return null
  }

  const urls = useMemo(
    () => [...new Set(items.map(f => f.url).filter(Boolean))].sort(),
    [items]
  )

  const filtered = useMemo(() => items.filter(f => {
    if (tab === 'pending'  && f.resolved)  return false
    if (tab === 'resolved' && !f.resolved) return false
    if (urlFilter && f.url !== urlFilter)  return false
    return true
  }), [items, tab, urlFilter])

  const pending = items.filter(f => !f.resolved)

  async function handleCopy() {
    await navigator.clipboard.writeText(buildClaudePrompt(pending))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const tabCls = (active) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      active
        ? 'bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-400'
        : 'bg-fill border-line text-muted hover:text-body'
    }`

  const tabCount = { all: items.length, pending: pendingCount, resolved: items.length - pendingCount }

  return (
    <Layout fullWidth>
      <PageContainer
        header={
          <PageHeader
            title="Feedback"
            icon={MessageSquarePlus}
            subtitle="Suggeriments i bugs enviats pels usuaris"
            actions={
              <button
                onClick={handleCopy}
                disabled={pending.length === 0}
                title={pending.length === 0 ? 'Cap item pendent' : 'Copia un prompt amb tots els items pendents'}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  pending.length === 0
                    ? 'border-line text-ghost cursor-not-allowed'
                    : copied
                      ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                      : 'border-line text-muted hover:text-cyan-700 hover:border-cyan-500 dark:hover:text-cyan-400 dark:hover:border-cyan-700'
                }`}
              >
                {copied ? <ClipboardCheck size={ICON.sm} /> : <ClipboardCopy size={ICON.sm} />}
                {copied
                  ? 'Copiat!'
                  : `Prompt per a Claude${pending.length ? ` (${pending.length})` : ''}`}
              </button>
            }
          />
        }
      >
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {['all', 'pending', 'resolved'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={tabCls(tab === t)}>
              {t === 'all' ? 'Tots' : t === 'pending' ? 'Pendents' : 'Resolts'}{' '}
              <span className="text-ghost">{tabCount[t]}</span>
            </button>
          ))}
          {urls.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Filter size={ICON.xs} className="text-ghost shrink-0" />
              <select
                value={urlFilter}
                onChange={e => setUrlFilter(e.target.value)}
                className="text-xs bg-fill border border-line rounded-lg px-2 py-1.5 text-muted focus:outline-none focus:border-cyan-700 max-w-[200px]"
              >
                <option value="">Totes les pàgines</option>
                {urls.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <p className="text-faint text-sm py-8">Carregant...</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquarePlus} title="Cap suggeriment." />
        ) : (
          <div className="divide-y divide-rim">
            {filtered.map(f => {
              const cat = CATEGORY[f.category] ?? CATEGORY.millora
              const who = f.profile?.full_name ?? f.profile?.email ?? null
              return (
                <div
                  key={f.id}
                  className={`py-3 px-1 flex items-start gap-3 transition-opacity ${f.resolved ? 'opacity-40' : ''}`}
                >
                  <button
                    onClick={() => f.resolved ? unresolve(f.id) : resolve(f.id)}
                    title={f.resolved ? 'Marcar com a pendent' : 'Marcar com a resolt'}
                    className={`mt-0.5 shrink-0 transition-colors ${
                      f.resolved
                        ? 'text-green-500 hover:text-muted'
                        : 'text-ghost hover:text-green-500'
                    }`}
                  >
                    {f.resolved
                      ? <CheckCircle size={ICON.md} />
                      : <Circle size={ICON.md} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${cat.cls}`}>
                        {cat.label}
                      </span>
                      <p className="text-sm text-body leading-snug">{f.message}</p>
                    </div>
                    <p className="text-xs text-ghost flex gap-2 flex-wrap">
                      {f.url && <span className="font-mono">{f.url}</span>}
                      {who && <span>{who}</span>}
                      <span>{formatDate(f.created_at)}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageContainer>
    </Layout>
  )
}
