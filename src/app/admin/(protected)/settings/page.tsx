import { prisma } from '@/lib/prisma'
import { PageHeader, Card } from '../_components/ui'
import SettingsForm from './SettingsForm'
import HeroVideoUpload from './HeroVideoUpload'
import AboutMediaManager from './AboutMediaManager'
import { listHeroVideos } from './actions'
import { listAboutMedia } from '@/lib/about-media'

export const metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const [settings, videos, aboutItems] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
    listHeroVideos(),
    listAboutMedia(),
  ])

  return (
    <div className="space-y-10">
      <PageHeader title="Ajustes del sitio" />
      <SettingsForm settings={settings ?? {}} />
      <Card>
        <AboutMediaManager items={aboutItems} />
      </Card>
      <HeroVideoUpload current={settings?.reelMp4Url} videos={videos} />
    </div>
  )
}
