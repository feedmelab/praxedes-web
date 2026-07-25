'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { RentalCategory } from '@prisma/client'

type Item = {
  id: string
  nameEs: string
  nameEn: string
  descEs: string | null
  descEn: string | null
  category: RentalCategory
  images: { url: string }[]
  soldOutNow?: boolean
}

const ORDER: RentalCategory[] = ['PERIOD', 'CONTEMPORARY', 'ACCESSORIES', 'PROPS', 'OTHER']

export default function RentalGrid({
  items,
  locale,
  labels,
}: {
  items: Item[]
  locale: 'es' | 'en'
  labels: Record<RentalCategory, string>
}) {
  const t = useTranslations('rental')
  const [filter, setFilter] = useState<RentalCategory | 'ALL'>('ALL')

  // Solo mostramos filtros de categorías que existen en el catálogo.
  const present = useMemo(() => ORDER.filter((c) => items.some((i) => i.category === c)), [items])
  const shown = filter === 'ALL' ? items : items.filter((i) => i.category === filter)

  const chip = (active: boolean) =>
    `px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] border transition-colors ${
      active
        ? 'border-accent text-accent'
        : 'border-border text-soft hover:border-accent hover:text-accent'
    }`

  return (
    <>
      {present.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2 lg:mb-14">
          <button type="button" onClick={() => setFilter('ALL')} className={chip(filter === 'ALL')}>
            {t('all')}
          </button>
          {present.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={chip(filter === c)}
            >
              {labels[c]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {shown.map((item) => {
          const name = locale === 'en' ? item.nameEn : item.nameEs
          const cover = item.images[0]?.url
          return (
            <Link
              key={item.id}
              href={{ pathname: '/rental/[id]', params: { id: item.id } }}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden border border-border bg-surface">
                {cover ? (
                  <Image
                    src={cover}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className={`object-cover transition-all duration-700 ease-out-expo group-hover:scale-[1.04] ${
                      item.soldOutNow
                        ? 'brightness-[0.45] grayscale'
                        : 'brightness-[0.85] group-hover:brightness-100'
                    }`}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(150deg,#1a1613,#241d14,#0e0c0b)' }}
                  />
                )}
                {item.soldOutNow && (
                  <span className="absolute left-2 top-2 z-[2] border border-light/30 bg-bg/80 px-2 py-1 text-[0.56rem] uppercase tracking-[0.14em] text-light backdrop-blur-sm">
                    {t('soldOut')}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-display text-lg transition-colors group-hover:text-accent">
                  {name}
                </span>
                <span className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                  {labels[item.category]}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
