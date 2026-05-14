'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    label: 'Roadmap',
    href: '/roadmap',
    shortcut: 'r',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Execution Logs',
    href: '/logs',
    shortcut: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Decisions',
    href: '/decisions',
    shortcut: 'd',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 14H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="12" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Warnings',
    href: '/warnings',
    shortcut: 'w',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3L14 13H2L8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Prompts',
    href: '/prompts',
    shortcut: 'p',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h9M2 8h6M2 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 7l3 2-3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Principles',
    href: '/principles',
    shortcut: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Timeline',
    href: '/timeline',
    shortcut: 't',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="4" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 5h5M7 8h4M7 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Changed Files',
    href: '/changed-files',
    shortcut: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9H3V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 8.5h4M6 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 border-r border-bg-border flex flex-col">
      {/* Logo + home link */}
      <div className="px-5 py-5 border-b border-bg-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xs font-semibold leading-none">P</span>
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium leading-tight group-hover:text-accent transition-colors">PMOS</p>
            <p className="text-text-tertiary text-2xs leading-tight">Leaxaro</p>
          </div>
        </Link>
      </div>

      {/* Search button */}
      <div className="px-3 pt-3 pb-1">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent('pmos:open-search'))}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-text-tertiary text-sm bg-bg-surface border border-bg-border hover:border-accent/40 hover:text-text-secondary transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Search</span>
          <kbd className="text-2xs border border-bg-border rounded px-1 font-mono">/</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const shortcut = (item as { shortcut?: string | null }).shortcut
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors group
                ${active
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {shortcut && (
                <kbd className={`text-2xs font-mono opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-accent/60' : 'text-text-tertiary'}`}>
                  {shortcut}
                </kbd>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-bg-border">
        <p className="text-text-tertiary text-2xs">Project Memory OS</p>
        <p className="text-text-tertiary text-2xs">ETAP 6.5 complete</p>
      </div>
    </aside>
  )
}
