import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-500',
  low: 'bg-neutral-600',
}

function RelTime({ date }: { date: Date }) {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return <span>just now</span>
  if (hours < 1) return <span>{mins}m ago</span>
  if (days < 1) return <span>{hours}h ago</span>
  if (days < 7) return <span>{days}d ago</span>
  return <span>{new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
}

export default async function DashboardPage() {
  const [
    promptCount, logCount, warningCount, nodeCount, principleCount,
    recentPrompts, recentLogs, recentWarnings, recentDecisions,
    activeWarnings, doneNodes, totalNodes,
  ] = await Promise.all([
    db.promptExecution.count({ where: { status: 'completed' } }),
    db.executionLog.count(),
    db.architectureWarning.count({ where: { resolved: false } }),
    db.roadmapNode.count(),
    db.canonicalPrinciple.count(),
    db.promptExecution.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, status: true, etap: true, createdAt: true } }),
    db.executionLog.findMany({ orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, createdAt: true } }),
    db.architectureWarning.findMany({ where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, severity: true, createdAt: true } }),
    db.decision.findMany({ orderBy: { createdAt: 'desc' }, take: 2, select: { id: true, title: true, createdAt: true } }),
    db.architectureWarning.count({ where: { resolved: false } }),
    db.roadmapNode.count({ where: { status: 'done' } }),
    db.roadmapNode.count(),
  ])

  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Merge recent activity
  type ActivityItem =
    | { kind: 'prompt'; id: string; title: string; status: string; etap: string | null; date: Date }
    | { kind: 'log'; id: string; title: string; date: Date }
    | { kind: 'warning'; id: string; title: string; severity: string; date: Date }
    | { kind: 'decision'; id: string; title: string; date: Date }

  const activity: ActivityItem[] = [
    ...recentPrompts.map((p) => ({ kind: 'prompt' as const, id: p.id, title: p.title, status: p.status, etap: p.etap, date: p.createdAt })),
    ...recentLogs.map((l) => ({ kind: 'log' as const, id: l.id, title: l.title, date: l.createdAt })),
    ...recentWarnings.map((w) => ({ kind: 'warning' as const, id: w.id, title: w.title, severity: w.severity, date: w.createdAt })),
    ...recentDecisions.map((d) => ({ kind: 'decision' as const, id: d.id, title: d.title, date: d.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  return (
    <div className="min-h-full px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-xl font-semibold">PMOS</h1>
            <p className="text-text-tertiary text-sm mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/prompts/new" className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white text-sm rounded-md hover:bg-accent/90 transition-colors">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Log execution
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {([
          ['Nodes', `${doneNodes}/${totalNodes}`, 'done'],
          ['Warnings', activeWarnings, warningCount > 0 ? 'text-orange-400' : ''],
          ['Prompts', promptCount, 'completed'],
          ['Principles', principleCount, ''],
          ['Logs', logCount, ''],
        ] as const).map(([label, value, sub]) => (
          <div key={label} className="bg-bg-surface border border-bg-border rounded-lg px-4 py-3">
            <div className="text-text-tertiary text-2xs mb-1">{label}</div>
            <div className={`text-text-primary text-lg font-semibold ${sub === 'text-orange-400' && Number(value) > 0 ? 'text-orange-400' : ''}`}>{value}</div>
            {sub && sub !== 'text-orange-400' && <div className="text-text-tertiary text-2xs">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-secondary text-xs font-medium uppercase tracking-wider">Recent Activity</h2>
          <Link href="/timeline" className="text-2xs text-accent hover:underline">View all →</Link>
        </div>

        <div className="space-y-0">
          {activity.map((item, i) => (
            <div key={`${item.kind}-${item.id}`} className="flex items-start gap-3 py-2.5 group">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                item.kind === 'prompt' ? 'bg-accent/70' :
                item.kind === 'log' ? 'bg-blue-500/70' :
                item.kind === 'decision' ? 'bg-purple-500/70' :
                SEVERITY_DOT[item.kind === 'warning' ? item.severity : ''] ?? 'bg-orange-500/70'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xs text-text-tertiary font-mono flex-shrink-0">{item.kind}</span>
                    <Link
                      href={item.kind === 'prompt' ? '/prompts' : item.kind === 'log' ? '/logs' : item.kind === 'warning' ? '/warnings' : '/decisions'}
                      className="text-text-primary text-sm truncate hover:text-accent transition-colors"
                    >
                      {item.title}
                    </Link>
                  </div>
                  <time className="text-2xs text-text-tertiary flex-shrink-0">
                    <RelTime date={item.date} />
                  </time>
                </div>
                {item.kind === 'prompt' && item.etap && (
                  <span className="text-2xs text-text-tertiary font-mono">ETAP {item.etap}</span>
                )}
                {item.kind === 'warning' && (
                  <span className={`text-2xs font-mono ${SEVERITY_DOT[item.severity] ? '' : ''}`}
                    style={{ color: item.severity === 'critical' ? '#f87171' : item.severity === 'high' ? '#fb923c' : '#a3a3a3' }}
                  >
                    {item.severity}
                  </span>
                )}
              </div>
            </div>
          ))}

          {activity.length === 0 && (
            <p className="text-text-tertiary text-sm py-4">No activity yet. <Link href="/prompts/new" className="text-accent hover:underline">Log your first execution.</Link></p>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="border-t border-bg-border pt-6">
        <h2 className="text-text-tertiary text-2xs font-medium uppercase tracking-wider mb-3">Keyboard shortcuts</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            ['/', 'search'],
            ['n', 'new log'],
            ['r', 'roadmap'],
            ['t', 'timeline'],
            ['p', 'prompts'],
            ['d', 'decisions'],
            ['w', 'warnings'],
            ['⌘K', 'search'],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-2 text-2xs text-text-tertiary">
              <kbd className="border border-bg-border rounded px-1.5 py-0.5 font-mono text-text-secondary">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
