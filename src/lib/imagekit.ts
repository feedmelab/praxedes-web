import ImageKit from 'imagekit'

const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

export { imagekit }

// Subida de archivo desde buffer
export async function uploadFile(
  file: Buffer,
  fileName: string,
  folder: string,
  tags?: string[]
) {
  const result = await imagekit.upload({
    file,
    fileName,
    folder:          `/praxedes/${folder}`,
    useUniqueFileName: true,
    tags,
  })
  return {
    fileId: result.fileId,
    url:    result.url,
    width:  result.width,
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
    src:            url,
    transformation: transformations ? [{ raw: transformations }] : undefined,
    signed:         true,
    expireSeconds:  expireTime,
  })
}

// URL optimizada para display (sin firma, para thumbnails en el admin)
export function getThumbUrl(url: string, width: number, height?: number) {
  return imagekit.url({
    src: url,
    transformation: [{
      width:  width,
      height: height,
      crop:   'maintain_ratio',
      format: 'webp',
      quality: '80',
    }],
  })
}

// Borrado
export async function deleteFile(fileId: string) {
  return imagekit.deleteFile(fileId)
}
