import { prisma } from '@/lib/prisma'

// Acceso al modelo AboutMedia con un tipo puente: el cliente Prisma se regenera
// en el build/local, pero así el código compila y funciona sin depender del
// cliente generado en este entorno.
export type AboutMediaRow = { id: string; url: string; order: number }

type AboutMediaModel = {
  findMany: (args?: unknown) => Promise<AboutMediaRow[]>
  create: (args: unknown) => Promise<AboutMediaRow>
  delete: (args: unknown) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
  aggregate: (args: unknown) => Promise<{ _max: { order: number | null } }>
}

export const aboutMedia = (): AboutMediaModel | undefined =>
  (prisma as unknown as { aboutMedia?: AboutMediaModel }).aboutMedia

/** Lista ordenada de medios de «Sobre mí» (vacía si falla/no hay). */
export async function listAboutMedia(): Promise<AboutMediaRow[]> {
  const model = aboutMedia()
  if (!model) return []
  try {
    return await model.findMany({ orderBy: { order: 'asc' } })
  } catch {
    return []
  }
}
