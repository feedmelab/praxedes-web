import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVimeoMeta, VimeoError } from '@/lib/vimeo'

// Metadatos + modo de captura del vídeo. No expone la URL del fichero.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const hash = new URL(req.url).searchParams.get('h') ?? undefined
  try {
    const { width, height, duration, name, mode, access } = await getVimeoMeta(id, hash)
    return NextResponse.json({ ok: true, mode, access, width, height, duration, name })
  } catch (e) {
    const err = e instanceof VimeoError ? e : new Error('Error desconocido')
    const code = err instanceof VimeoError ? err.code : 'API'
    const status = code === 'NO_TOKEN' ? 501 : code === 'PRIVATE' ? 403 : 502
    return NextResponse.json({ ok: false, code, error: err.message }, { status })
  }
}
