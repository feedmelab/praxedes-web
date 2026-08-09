import ImageKit from 'imagekit'

// Inicialización perezosa: NO construimos el cliente al cargar el módulo, para
// que la web pública no se caiga si faltan las variables IMAGEKIT_* en el
// entorno (p.ej. un Preview de Vercel sin configurar). Solo se construye al
// usar de verdad una función de ImageKit.
let _imagekit: ImageKit | null = null
function ik(): ImageKit {
  if (_imagekit) return _imagekit
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT
  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('ImageKit no configurado: faltan IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT')
  }
  _imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint })
  return _imagekit
}

// Parámetros de autenticación para subir directamente desde el navegador
// (junto con la publicKey y el urlEndpoint, ambos públicos).
export function getUploadAuth() {
  const auth = ik().getAuthenticationParameters()
  return {
    ...auth,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
  }
}

// Subida de archivo desde buffer
export async function uploadFile(file: Buffer, fileName: string, folder: string, tags?: string[]) {
  const result = await ik().upload({
    file,
    fileName,
    folder: `/praxedes/${folder}`,
    useUniqueFileName: true,
    tags,
  })
  return {
    fileId: result.fileId,
    url: result.url,
    width: result.width,
    height: result.height,
  }
}

// URL firmada con caducidad — impide descarga directa
export function getSignedUrl(
  url: string,
  expireSeconds = 300, // 5 minutos por defecto
  transformations?: string
) {
  const expireTime = Math.floor(Date.now() / 1000) + expireSeconds
  return ik().url({
    src: url,
    transformation: transformations ? [{ raw: transformations }] : undefined,
    signed: true,
    expireSeconds: expireTime,
  })
}

// ¿La URL apunta a nuestro endpoint de ImageKit? (las de demo/externas no)
export function isImageKitUrl(url: string): boolean {
  const ep = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  return !!ep && !!url && url.startsWith(ep)
}

/**
 * URL firmada para mostrar en la web pública. Impide hotlinking y descarga por
 * URL directa (requiere activar "Restrict unsigned URLs" en ImageKit).
 * La caducidad se redondea a un bucket diario para que la cadena sea estable
 * dentro del día y next/image pueda cachear la imagen optimizada.
 * Las URLs que no son de ImageKit (p.ej. las de demo) se devuelven sin tocar.
 */
// Transcodificación de vídeo a H.264/MP4: garantiza reproducción en todos los
// navegadores aunque el original sea HEVC/.mov (que Chrome/Firefox no decodifican).
export const VIDEO_DISPLAY_TR = 'f-mp4,q-80,vc-h264'
const isVideoSrc = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u)

export function signedDisplayUrl(url: string): string {
  if (!isImageKitUrl(url)) return url
  try {
    const nowSec = Math.floor(Date.now() / 1000)
    const DAY = 86_400
    // Caduca al final de "pasado mañana" (2–3 días), en bucket diario estable.
    const expireAbsolute = (Math.floor(nowSec / DAY) + 3) * DAY
    return ik().url({
      src: url,
      // Vídeos: se entregan transcodificados a H.264/MP4.
      transformation: isVideoSrc(url) ? [{ raw: VIDEO_DISPLAY_TR }] : undefined,
      signed: true,
      expireSeconds: expireAbsolute - nowSec, // ik-t = now + esto = valor estable del día
    })
  } catch {
    // Sin config de ImageKit → devolvemos la URL sin firmar en vez de romper.
    return url
  }
}

// URL optimizada para display (sin firma, para thumbnails en el admin)
export function getThumbUrl(url: string, width: number, height?: number) {
  return ik().url({
    src: url,
    transformation: [
      {
        width: width,
        height: height,
        crop: 'maintain_ratio',
        format: 'webp',
        quality: '80',
      },
    ],
  })
}

// Borrado
// Lista archivos de una carpeta (para el gestor de vídeos de fondo).
export async function listFiles(path: string, limit = 100) {
  return ik().listFiles({ path, limit })
}

export async function deleteFile(fileId: string) {
  return ik().deleteFile(fileId)
}
