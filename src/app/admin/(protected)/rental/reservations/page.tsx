import { prisma } from '@/lib/prisma'
import { PageHeader } from '../../_components/ui'
import ReservationsManager from './ReservationsManager'

export const metadata = { title: 'Reservas' }

export default async function ReservationsPage() {
  const [reservations, items] = await Promise.all([
    prisma.reservation.findMany({
      orderBy: { startDate: 'asc' },
      include: { item: { select: { nameEs: true } } },
    }),
    prisma.rentalItem.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, nameEs: true, stock: true },
    }),
  ])

  const data = reservations.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    itemName: r.item.nameEs,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    quantity: r.quantity,
    status: r.status,
    kind: r.kind,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }))

  const itemOptions = items.map((i) => ({ id: i.id, name: i.nameEs, stock: i.stock }))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reservas de alquiler"
        back={{ href: '/admin/rental', label: 'Alquiler' }}
      />
      <ReservationsManager reservations={data} items={itemOptions} />
    </div>
  )
}
