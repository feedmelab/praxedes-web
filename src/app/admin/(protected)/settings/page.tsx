import { prisma } from '@/lib/prisma'
import { PageHeader } from '../_components/ui'
import SettingsForm from './SettingsForm'
import HeroVideoUpload from './HeroVideoUpload'

export const metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })

  return (
    <div className="space-y-10">
      <PageHeader title="Ajustes del sitio" />
      <HeroVideoUpload current={settings?.reelMp4Url} />
      <SettingsForm settings={settings ?? {}} />
    </div>
  )
}
