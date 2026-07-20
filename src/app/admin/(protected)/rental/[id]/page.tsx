import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getThumbUrl } from '@/lib/imagekit'
import { PageHeader, Card } from '../../_components/ui'
import RentalForm from '../RentalForm'
import RentalActions from './RentalActions'
import RentalImageManager from './RentalImageManager'
import { updateRentalItem, type RentalImage } from '../actions'

export const metadata = { title: 'Editar pieza' }

export default async function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await prisma.rentalItem.findUnique({ where: { id } })
  if (!item) notFound()

  async function action(_prev: { error?: string; ok?: boolean } | null, fd: FormData) {
    'use server'
    return updateRentalItem(id, fd)
  }

  const rawImages = (item.images as unknown as RentalImage[]) ?? []
  const images = rawImages.map((img) => ({
    fileId: img.fileId,
    thumb: getThumbUrl(img.url, 400),
  }))

  return (
    <div className="space-y-10">
      <PageHeader title={item.nameEs} back={{ href: '/admin/rental', label: 'Alquiler' }}>
        <RentalActions id={item.id} available={item.available} />
      </PageHeader>

      <Card>
        <h2 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">Datos</h2>
        <RentalForm
          action={action}
          submitLabel="Guardar cambios"
          defaults={{
            nameEs: item.nameEs,
            nameEn: item.nameEn,
            descEs: item.descEs,
            descEn: item.descEn,
            category: item.category,
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">
          Imágenes ({images.length})
        </h2>
        <RentalImageManager id={item.id} images={images} />
      </Card>
    </div>
  )
}
