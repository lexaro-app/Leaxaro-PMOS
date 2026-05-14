'use client'

import { useState } from 'react'
import { RoadmapNode } from '@/components/roadmap/RoadmapNode'
import { STATUS_DOT } from '@/lib/constants'

type Tag = { tag: { id: string; name: string } }
type Count = { logs: number; decisions: number }

type NodeWithChildren = {
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

interface RoadmapTreeProps {
  node: NodeWithChildren
  depth: number
}

export function RoadmapTree({ node, depth }: RoadmapTreeProps) {
  // At root level (depth 0): collapse done ETAPs by default; expand in_progress by default
  const defaultExpanded = depth > 0
    ? true
    : node.status === 'in_progress' || node.status === 'blocked'

  const [expanded, setExpanded] = useState(defaultExpanded)

  const hasChildren = node.children.length > 0
  const isDone = node.status === 'done'
  const isStrategic = node.scope === 'strategic_backlog'

  return (
    <div>
      {/* Node row */}
      <div
        className={`
          group flex items-start gap-0 rounded hover:bg-bg-elevated transition-colors
          ${depth === 0 ? 'py-0.5' : ''}
          ${isDone && depth === 0 ? 'opacity-60' : ''}
        `}
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            flex-shrink-0 w-5 h-7 flex items-center justify-center
            text-text-tertiary hover:text-text-secondary transition-colors
            ${!hasChildren ? 'opacity-0 pointer-events-none' : ''}
          `}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          >
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Status dot */}
        <div className="flex-shrink-0 w-4 h-7 flex items-center justify-center">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[node.status] ?? 'bg-text-tertiary'}`} />
        </div>

        {/* Content */}
        <RoadmapNode node={node} depth={depth} />

        {/* Strategic badge — only at root */}
        {isStrategic && depth === 0 && (
          <span className="flex-shrink-0 self-center mr-2 text-2xs text-text-tertiary border border-bg-border rounded px-1.5 py-0.5 font-mono">
            strategic
          </span>
        )}
      </div>

      {/* Children — sorted by order */}
      {expanded && hasChildren && (
        <div>
          {[...node.children]
            .sort((a, b) => a.order - b.order)
            .map((child) => (
              <RoadmapTree key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  )
}
