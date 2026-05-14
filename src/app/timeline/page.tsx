import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const IMPACT_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-500',
  low: 'bg-neutral-600',
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-neutral-500',
}

const TYPE_LABEL: Record<string, string> = {
  dashboard_gravity: 'Dashboard Gravity',
  runtime_boundary: 'Runtime Boundary',
  business_logic_leak: 'Business Logic Leak',
  orchestration_drift: 'Orchestration Drift',
  overengineering: 'Overengineering',
  prompt_coupling: 'Prompt Coupling',
  architecture_debt: 'Architecture Debt',
}

function DateStamp({ date }: { date: Date }) {
  return (
    <time className="text-text-tertiary text-2xs flex-shrink-0">
      {new Date(date).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })}
    </time>
  )
}

export default async function TimelinePage() {
  const [prompts, logs, decisions, warnings] = await Promise.all([
    db.promptExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        roadmapNode: { select: { title: true } },
        changedFileEntries: { select: { path: true, changeType: true, impactLevel: true } },
      },
    }),
    db.executionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        nodes: { include: { node: { select: { title: true } } } },
        changedFileEntries: { select: { path: true, changeType: true, impactLevel: true } },
      },
    }),
    db.decision.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    db.architectureWarning.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Merge into unified timeline
  type TimelineItem =
    | { type: 'prompt'; date: Date; data: (typeof prompts)[0] }
    | { type: 'log'; date: Date; data: (typeof logs)[0] }
    | { type: 'decision'; date: Date; data: (typeof decisions)[0] }
    | { type: 'warning'; date: Date; data: (typeof warnings)[0] }

  const items: TimelineItem[] = [
    ...prompts.map((p) => ({ type: 'prompt' as const, date: p.createdAt, data: p })),
    ...logs.map((l) => ({ type: 'log' as const, date: l.createdAt, data: l })),
    ...decisions.map((d) => ({ type: 'decision' as const, date: d.createdAt, data: d })),
    ...warnings.map((w) => ({ type: 'warning' as const, date: w.createdAt, data: w })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-text-primary text-xl font-semibold mb-1">Timeline</h1>
          <p className="text-text-tertiary text-sm">Chronological execution memory — prompts, logs, decisions, warnings</p>
        </div>
        <Link
          href="/prompts/new"
          className="flex items-center gap-2 px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Log execution
        </Link>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mb-8 text-2xs text-text-tertiary">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent/70" />prompt</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500/70" />execution log</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500/70" />decision</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500/70" />warning</span>
      </div>

      {/* Timeline feed */}
      <div className="space-y-0">
        {items.map((item, idx) => {
          // Group by date
          const thisDate = new Date(item.date).toDateString()
          const prevDate = idx > 0 ? new Date(items[idx - 1].date).toDateString() : null
          const showDateSeparator = thisDate !== prevDate

          return (
            <div key={`${item.type}-${item.date.toISOString()}-${idx}`}>
              {showDateSeparator && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px bg-bg-border" />
                  <span className="text-2xs text-text-tertiary">
                    {new Date(item.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 h-px bg-bg-border" />
                </div>
              )}

              <div className="flex gap-3 py-2.5 group">
                {/* Type indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    item.type === 'prompt' ? 'bg-accent/70' :
                    item.type === 'log' ? 'bg-blue-500/70' :
                    item.type === 'decision' ? 'bg-purple-500/70' :
                    'bg-orange-500/70'
                  }`} />
                  {idx < items.length - 1 && <div className="w-px flex-1 bg-bg-border mt-1" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  {item.type === 'prompt' && (() => {
                    const p = item.data as (typeof prompts)[0]
                    return (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs text-accent/60 font-mono mr-2">prompt</span>
                            <span className="text-text-primary text-sm">{p.title}</span>
                          </div>
                          <DateStamp date={p.createdAt} />
                        </div>
                        {(p.etap || p.node) && (
                          <div className="flex items-center gap-2 mt-1">
                            {p.etap && <span className="font-mono text-2xs text-text-tertiary bg-bg-surface border border-bg-border px-1.5 py-0.5 rounded">ETAP {p.etap}{p.subetap ? `.${p.subetap.replace(`${p.etap}.`, '')}` : ''}</span>}
                            {p.node && <span className="text-2xs text-text-tertiary">{p.node}</span>}
                            <span className={`text-2xs ml-auto ${p.status === 'completed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-text-tertiary'}`}>{p.status}</span>
                          </div>
                        )}
                        {p.executionSummary && (
                          <p className="text-text-tertiary text-xs mt-1 leading-relaxed line-clamp-2">{p.executionSummary}</p>
                        )}
                        {p.changedFileEntries.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {p.changedFileEntries.slice(0, 4).map((f, i) => (
                              <span key={i} className="flex items-center gap-1 font-mono text-2xs text-text-tertiary">
                                <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT[f.impactLevel]}`} />
                                {f.path.split('/').slice(-1)[0]}
                              </span>
                            ))}
                            {p.changedFileEntries.length > 4 && (
                              <span className="text-2xs text-text-tertiary">+{p.changedFileEntries.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {item.type === 'log' && (() => {
                    const l = item.data as (typeof logs)[0]
                    return (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs text-blue-400/60 font-mono mr-2">log</span>
                            <span className="text-text-primary text-sm">{l.title}</span>
                          </div>
                          <DateStamp date={l.createdAt} />
                        </div>
                        {l.nodes.length > 0 && (
                          <span className="text-2xs text-text-tertiary mt-1 block">→ {l.nodes[0].node.title}</span>
                        )}
                        {l.summary && (
                          <p className="text-text-tertiary text-xs mt-1 leading-relaxed line-clamp-2">{l.summary}</p>
                        )}
                      </div>
                    )
                  })()}

                  {item.type === 'decision' && (() => {
                    const d = item.data as (typeof decisions)[0]
                    return (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs text-purple-400/60 font-mono mr-2">decision</span>
                            <span className="text-text-primary text-sm">{d.title}</span>
                          </div>
                          <DateStamp date={d.createdAt} />
                        </div>
                        <p className="text-text-tertiary text-xs mt-1 leading-relaxed line-clamp-2">{d.decision}</p>
                      </div>
                    )
                  })()}

                  {item.type === 'warning' && (() => {
                    const w = item.data as (typeof warnings)[0]
                    return (
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs text-orange-400/60 font-mono mr-2">warning</span>
                            <span className={`text-sm ${SEVERITY_COLOR[w.severity]}`}>{w.title}</span>
                          </div>
                          <DateStamp date={w.createdAt} />
                        </div>
                        <span className="text-2xs text-text-tertiary mt-1 block">{TYPE_LABEL[w.type] ?? w.type}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="text-center py-16 text-text-tertiary text-sm">
            No events yet. Start by logging an execution.
          </div>
        )}
      </div>
    </div>
  )
}
