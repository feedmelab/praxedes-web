import ImageKit from 'imagekit'

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

export { imagekit }

// Subida de archivo desde buffer
export async function uploadFile(file: Buffer, fileName: string, folder: string, tags?: string[]) {
  const result = await imagekit.upload({
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
  return imagekit.url({
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
export function signedDisplayUrl(url: string): string {
  if (!isImageKitUrl(url)) return url
  const nowSec = Math.floor(Date.now() / 1000)
  const DAY = 86_400
  // Caduca al final de "pasado mañana" (2–3 días), en bucket diario estable.
  const expireAbsolute = (Math.floor(nowSec / DAY) + 3) * DAY
  return imagekit.url({
    src: url,
    signed: true,
    expireSeconds: expireAbsolute - nowSec, // ik-t = now + esto = valor estable del día
  })
}

// URL optimizada para display (sin firma, para thumbnails en el admin)
export function getThumbUrl(url: string, width: number, height?: number) {
  return imagekit.url({
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
export async function deleteFile(fileId: string) {
  return imagekit.deleteFile(fileId)
}
