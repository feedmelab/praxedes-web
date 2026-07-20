import { prisma } from '@/lib/prisma'
import { PageHeader, Card } from '../_components/ui'
import SettingsForm from './SettingsForm'

export const metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })

  return (
    <div>
      <PageHeader title="Ajustes del sitio" />
      <Card>
        <SettingsForm settings={settings ?? {}} />
      </Card>
    </div>
  )
}
