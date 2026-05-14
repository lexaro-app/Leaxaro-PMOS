'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type SearchResult = {
  id: string
  label: string
  sublabel?: string
  href: string
  type: 'roadmap' | 'log' | 'prompt' | 'decision' | 'warning' | 'principle' | 'file'
  badge?: string
  badgeColor?: string
}

type RawResults = {
  roadmap: { id: string; title: string; status: string; scope: string }[]
  logs: { id: string; title: string; createdAt: string }[]
  prompts: { id: string; title: string; status: string; etap: string | null; subetap: string | null }[]
  decisions: { id: string; title: string; decision: string }[]
  warnings: { id: string; title: string; severity: string; resolved: boolean }[]
  principles: { id: string; title: string; priority: string }[]
  files: { id: string; path: string; changeType: string; impactLevel: string }[]
}

const TYPE_META: Record<SearchResult['type'], { label: string; color: string; dot: string }> = {
  roadmap:   { label: 'Roadmap',   color: 'text-text-tertiary',   dot: 'bg-neutral-600' },
  log:       { label: 'Log',       color: 'text-blue-400/70',     dot: 'bg-blue-500/70' },
  prompt:    { label: 'Prompt',    color: 'text-accent/70',       dot: 'bg-accent/70' },
  decision:  { label: 'Decision',  color: 'text-purple-400/70',   dot: 'bg-purple-500/70' },
  warning:   { label: 'Warning',   color: 'text-orange-400/70',   dot: 'bg-orange-500/70' },
  principle: { label: 'Principle', color: 'text-green-400/70',    dot: 'bg-green-500/70' },
  file:      { label: 'File',      color: 'text-text-tertiary',   dot: 'bg-neutral-700' },
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-neutral-500',
}

function toFlat(raw: RawResults): SearchResult[] {
  return [
    ...raw.roadmap.map((r) => ({
      id: r.id, label: r.title, href: '/roadmap',
      type: 'roadmap' as const,
      badge: r.status, badgeColor: 'text-text-tertiary',
    })),
    ...raw.logs.map((r) => ({
      id: r.id, label: r.title, href: '/logs',
      type: 'log' as const,
    })),
    ...raw.prompts.map((r) => ({
      id: r.id, label: r.title, href: '/prompts',
      type: 'prompt' as const,
      badge: r.etap ? `ETAP ${r.etap}` : undefined,
    })),
    ...raw.decisions.map((r) => ({
      id: r.id, label: r.title,
      sublabel: r.decision.slice(0, 60) + (r.decision.length > 60 ? '…' : ''),
      href: '/decisions', type: 'decision' as const,
    })),
    ...raw.warnings.map((r) => ({
      id: r.id, label: r.title, href: '/warnings',
      type: 'warning' as const,
      badge: r.severity, badgeColor: SEVERITY_COLOR[r.severity],
    })),
    ...raw.principles.map((r) => ({
      id: r.id, label: r.title, href: '/principles',
      type: 'principle' as const,
      badge: `P${r.priority}`,
    })),
    ...raw.files.map((r) => ({
      id: r.id, label: r.path.split('/').slice(-1)[0],
      sublabel: r.path,
      href: '/changed-files', type: 'file' as const,
      badge: r.impactLevel,
    })),
  ]
}

function groupBy(results: SearchResult[]): [string, SearchResult[]][] {
  const groups = new Map<string, SearchResult[]>()
  for (const r of results) {
    const key = TYPE_META[r.type].label
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return Array.from(groups.entries())
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [raw, setRaw] = useState<RawResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const flat = useMemo(() => (raw ? toFlat(raw) : []), [raw])

  const openSearch = useCallback(() => {
    setOpen(true)
    setQuery('')
    setRaw(null)
    setSelectedIndex(0)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
    setRaw(null)
  }, [])

  const navigate = useCallback((href: string) => {
    router.push(href)
    closeSearch()
  }, [router, closeSearch])

  // Listen for sidebar search button
  useEffect(() => {
    const onOpen = () => openSearch()
    document.addEventListener('pmos:open-search', onOpen)
    return () => document.removeEventListener('pmos:open-search', onOpen)
  }, [openSearch])

  // Global keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'

      // Cmd+K always opens search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeSearch() : openSearch()
        return
      }

      if (open) {
        if (e.key === 'Escape') { closeSearch(); return }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, flat.length - 1))
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          return
        }
        if (e.key === 'Enter' && flat[selectedIndex]) {
          navigate(flat[selectedIndex].href)
          return
        }
        return
      }

      // Navigation shortcuts — only when not in input
      if (!inInput) {
        if (e.key === '/') { e.preventDefault(); openSearch(); return }
        if (e.key === 'n') { router.push('/prompts/new'); return }
        if (e.key === 'r') { router.push('/roadmap'); return }
        if (e.key === 't') { router.push('/timeline'); return }
        if (e.key === 'p') { router.push('/prompts'); return }
        if (e.key === 'd') { router.push('/decisions'); return }
        if (e.key === 'w') { router.push('/warnings'); return }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, flat, selectedIndex, navigate, openSearch, closeSearch, router])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setRaw(null); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setRaw(data)
        setSelectedIndex(0)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  const groups = useMemo(() => groupBy(flat), [flat])
  const hasResults = flat.length > 0

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={closeSearch}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-bg-surface border border-bg-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-bg-border">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-tertiary flex-shrink-0">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roadmap, logs, prompts, decisions, files…"
            className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-tertiary outline-none"
          />
          {loading && (
            <div className="w-3.5 h-3.5 border border-accent/50 border-t-accent rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="text-text-tertiary text-2xs border border-bg-border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-80 overflow-y-auto py-2">
            {groups.map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-2xs text-text-tertiary font-medium uppercase tracking-wider">
                  {group}
                </div>
                {items.map((item) => {
                  const globalIdx = flat.indexOf(item)
                  const isSelected = globalIdx === selectedIndex
                  const meta = TYPE_META[item.type]
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-bg-elevated'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary text-sm truncate">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-text-tertiary text-2xs truncate font-mono">{item.sublabel}</div>
                        )}
                      </div>
                      {item.badge && (
                        <span className={`text-2xs font-mono flex-shrink-0 ${item.badgeColor ?? 'text-text-tertiary'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && !hasResults && (
          <div className="px-4 py-8 text-center text-text-tertiary text-sm">
            No results for <span className="text-text-secondary">"{query}"</span>
          </div>
        )}

        {/* Footer shortcuts */}
        {!hasResults && query.length < 2 && (
          <div className="px-4 py-3 border-t border-bg-border flex items-center gap-5 flex-wrap">
            {[
              ['n', 'new log'],
              ['r', 'roadmap'],
              ['t', 'timeline'],
              ['p', 'prompts'],
              ['d', 'decisions'],
              ['w', 'warnings'],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1.5 text-2xs text-text-tertiary">
                <kbd className="border border-bg-border rounded px-1.5 py-0.5 font-mono">{key}</kbd>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
