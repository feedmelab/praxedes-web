// Seed de DEMOSTRACIÓN — contenido de ejemplo para ver la web llena.
//
//   npm run db:seed:demo
//
// Borra los proyectos y piezas de alquiler existentes (la "prueba fea") y
// carga un catálogo realista. NO sube imágenes: las tarjetas usan los
// degradados de la propia web. Cuando Práxedes suba fotos/vídeos reales por
// el panel, sustituyen a estos placeholders.
//
// Para volver a empezar limpio, vuelve a ejecutarlo (es idempotente: limpia
// antes de insertar).

import { PrismaClient, type ProjectCategory, type RentalCategory } from '@prisma/client'

const prisma = new PrismaClient()

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Foto de demo (Picsum, en gris para encajar con la estética editorial).
// DEMO: sustituir por imágenes reales subidas desde el panel.
function img(seed: string, w = 1600, h = 1000) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}?grayscale`
}

type ProjectSeed = {
  client: string
  category: ProjectCategory
  year: number
  titleEs: string
  titleEn: string
  descEs: string
  descEn: string
  featured?: boolean
}

const PROJECTS: ProjectSeed[] = [
  {
    client: 'Nike',
    category: 'COMMERCIALS',
    year: 2025,
    titleEs: 'Air Max — Campaña internacional',
    titleEn: 'Air Max — International Campaign',
    descEs:
      'Dirección de vestuario para la campaña internacional de Air Max, un ejercicio de contraste entre lo urbano y lo escultórico donde cada look se construye alrededor del movimiento.',
    descEn:
      'Costume direction for the international Air Max campaign, an exercise in contrast between the urban and the sculptural where every look is built around movement.',
    featured: true,
  },
  {
    client: 'Lamborghini',
    category: 'COMMERCIALS',
    year: 2024,
    titleEs: 'Revuelto — Film de marca',
    titleEn: 'Revuelto — Brand Film',
    descEs:
      'Vestuario para el film de lanzamiento del Revuelto. Una paleta de materiales técnicos y sastrería depurada que dialoga con la ingeniería del coche.',
    descEn:
      'Costume for the Revuelto launch film. A palette of technical materials and refined tailoring in dialogue with the engineering of the car.',
    featured: true,
  },
  {
    client: 'Coca-Cola',
    category: 'COMMERCIALS',
    year: 2024,
    titleEs: 'Real Magic',
    titleEn: 'Real Magic',
    descEs:
      'Estilismo coral para una pieza de gran formato: decenas de personajes, un mismo universo cromático y una lectura contemporánea del icono.',
    descEn:
      'Ensemble styling for a large-format piece: dozens of characters, a single chromatic universe and a contemporary reading of the icon.',
    featured: true,
  },
  {
    client: 'Citroën',
    category: 'COMMERCIALS',
    year: 2023,
    titleEs: 'Ami — Ciudad',
    titleEn: 'Ami — City',
    descEs:
      'Vestuario contemporáneo y ligero para una campaña urbana, buscando naturalidad y color sin restar protagonismo al producto.',
    descEn:
      'Light contemporary costume for an urban campaign, seeking naturalness and colour without taking the spotlight from the product.',
  },
  {
    client: 'Pacifiction',
    category: 'FILM_TV',
    year: 2020,
    titleEs: 'Pacifiction — Albert Serra',
    titleEn: 'Pacifiction — Albert Serra',
    descEs:
      'Trabajo de estilismo en el largometraje de Albert Serra protagonizado por Benoît Magimel, nominado a los premios César y Gaudí. Un vestuario que habita la ambigüedad y la atmósfera.',
    descEn:
      'Styling work on Albert Serra’s feature film starring Benoît Magimel, nominated for the César and Gaudí Awards. A costume that inhabits ambiguity and atmosphere.',
    featured: true,
  },
  {
    client: 'RTVE',
    category: 'FILM_TV',
    year: 2022,
    titleEs: 'Serie — Época',
    titleEn: 'Series — Period',
    descEs:
      'Diseño de vestuario de época para una serie dramática: documentación histórica, confección a medida y coordinación de figuración.',
    descEn:
      'Period costume design for a drama series: historical research, made-to-measure tailoring and extras coordination.',
  },
  {
    client: 'Editorial',
    category: 'EDITORIAL',
    year: 2025,
    titleEs: 'Retratos — Luz natural',
    titleEn: 'Portraits — Natural Light',
    descEs:
      'Serie editorial de retrato con luz natural, centrada en la textura del tejido y el gesto. Detalle de vestuario y accesorios.',
    descEn:
      'Natural-light portrait editorial focused on fabric texture and gesture. Costume and accessory detail.',
  },
  {
    client: 'Editorial',
    category: 'EDITORIAL',
    year: 2024,
    titleEs: 'Making of — Producción',
    titleEn: 'Making of — Production',
    descEs: 'Imágenes de producción y backstage: el vestuario en contexto, entre plano y plano.',
    descEn: 'Production and backstage images: the costume in context, between takes.',
  },
]

type RentalSeed = {
  nameEs: string
  nameEn: string
  category: RentalCategory
  descEs?: string
  descEn?: string
}

const RENTAL: RentalSeed[] = [
  { nameEs: 'Levita victoriana', nameEn: 'Victorian frock coat', category: 'PERIOD' },
  { nameEs: 'Vestido años 20', nameEn: '1920s dress', category: 'PERIOD' },
  { nameEs: 'Traje sastre', nameEn: 'Tailored suit', category: 'CONTEMPORARY' },
  { nameEs: 'Gabardina', nameEn: 'Trench coat', category: 'CONTEMPORARY' },
  { nameEs: 'Sombrero cloché', nameEn: 'Cloche hat', category: 'ACCESSORIES' },
  { nameEs: 'Guantes de piel', nameEn: 'Leather gloves', category: 'ACCESSORIES' },
  { nameEs: 'Maleta de época', nameEn: 'Vintage suitcase', category: 'PROPS' },
  { nameEs: 'Paraguas negro', nameEn: 'Black umbrella', category: 'PROPS' },
]

async function main() {
  console.log('⚠  Borrando proyectos y alquiler existentes…')
  // Las imágenes/frames caen en cascada (onDelete: Cascade en el schema).
  await prisma.project.deleteMany()
  await prisma.rentalItem.deleteMany()

  console.log('→ Insertando proyectos de demo (fotos + vídeo en galería)…')
  for (const [i, p] of PROJECTS.entries()) {
    const slug = slugify(`${p.client}-${p.titleEs}-${p.year}`)

    // Galería unificada: 4 fotos y, en publicidad/cine, un vídeo Vimeo.
    type MediaSeed =
      | {
          kind: 'IMAGE'
          fileId: string
          url: string
          width: number
          height: number
          wide: boolean
          altEs: string
          altEn: string
          order: number
        }
      | { kind: 'VIDEO'; vimeoId: string; wide: boolean; order: number }

    const media: MediaSeed[] = Array.from({ length: 4 }, (_, n) => ({
      kind: 'IMAGE' as const,
      fileId: `demo-${slug}-img-${n}`,
      url: img(`${slug}-${n}`, n === 0 ? 1600 : 1200, n === 0 ? 1000 : 1500),
      width: n === 0 ? 1600 : 1200,
      height: n === 0 ? 1000 : 1500,
      wide: n === 0, // la primera en ancho completo
      altEs: `${p.client} — imagen ${n + 1}`,
      altEn: `${p.client} — image ${n + 1}`,
      order: n,
    }))
    // Solo el primer proyecto lleva un vídeo de ejemplo en la galería (para
    // no dar la falsa impresión de que "el vídeo está en todos los proyectos").
    if (i === 0) {
      media.push({
        kind: 'VIDEO' as const,
        vimeoId: '76979871?h=8272103f6e',
        wide: false,
        order: media.length,
      })
    }

    await prisma.project.create({
      data: {
        slug,
        category: p.category,
        client: p.client,
        year: p.year,
        titleEs: p.titleEs,
        titleEn: p.titleEn,
        descEs: p.descEs,
        descEn: p.descEn,
        vimeoId: p.category === 'EDITORIAL' ? null : '76979871?h=8272103f6e',
        coverImage: img(`${slug}-cover`, 1600, 1000),
        published: true,
        featured: p.featured ?? false,
        order: i,
        images: { create: media },
      },
    })
  }
  console.log(`✓ ${PROJECTS.length} proyectos`)

  console.log('→ Insertando piezas de alquiler de demo (con fotos)…')
  for (const [i, r] of RENTAL.entries()) {
    const seed = slugify(`${r.nameEn}-${i}`)
    const images = [
      {
        fileId: `demo-rental-${seed}-0`,
        url: img(`rental-${seed}-0`, 900, 1200),
        width: 900,
        height: 1200,
      },
      {
        fileId: `demo-rental-${seed}-1`,
        url: img(`rental-${seed}-1`, 900, 1200),
        width: 900,
        height: 1200,
      },
    ]
    const item = await prisma.rentalItem.create({
      data: {
        nameEs: r.nameEs,
        nameEn: r.nameEn,
        descEs: r.descEs ?? null,
        descEn: r.descEn ?? null,
        category: r.category,
        available: true,
        stock: (i % 4) + 2, // 2–5 unidades
        order: i,
        images,
      },
    })

    // Un par de reservas de demo en las dos primeras piezas.
    if (i < 2) {
      const base = new Date()
      const d = (offset: number) => {
        const x = new Date(base)
        x.setUTCDate(x.getUTCDate() + offset)
        return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()))
      }
      await prisma.reservation.create({
        data: {
          itemId: item.id,
          startDate: d(5),
          endDate: d(9),
          quantity: 1,
          status: 'CONFIRMED',
          kind: 'CUSTOMER',
          customerName: 'Productora Ejemplo',
          customerEmail: 'cliente@ejemplo.com',
          customerPhone: '+34 600 000 000',
          notes: 'Rodaje spot',
        },
      })
      await prisma.reservation.create({
        data: {
          itemId: item.id,
          startDate: d(14),
          endDate: d(16),
          quantity: 1,
          status: 'CONFIRMED',
          kind: 'BLOCK',
          notes: 'Mantenimiento / limpieza',
        },
      })
    }
  }
  console.log(`✓ ${RENTAL.length} piezas de alquiler`)

  console.log('→ Actualizando ajustes del sitio (bio, claim, redes)…')
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {
      claimEs: 'Estilista · Diseñadora de vestuario · Costume rental',
      claimEn: 'Stylist · Costume designer · Costume rental',
      bioEs:
        'Práxedes de Vilallonga se mueve con fluidez entre el cine, la moda y la publicidad, construyendo un universo visual que oscila entre lo poético y lo radical. Su debut en el cine llegó con Pacifiction (2020), dirigida por Albert Serra y protagonizada por Benoît Magimel — nominada a los premios César y Gaudí — donde su trabajo como estilista dejó una huella singular en el panorama cinematográfico europeo.\n\nDesde entonces, ha colaborado con marcas globales como Lamborghini, Jeep, Nissan, Citroën, Nike, Decathlon, Nestlé, Schweppes y Coca-Cola, siempre con una mirada intuitiva, profundamente conceptual e inconfundiblemente propia.',
      bioEn:
        'Práxedes de Vilallonga moves fluidly between cinema, fashion, and advertising, crafting a visual universe that oscillates between the poetic and the radical. Her debut in film came with Pacifiction (2020), directed by Albert Serra and starring Benoît Magimel — nominated for both the César and Gaudí Awards — where her work as a stylist left a distinctive mark on the European cinematic landscape.\n\nSince then, she has collaborated with global brands such as Lamborghini, Jeep, Nissan, Citroën, Nike, Decathlon, Nestlé, Schweppes, and Coca-Cola, always through a lens that is intuitive, deeply conceptual, and unmistakably her own.',
      instagramUrl: 'https://instagram.com/praxedesdevilallonga',
      vimeoUrl: 'https://vimeo.com/praxedesdevilallonga',
    },
    create: {
      id: 'singleton',
      claimEs: 'Estilista · Diseñadora de vestuario · Costume rental',
      claimEn: 'Stylist · Costume designer · Costume rental',
      contactEmail: process.env.ADMIN_EMAIL ?? 'hola@praxedesdevilallonga.com',
    },
  })
  console.log('✓ Ajustes actualizados')
  console.log('\n✅ Demo cargada. Abre http://localhost:3000/es')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
