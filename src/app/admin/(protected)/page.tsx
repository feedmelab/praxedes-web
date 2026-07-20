import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SignOutButton from './SignOutButton'

export const metadata = { title: 'Panel' }

export default async function AdminDashboard() {
  const session = await auth()

  const [projectsTotal, projectsPublished, rentalTotal, rentalAvailable, imagesTotal, framesTotal] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),
      prisma.rentalItem.count(),
      prisma.rentalItem.count({ where: { available: true } }),
      prisma.projectImage.count(),
      prisma.videoFrame.count(),
    ])

  const stats = [
    { label: 'Proyectos', value: projectsTotal, hint: `${projectsPublished} publicados` },
    { label: 'Alquiler', value: rentalTotal, hint: `${rentalAvailable} disponibles` },
    { label: 'Imágenes', value: imagesTotal, hint: 'en proyectos' },
    { label: 'Frames de vídeo', value: framesTotal, hint: 'documentados' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-accent">
            Panel de administración
          </h1>
          <p className="mt-2 text-xs uppercase tracking-wider text-muted">
            {session?.user?.name ?? session?.user?.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded border border-border bg-surface p-5">
            <p className="font-display text-3xl text-light">{s.value}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-light">{s.label}</p>
            <p className="mt-1 text-[11px] text-muted">{s.hint}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
