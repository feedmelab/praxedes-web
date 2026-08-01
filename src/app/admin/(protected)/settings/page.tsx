import { prisma } from '@/lib/prisma'
import { PageHeader } from '../_components/ui'
import SettingsForm from './SettingsForm'
import HeroVideoUpload from './HeroVideoUpload'
import { listHeroVideos } from './actions'

export const metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const [settings, videos] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
    listHeroVideos(),
  ])

  return (
    <div className="space-y-10">
      <PageHeader title="Ajustes del sitio" />
      <HeroVideoUpload current={settings?.reelMp4Url} videos={videos} />
      <SettingsForm settings={settings ?? {}} />
    </div>
  )
}
