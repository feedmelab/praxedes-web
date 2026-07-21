'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/projects', label: 'Proyectos' },
  { href: '/admin/rental', label: 'Alquiler' },
  { href: '/admin/settings', label: 'Ajustes' },
  { href: '/admin/account', label: 'Cuenta' },
]

export default function AdminNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/admin"
          className="shrink-0 font-display text-lg italic tracking-wide text-accent"
        >
          Práxedes
        </Link>

        <nav className="flex flex-1 items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-[11px] uppercase tracking-[0.2em] transition-colors',
                isActive(l.href) ? 'text-accent' : 'text-muted hover:text-light'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-light"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
