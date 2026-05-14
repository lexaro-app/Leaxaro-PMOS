'use client'

import { useState, useMemo } from 'react'
import { RoadmapTree } from '@/components/roadmap/RoadmapTree'

type Tag = { tag: { id: string; name: string } }
type Count = { logs: number; decisions: number }

export type NodeWithChildren = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  order: number
  sortKey: string
  scope: string
  tags: Tag[]
  _count: Count
  children: NodeWithChildren[]
}

type Mode = 'active' | 'strategic' | 'all'
type StatusFilter = 'all' | 'in_progress' | 'backlog' | 'done' | 'blocked'

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All statuses',
  in_progress: 'In progress',
  backlog: 'Backlog',
  done: 'Done',
  blocked: 'Blocked',
}

export function RoadmapView({ nodes }: { nodes: NodeWithChildren[] }) {
  const [mode, setMode] = useState<Mode>('active')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')

  // All unique tags across root-level nodes
  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const n of nodes) {
      for (const t of n.tags) set.add(t.tag.name)
    }
    return Array.from(set).sort()
  }, [nodes])

  // Filtered + sorted nodes
  const visible = useMemo(() => {
    return nodes
      .filter((n) => {
        if (mode === 'active' && n.scope !== 'active') return false
        if (mode === 'strategic' && n.scope !== 'strategic_backlog') return false
        if (statusFilter !== 'all' && n.status !== statusFilter) return false
        if (tagFilter !== 'all' && !n.tags.some((t) => t.tag.name === tagFilter)) return false
        return true
      })
      .sort((a, b) => {
        // Use sortKey for semantic ordering (lexicographic = numeric because zero-padded)
        if (a.sortKey && b.sortKey) return a.sortKey.localeCompare(b.sortKey)
        return a.order - b.order
      })
  }, [nodes, mode, statusFilter, tagFilter])

  const doneCount = visible.filter((n) => n.status === 'done').length
  const activeCount = visible.filter((n) => n.status === 'in_progress').length

  const selectClass = 'bg-bg-surface border border-bg-border rounded px-2.5 py-1.5 text-text-secondary text-xs focus:outline-none focus:border-accent/50 cursor-pointer'

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-bg-surface border border-bg-border rounded-md p-1">
          {([['active', 'Active'], ['strategic', 'Strategic'], ['all', 'All']] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                mode === m
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
            {(Object.entries(STATUS_LABEL) as [StatusFilter, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {allTags.length > 0 && (
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className={selectClass}>
              <option value="all">All tags</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {/* Summary */}
          <span className="text-text-tertiary text-xs pl-1">
            {activeCount > 0 && <span className="text-yellow-400 font-medium">{activeCount} active</span>}
            {activeCount > 0 && doneCount > 0 && <span className="text-text-tertiary mx-1">·</span>}
            {doneCount > 0 && <span className="text-neutral-500">{doneCount} done</span>}
          </span>
        </div>
      </div>

      {/* Nodes */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary text-sm">
          No nodes match current filters.
        </div>
      ) : (
        <div className="space-y-0.5 mt-5">
          {visible.map((node) => (
            <RoadmapTree key={node.id} node={node} depth={0} />
          ))}
        </div>
      )}

      {/* Strategic backlog callout */}
      {mode === 'active' && nodes.some((n) => n.scope === 'strategic_backlog') && (
        <div className="mt-6 flex items-center gap-2 text-text-tertiary text-xs">
          <div className="flex-1 h-px bg-bg-border" />
          <button
            onClick={() => setMode('all')}
            className="hover:text-text-secondary transition-colors"
          >
            + {nodes.filter((n) => n.scope === 'strategic_backlog').length} strategic backlog ETAPs hidden
          </button>
          <div className="flex-1 h-px bg-bg-border" />
        </div>
      )}
    </>
  )
}
