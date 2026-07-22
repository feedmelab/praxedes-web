import Image from 'next/image'
import Reveal from './Reveal'

type Img = {
  id: string
  url: string
  altEs: string | null
  altEn: string | null
  width: number
  height: number
}

// Galería de imágenes fijas del proyecto. La primera ocupa el ancho completo.
export default function ProjectGallery({ images, locale }: { images: Img[]; locale: 'es' | 'en' }) {
  if (images.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-6">
      {images.map((img, i) => {
        const alt = (locale === 'en' ? img.altEn : img.altEs) ?? ''
        const wide = i === 0
        return (
          <Reveal
            key={img.id}
            delay={(i % 2) * 60}
            className={`relative overflow-hidden border border-border ${
              wide ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/5]'
            }`}
          >
            <Image
              src={img.url}
              alt={alt}
              fill
              sizes={wide ? '100vw' : '(max-width: 640px) 100vw, 50vw'}
              className="object-cover brightness-[0.85] transition-all duration-700 ease-out-expo hover:scale-[1.03] hover:brightness-100"
            />
          </Reveal>
        )
      })}
    </div>
  )
}
