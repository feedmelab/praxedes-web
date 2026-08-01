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

export type VimeoAccess = 'public' | 'private'

export type VimeoMeta = {
  name: string
  width: number
  height: number
  duration: number
  mode: CaptureMode
  fileUrl: string | null
  access: VimeoAccess // 'public' = sin token; 'private' = vía token de la cuenta
}

export class VimeoError extends Error {
  code: 'NO_TOKEN' | 'API' | 'NO_PROGRESSIVE' | 'NO_IMAGE' | 'PRIVATE'
  constructor(code: VimeoError['code'], message: string) {
    super(message)
    this.code = code
  }
}

export { parseVimeo } from '@/lib/utils'

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

type ProgressiveFile = { url: string; width?: number; height?: number; quality?: string }

/**
 * Config del reproductor público de Vimeo. NO requiere token: es lo que usa el
 * propio player para reproducir vídeos públicos. Devuelve el MP4 progresivo si
 * el vídeo es público/embebible. Para privados con restricción de dominio no
 * funciona (ahí hace falta el token de la cuenta propietaria).
 */
async function getPublicPlayerConfig(
  id: string,
  hash?: string
): Promise<{
  name: string
  width: number
  height: number
  duration: number
  progressive: ProgressiveFile[]
} | null> {
  try {
    const url = `https://player.vimeo.com/video/${id}/config${hash ? `?h=${hash}` : ''}`
    const res = await fetch(url, {
      headers: { Referer: 'https://vimeo.com/', 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      video?: { title?: string; width?: number; height?: number; duration?: number }
      request?: { files?: { progressive?: ProgressiveFile[] } }
    }
    const v = data.video ?? {}
    return {
      name: v.title ?? `vimeo_${id}`,
      width: v.width ?? 1920,
      height: v.height ?? 1080,
      duration: v.duration ?? 0,
      progressive: (data.request?.files?.progressive ?? []).filter((f) => f.url),
    }
  } catch {
    return null
  }
}

/** Metadatos + modo de captura disponible para el vídeo. */
export async function getVimeoMeta(id: string, hash?: string): Promise<VimeoMeta> {
  const token = process.env.VIMEO_ACCESS_TOKEN

  // Con token: API de la cuenta (vídeos propios/privados con acceso a ficheros).
  if (token) {
    const res = await fetch(`${API}/videos/${id}?fields=name,width,height,duration,files`, {
      headers: { Authorization: `bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
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
      if (best) {
        return {
          name: data.name ?? `vimeo_${id}`,
          width: best.width ?? data.width ?? 1920,
          height: best.height ?? data.height ?? 1080,
          duration: data.duration ?? 0,
          mode: 'progressive',
          fileUrl: best.link ?? null,
          access: 'private',
        }
      }
      // Tenemos acceso al vídeo (res.ok) pero el plan no expone MP4 progresivo:
      // usamos el modo MINIATURA por timecode (Pictures API, con el token). Antes
      // caíamos a la vía pública, que falla en vídeos privados → «no accesible».
      return {
        name: data.name ?? `vimeo_${id}`,
        width: data.width ?? 1920,
        height: data.height ?? 1080,
        duration: data.duration ?? 0,
        mode: 'thumbnail',
        fileUrl: null,
        access: 'private',
      }
    }
    // Si la API falla (403/404: no es de esta cuenta), probamos la vía pública.
  }

  // Sin token (o token sin ficheros): config del reproductor público.
  const cfg = await getPublicPlayerConfig(id, hash)
  if (cfg) {
    const best = cfg.progressive.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]
    return {
      name: cfg.name,
      width: best?.width ?? cfg.width,
      height: best?.height ?? cfg.height,
      duration: cfg.duration,
      mode: best ? 'progressive' : 'thumbnail',
      fileUrl: best?.url ?? null,
      access: 'public',
    }
  }

  // No hay config público accesible → el vídeo es privado/restringido.
  throw new VimeoError(
    'PRIVATE',
    token
      ? 'El vídeo es privado y el token configurado no tiene acceso a sus ficheros (¿es de otra cuenta o el plan no da acceso?).'
      : 'El vídeo es privado. Para vídeos privados hace falta configurar el token de Vimeo de la cuenta propietaria (VIMEO_ACCESS_TOKEN).'
  )
}

/** URL del MP4 progresivo (modo 'progressive'). Lanza NO_PROGRESSIVE si no hay. */
export async function resolveVimeoFile(id: string, hash?: string): Promise<{ fileUrl: string }> {
  const meta = await getVimeoMeta(id, hash)
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

export type VimeoListItem = {
  id: string
  hash: string | null // hash de privacidad (vídeos «no listados»)
  param: string // lo que se pega en el campo (id o id?h=hash)
  name: string
  duration: number
  privacy: string // public | unlisted | private | …
  thumb: string | null
  link: string
}

/**
 * Lista los vídeos de la cuenta propietaria del token (/me/videos), con su ID,
 * el hash de privacidad (para vídeos «no listados») y una miniatura. Pensado
 * para que en el admin se copie el parámetro y se use en el extractor de frames.
 */
export async function listVimeoVideos(page = 1, perPage = 60): Promise<VimeoListItem[]> {
  const token = process.env.VIMEO_ACCESS_TOKEN
  if (!token) throw new VimeoError('NO_TOKEN', 'Falta VIMEO_ACCESS_TOKEN en el entorno')

  const fields = 'uri,name,duration,link,privacy.view,pictures.sizes'
  const res = await fetch(
    `${API}/me/videos?per_page=${perPage}&page=${page}&sort=date&direction=desc&fields=${fields}`,
    { headers: { Authorization: `bearer ${token}` }, cache: 'no-store' }
  )
  if (!res.ok) throw new VimeoError('API', `Vimeo API: ${await vimeoErrorMessage(res)}`)

  const data = (await res.json()) as {
    data?: Array<{
      uri?: string
      name?: string
      duration?: number
      link?: string
      privacy?: { view?: string }
      pictures?: { sizes?: VimeoSize[] }
    }>
  }

  return (data.data ?? []).map((v) => {
    const id = (v.uri ?? '').split('/').pop() || ''
    // El hash de «no listado» aparece como segundo segmento del link:
    //   https://vimeo.com/123456789/abcdef0123
    const m = (v.link ?? '').match(/vimeo\.com\/\d+\/([0-9a-z]+)/i)
    const hash = m ? m[1] : null
    const sizes = v.pictures?.sizes ?? []
    const thumb = sizes.length ? (sizes[sizes.length - 1]?.link ?? null) : null
    return {
      id,
      hash,
      param: hash ? `${id}?h=${hash}` : id,
      name: v.name ?? `vimeo_${id}`,
      duration: v.duration ?? 0,
      privacy: v.privacy?.view ?? 'unknown',
      thumb,
      link: v.link ?? `https://vimeo.com/${id}`,
    }
  })
}

/** True si el host es de la CDN de imágenes de Vimeo (allowlist anti-SSRF). */
export function isVimeoImageHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('vimeocdn.com')
  } catch {
    return false
  }
}
