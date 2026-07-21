import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateVimeoThumbnail, VimeoError } from '@/lib/vimeo'

// Genera un fotograma por timecode vía Pictures API (modo 'thumbnail', para
// planes/tokens sin acceso a MP4 progresivo). Devuelve la URL de la imagen en la
// CDN de Vimeo (i.vimeocdn.com, permitida en la CSP) para previsualizar.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const t = Number(new URL(req.url).searchParams.get('t') ?? '0')

  try {
    const { url, width, height } = await generateVimeoThumbnail(id, Number.isFinite(t) ? t : 0)
    return NextResponse.json({ ok: true, url, width, height })
  } catch (e) {
    const err = e instanceof VimeoError ? e : new Error('Error desconocido')
    const status = err instanceof VimeoError && err.code === 'NO_TOKEN' ? 501 : 502
    return NextResponse.json(
      { ok: false, code: err instanceof VimeoError ? err.code : 'API', error: err.message },
      { status }
    )
  }
}
