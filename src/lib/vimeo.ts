// Acceso a Vimeo para el extractor de fotogramas.
// El token vive solo en el servidor (VIMEO_ACCESS_TOKEN), nunca en el cliente.
//
// Dos modos de captura según el plan/token:
//  - 'progressive': hay MP4 progresivo → captura nativa en el navegador (canvas).
//  - 'thumbnail'  : sin MP4 progresivo → fotograma por timecode vía Pictures API.

const API = 'https://api.vimeo.com'

type VimeoFile = {
  quality?: string
  type?: string
  width?: number
  height?: number
  link: string
}

type VimeoSize = { width?: number; height?: number; link: string }

export type CaptureMode = 'progressive' | 'thumbnail'

export type VimeoMeta = {
  name: string
  width: number
  height: number
  duration: number
  mode: CaptureMode
  fileUrl: string | null
}

export class VimeoError extends Error {
  code: 'NO_TOKEN' | 'API' | 'NO_PROGRESSIVE' | 'NO_IMAGE'
  constructor(code: VimeoError['code'], message: string) {
    super(message)
    this.code = code
  }
}

function authHeaders(): Record<string, string> {
  const token = process.env.VIMEO_ACCESS_TOKEN
  if (!token) throw new VimeoError('NO_TOKEN', 'Falta VIMEO_ACCESS_TOKEN en el entorno')
  return { Authorization: `bearer ${token}` }
}

/** Extrae el mensaje de error de una respuesta fallida de la API de Vimeo. */
async function vimeoErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; developer_message?: string }
    return body.developer_message || body.error || `Vimeo API ${res.status}`
  } catch {
    return `Vimeo API ${res.status}`
  }
}

/** Metadatos + modo de captura disponible para el vídeo. */
export async function getVimeoMeta(id: string): Promise<VimeoMeta> {
  const res = await fetch(`${API}/videos/${id}?fields=name,width,height,duration,files`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) throw new VimeoError('API', await vimeoErrorMessage(res))

  const data = (await res.json()) as {
    name?: string
    width?: number
    height?: number
    duration?: number
    files?: VimeoFile[]
  }

  const best = (data.files ?? [])
    .filter((f) => f.type === 'video/mp4' && f.link)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]

  return {
    name: data.name ?? `vimeo_${id}`,
    width: best?.width ?? data.width ?? 1920,
    height: best?.height ?? data.height ?? 1080,
    duration: data.duration ?? 0,
    mode: best ? 'progressive' : 'thumbnail',
    fileUrl: best?.link ?? null,
  }
}

/** URL del MP4 progresivo (modo 'progressive'). Lanza NO_PROGRESSIVE si no hay. */
export async function resolveVimeoFile(id: string): Promise<{ fileUrl: string }> {
  const meta = await getVimeoMeta(id)
  if (!meta.fileUrl) {
    throw new VimeoError(
      'NO_PROGRESSIVE',
      'El vídeo no expone MP4 progresivo (plan/token sin acceso a ficheros)'
    )
  }
  return { fileUrl: meta.fileUrl }
}

/**
 * Genera un fotograma por timecode con la Pictures API (modo 'thumbnail').
 * Funciona en planes sin acceso a ficheros progresivos. `active: false` para no
 * cambiar la miniatura del vídeo. Devuelve la mejor resolución disponible.
 */
export async function generateVimeoThumbnail(
  id: string,
  time: number
): Promise<{ url: string; width: number; height: number }> {
  const res = await fetch(`${API}/videos/${id}/pictures`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
    body: JSON.stringify({ time: Math.max(0, time), active: false }),
    cache: 'no-store',
  })
  if (!res.ok) throw new VimeoError('API', `Vimeo Pictures API: ${await vimeoErrorMessage(res)}`)

  const pic = (await res.json()) as { sizes?: VimeoSize[] }
  const best = (pic.sizes ?? []).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
  if (!best?.link) throw new VimeoError('NO_IMAGE', 'La API no devolvió ninguna imagen')

  return { url: best.link, width: best.width ?? 0, height: best.height ?? 0 }
}

/** True si el host es de la CDN de imágenes de Vimeo (allowlist anti-SSRF). */
export function isVimeoImageHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('vimeocdn.com')
  } catch {
    return false
  }
}
