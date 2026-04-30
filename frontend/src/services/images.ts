import { api, API_PREFIX } from '@/services/api'
import type { ImageRecord, TransformParams } from '@/types/models'

type ImagesResponse = { images: ImageRecord[] }
type ImageResponse = { image: ImageRecord }
type SaveResponse = { saved: boolean; image: ImageRecord }

const cleanParams = (params: TransformParams) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== false),
  )
}

export async function listImages() {
  const { data } = await api.get<ImagesResponse>(`${API_PREFIX}/images`)
  return data.images ?? []
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.post<ImageResponse>(`${API_PREFIX}/images`, formData)
  return data.image
}

export async function updateImage(id: number, file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.patch<ImageResponse>(`${API_PREFIX}/images/${id}`, formData)
  return data.image
}

export async function deleteImage(id: number) {
  await api.delete(`${API_PREFIX}/images/${id}`)
}

export async function previewImage(id: number, params: TransformParams) {
  const { data } = await api.get<Blob>(`${API_PREFIX}/images/${id}`, {
    params: cleanParams(params),
    responseType: 'blob',
  })

  return data
}

export async function saveTransformedImage(id: number, params: TransformParams) {
  const { data } = await api.get<SaveResponse>(`${API_PREFIX}/images/${id}`, {
    params: cleanParams({ ...params, save: true }),
  })

  return data.image
}
