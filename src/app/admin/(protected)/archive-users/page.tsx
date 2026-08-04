import { prisma } from '@/lib/prisma'
import { PageHeader } from '../_components/ui'
import ArchiveUsersManager, { type ArchiveUserVM } from './Manager'

export const metadata = { title: 'Accesos al archivo' }

export default async function ArchiveUsersPage() {
  const rows = await prisma.archiveUser.findMany({ orderBy: { createdAt: 'desc' } })
  const users: ArchiveUserVM[] = rows.map(
    (u: { id: string; email: string; name: string | null; active: boolean; createdAt: Date }) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      active: u.active,
      createdAt: u.createdAt.toISOString(),
    })
  )

  return (
    <div className="space-y-8">
      <PageHeader title="Accesos al archivo" back={{ href: '/admin', label: 'Panel' }} />
      <p className="text-[13px] text-soft">
        Cuentas con acceso privado al Archivo (login por email y contraseña en la web pública). Da
        de alta a cada cliente y actívalo/desactívalo cuando quieras.
      </p>
      <ArchiveUsersManager users={users} />
    </div>
  )
}
