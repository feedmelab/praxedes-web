import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Panel' }

export default async function AdminDashboard() {
  const [projectsTotal, projectsPublished, rentalTotal, rentalAvailable, pendingReservations] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),
      prisma.rentalItem.count(),
      prisma.rentalItem.count({ where: { available: true } }),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
    ])

  const stats = [
    {
      label: 'Proyectos',
      value: projectsTotal,
      hint: `${projectsPublished} publicados`,
      href: '/admin/projects',
    },
    {
      label: 'Archivo',
      value: rentalTotal,
      hint: `${rentalAvailable} disponibles`,
      href: '/admin/rental',
    },
    {
      label: 'Solicitudes',
      value: pendingReservations,
      hint: 'pendientes de confirmar',
      href: '/admin/rental/reservations?tab=requests',
    },
    {
      label: 'Ajustes del sitio',
      value: '·',
      hint: 'reel, bio, contacto',
      href: '/admin/settings',
    },
    {
      label: 'Biblioteca Vimeo',
      value: '·',
      hint: 'IDs y hash para frames',
      href: '/admin/vimeo',
    },
  ]

  return (
    <div>
      <h1 className="mb-10 font-display text-3xl tracking-wide text-light">
        Panel de administración
      </h1>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded border border-border bg-surface p-5 transition-colors hover:border-accent/50"
          >
            <p className="font-display text-3xl text-light">{s.value}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-light">{s.label}</p>
            <p className="mt-1 text-[11px] text-muted transition-colors group-hover:text-accent">
              {s.hint}
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}
