import type {
  Project, ProjectImage, VideoFrame,
  RentalItem, ProjectCategory, RentalCategory
} from '@prisma/client'

export type { ProjectCategory, RentalCategory }
export type Locale = 'es' | 'en'

export type ProjectWithRelations = Project & {
  images: ProjectImage[]
  frames: VideoFrame[]
}

export type ProjectCard = Pick<
  Project,
  'id' | 'slug' | 'client' | 'year' | 'titleEs' | 'titleEn' |
  'category' | 'coverImage' | 'published' | 'featured' | 'order'
>

export type RentalItemFull = RentalItem

export type ImageKitFile = {
  fileId: string
  url:    string
  width:  number
  height: number
}

export type ApiResponse<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

export type ProjectFormData = {
  slug:      string
  category:  ProjectCategory
  client:    string
  year:      number
  titleEs:   string
  titleEn:   string
  descEs:    string
  descEn:    string
  vimeoId:   string
  published: boolean
  featured:  boolean
}
