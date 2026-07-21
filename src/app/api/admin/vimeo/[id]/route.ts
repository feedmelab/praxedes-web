import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVimeoMeta, VimeoError } from '@/lib/vimeo'

// Metadatos + modo de captura del vídeo. No expone la URL del fichero.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  try {
    const { width, height, duration, name, mode } = await getVimeoMeta(id)
    return NextResponse.json({ ok: true, mode, width, height, duration, name })
  } catch (e) {
    const err = e instanceof VimeoError ? e : new Error('Error desconocido')
    const status = err instanceof VimeoError && err.code === 'NO_TOKEN' ? 501 : 502
    return NextResponse.json(
      { ok: false, code: err instanceof VimeoError ? err.code : 'API', error: err.message },
      { status }
    )
  }
}
