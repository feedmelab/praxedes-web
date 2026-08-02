'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import LanguageSwitch from './LanguageSwitch'
import { useNavSection } from './NavSection'
import CartLink from './CartLink'

const LINKS = [
  { href: '/commercials', key: 'commercials' },
  { href: '/film', key: 'film' },
  { href: '/gallery', key: 'gallery' },
  { href: '/rental', key: 'rental' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
] as const

export default function Nav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { override } = useNavSection()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Si una página fuerza sección (p. ej. el detalle de un proyecto indica su
  // categoría), se marca ese enlace; si no, según la ruta actual.
  const isActive = (href: string) =>
    override ? override === href : pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 transition-all duration-500 ease-out-expo sm:px-10 lg:px-16 ${
        scrolled ? 'border-b border-border bg-bg/70 py-4 backdrop-blur-md' : 'py-6'
      }`}
    >
      <Link
        href="/"
        className="whitespace-nowrap font-display text-[1.35rem] font-medium tracking-[0.02em]"
      >
        Práxedes de Vilallonga
      </Link>

      {/* Desktop */}
      <div className="hidden items-center gap-8 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            aria-current={isActive(l.href) ? 'page' : undefined}
            className={`underline-hover text-[0.7rem] uppercase tracking-[0.18em] transition-colors hover:text-light ${
              isActive(l.href) ? 'text-accent' : 'text-soft'
            }`}
          >
            {t(l.key)}
          </Link>
        ))}
        <CartLink />
        <LanguageSwitch />
      </div>

      {/* Mobile toggle */}
      <div className="flex items-center gap-5 md:hidden">
        <CartLink onClick={() => setOpen(false)} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-light"
          aria-label="Menú"
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-5 border-b border-border bg-bg/95 px-6 py-8 backdrop-blur-md md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`text-sm uppercase tracking-[0.18em] ${
                isActive(l.href) ? 'text-accent' : 'text-soft'
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
          <div className="pt-2">
            <LanguageSwitch />
          </div>
        </div>
      )}
    </nav>
  )
}
