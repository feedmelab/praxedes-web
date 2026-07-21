import { prisma } from '@/lib/prisma'
import { PageHeader, ButtonLink } from '../_components/ui'
import { RENTAL_CATEGORIES } from '../projects/labels'
import type { RentalImage } from './actions'
import RentalList from './RentalList'

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
        <>
          <p className="mb-3 text-[11px] text-muted">Arrastra para reordenar.</p>
          <RentalList
            items={items.map((item) => {
              const images = (item.images as unknown as RentalImage[]) ?? []
              return {
                id: item.id,
                nameEs: item.nameEs,
                meta: `${RENTAL_CATEGORIES[item.category]} · ${images.length} img`,
                available: item.available,
              }
            })}
          />
        </>
      )}
    </div>
  )
}
