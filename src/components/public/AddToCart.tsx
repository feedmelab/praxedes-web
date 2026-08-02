'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from './CartContext'

// Añade la prenda al carrito (con cantidad). Las fechas se eligen luego, una vez
// para toda la petición, en el carrito/checkout.
export default function AddToCart({
  itemId,
  nameEs,
  nameEn,
  image,
  stock,
}: {
  itemId: string
  nameEs: string
  nameEn: string
  image: string | null
  stock: number
}) {
  const t = useTranslations('cart')
  const { add, has } = useCart()
  const [qty, setQty] = useState(1)
  const inCart = has(itemId)

  return (
    <div className="border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <label className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">{t('qty')}</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-8 w-8 border border-border text-light transition-colors hover:border-accent"
            aria-label="-"
          >
            −
          </button>
          <span className="w-8 text-center text-sm tabular-nums text-light">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="h-8 w-8 border border-border text-light transition-colors hover:border-accent disabled:opacity-40"
            disabled={qty >= stock}
            aria-label="+"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => add({ itemId, nameEs, nameEn, image, stock }, qty)}
        className="mt-5 w-full bg-accent px-5 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-bg transition-opacity hover:opacity-90"
      >
        {inCart ? t('addMore') : t('add')}
      </button>

      {inCart && (
        <Link
          href="/rental/cart"
          className="mt-3 block text-center text-[0.66rem] uppercase tracking-[0.16em] text-accent transition-colors hover:text-light"
        >
          {t('goToCart')} →
        </Link>
      )}
    </div>
  )
}
