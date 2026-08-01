import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { focalClass, type Focal } from '@/lib/focal'

type Props = {
  slug: string
  client: string
  title: string
  meta: string
  coverImage?: string | null
  coverFocal?: Focal | null
  /** La portada es un fotograma con franjas negras → recortar en la tarjeta. */
  letterbox?: boolean
  /** Índice para variar el placeholder cuando no hay portada. */
  index?: number
}

const PLACEHOLDERS = [
  'linear-gradient(135deg,#1a1714,#2a2118 60%,#0e0d0c)',
  'linear-gradient(135deg,#141a1c,#1c2a2a 60%,#0c0e0e)',
  'linear-gradient(135deg,#1c1418,#2a1c24 60%,#0e0c0d)',
  'linear-gradient(135deg,#181a14,#242a1a 60%,#0d0e0c)',
]

export default function ProjectCard({
  slug,
  client,
  title,
  meta,
  coverImage,
  coverFocal,
  letterbox = false,
  index = 0,
}: Props) {
  return (
    <Link
      href={{ pathname: '/projects/[slug]', params: { slug } }}
      className="group relative block aspect-[16/10] overflow-hidden border border-border bg-surface"
    >
      {coverImage ? (
        <Image
          src={coverImage}
          alt={`${client} — ${title}`}
          fill
          sizes="(max-width: 760px) 100vw, 50vw"
          // `letterbox`: la portada es un fotograma con franjas negras → se
          // amplía un poco para recortarlas SOLO en la tarjeta del listado.
          className={`object-cover ${focalClass(coverFocal)} brightness-[0.72] grayscale-[0.35] transition-all duration-[1100ms] ease-out-expo group-hover:brightness-[0.85] group-hover:grayscale-0 ${
            letterbox ? 'scale-[1.26] group-hover:scale-[1.32]' : 'group-hover:scale-105'
          }`}
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-[1100ms] ease-out-expo group-hover:scale-105"
          style={{ background: PLACEHOLDERS[index % PLACEHOLDERS.length] }}
        />
      )}

      <div className="absolute inset-0 z-[2] flex flex-col justify-end bg-gradient-to-t from-bg/70 to-transparent to-55% p-5 sm:p-8">
        <div className="translate-y-2 text-[0.68rem] uppercase tracking-[0.24em] text-accent opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          {client}
        </div>
        <div className="mt-1 translate-y-2 font-display text-[clamp(1.3rem,2.5vw,1.9rem)] font-normal opacity-85 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          {title}
        </div>
        <div className="mt-2 translate-y-2 text-[0.66rem] uppercase tracking-[0.15em] text-soft opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
          {meta}
        </div>
      </div>
    </Link>
  )
}
