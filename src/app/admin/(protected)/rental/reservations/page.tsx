import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '../../_components/ui'
import ReservationsManager from './ReservationsManager'

export const metadata = { title: 'Reservas' }

const PAGE_SIZE = 15
const TABS = ['requests', 'upcoming', 'past', 'cancelled'] as const
type Tab = (typeof TABS)[number]

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const sp = await searchParams
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '') ? (sp.tab as Tab) : 'requests'
  const page = Math.max(1, Number(sp.page) || 1)

  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  // Filtro por pestaña.
  const where: Prisma.ReservationWhereInput =
    tab === 'requests'
      ? { status: 'PENDING' }
      : tab === 'cancelled'
        ? { status: 'CANCELLED' }
        : tab === 'upcoming'
          ? { status: 'CONFIRMED', endDate: { gte: todayStart } }
          : { status: 'CONFIRMED', endDate: { lt: todayStart } }

  const orderBy: Prisma.ReservationOrderByWithRelationInput =
    tab === 'requests' ? { createdAt: 'desc' } : { startDate: 'asc' }

  const [total, rows, items, pendingCount] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy,
      include: { item: { select: { nameEs: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.rentalItem.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, nameEs: true, stock: true },
    }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const data = rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    itemName: r.item.nameEs,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    quantity: r.quantity,
    status: r.status,
    kind: r.kind,
    groupId: r.groupId,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }))

  const itemOptions = items.map((i) => ({ id: i.id, name: i.nameEs, stock: i.stock }))

  return (
    <div className="space-y-8">
      <PageHeader title="Reservas del archivo" back={{ href: '/admin/rental', label: 'Archivo' }} />
      <ReservationsManager
        reservations={data}
        items={itemOptions}
        tab={tab}
        page={page}
        totalPages={totalPages}
        pendingCount={pendingCount}
      />
    </div>
  )
}
