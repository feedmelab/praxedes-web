import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PageHeader, ButtonLink, Badge } from '../_components/ui'
import { RENTAL_CATEGORIES } from '../projects/labels'
import type { RentalImage } from './actions'

export const metadata = { title: 'Alquiler' }

export default async function RentalPage() {
  const items = await prisma.rentalItem.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div>
      <PageHeader title="Alquiler">
        <ButtonLink href="/admin/rental/new" variant="solid">
          + Nuevo
        </ButtonLink>
      </PageHeader>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay piezas de alquiler.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded border border-border">
          {items.map((item) => {
            const images = (item.images as unknown as RentalImage[]) ?? []
            return (
              <li key={item.id}>
                <Link
                  href={`/admin/rental/${item.id}`}
                  className="flex items-center gap-4 bg-surface px-5 py-4 transition-colors hover:bg-border/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-light">{item.nameEs}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">
                      {RENTAL_CATEGORIES[item.category]} · {images.length} img
                    </p>
                  </div>
                  <Badge tone={item.available ? 'green' : 'muted'}>
                    {item.available ? 'Disponible' : 'No disponible'}
                  </Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
