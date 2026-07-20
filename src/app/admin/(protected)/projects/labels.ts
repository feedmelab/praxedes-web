import type { ProjectCategory, RentalCategory } from '@prisma/client'

export const PROJECT_CATEGORIES: Record<ProjectCategory, string> = {
  COMMERCIALS: 'Publicidad',
  FILM_TV: 'Cine / TV',
  EDITORIAL: 'Editorial',
}

export const RENTAL_CATEGORIES: Record<RentalCategory, string> = {
  PERIOD: 'Época',
  CONTEMPORARY: 'Contemporáneo',
  ACCESSORIES: 'Accesorios',
  PROPS: 'Atrezo',
  OTHER: 'Otros',
}
