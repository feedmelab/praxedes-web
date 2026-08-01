import { PageHeader, Card } from '../_components/ui'
import { listVimeoVideos, VimeoError, type VimeoListItem } from '@/lib/vimeo'
import VimeoLibrary from './VimeoLibrary'

export const metadata = { title: 'Vimeo' }

export default async function VimeoPage() {
  let items: VimeoListItem[] = []
  let error: string | null = null
  try {
    items = await listVimeoVideos()
  } catch (e) {
    error = e instanceof VimeoError ? e.message : 'No se pudieron cargar los vídeos de Vimeo.'
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Biblioteca de Vimeo" back={{ href: '/admin', label: 'Panel' }} />

      <Card>
        <p className="text-[13px] leading-relaxed text-soft">
          Vídeos de la cuenta de Vimeo (según el token{' '}
          <code className="text-light">VIMEO_ACCESS_TOKEN</code>). Copia el parámetro de cada vídeo
          — es <code className="text-light">ID</code> o{' '}
          <code className="text-light">ID?h=hash</code> para vídeos «no listados» — y pégalo en el
          campo de Vimeo del proyecto para usar el extractor de fotogramas, o en el reel de Ajustes.
        </p>
      </Card>

      {error ? (
        <Card>
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-2 text-[12px] text-muted">
            Comprueba que <code className="text-light">VIMEO_ACCESS_TOKEN</code> está en el entorno
            (local y Vercel) y que el token tiene permiso de lectura (scope público/privado) sobre
            la cuenta.
          </p>
        </Card>
      ) : (
        <VimeoLibrary items={items} />
      )}
    </div>
  )
}
