import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveVimeoFile, VimeoError } from '@/lib/vimeo'

// Proxy same-origin del MP4 progresivo de Vimeo. Reenvía las peticiones con
// soporte de Range para que el <video> del cliente pueda hacer seek sin
// descargar todo el fichero, y para que el canvas no quede "tainted" por CORS.
// El token de Vimeo nunca sale del servidor.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params

  let fileUrl: string
  try {
    ;({ fileUrl } = await resolveVimeoFile(id))
  } catch (e) {
    const err = e instanceof VimeoError ? e : new Error('Error desconocido')
    const status = err instanceof VimeoError && err.code === 'NO_TOKEN' ? 501 : 502
    return new NextResponse(err.message, { status })
  }

  const range = req.headers.get('range')
  const upstream = await fetch(fileUrl, {
    headers: range ? { Range: range } : {},
    cache: 'no-store',
  })

  const headers = new Headers()
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  if (!headers.has('accept-ranges')) headers.set('accept-ranges', 'bytes')
  headers.set('cache-control', 'private, no-store')

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}
