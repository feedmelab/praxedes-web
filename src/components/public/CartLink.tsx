'use client'

import { Link } from '@/i18n/navigation'
import { useCart } from './CartContext'

// Enlace al carrito con el número de prendas. Se oculta si está vacío.
export default function CartLink({ onClick }: { onClick?: () => void }) {
  const { count } = useCart()
  if (count === 0) return null
  return (
    <Link
      href="/rental/cart"
      onClick={onClick}
      aria-label="Carrito"
      className="relative inline-flex items-center text-soft transition-colors hover:text-accent"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M2 2h3l2.4 12.3a1 1 0 0 0 1 .7h9.7a1 1 0 0 0 1-.8L21 6H6" />
      </svg>
      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-medium tabular-nums text-bg">
        {count}
      </span>
    </Link>
  )
}
