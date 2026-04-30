export interface User {
  id: number
  email: string
  name?: string | null
  avatar?: string | null
  createdAt?: string
}

export interface ImageRecord {
  id: number
  url: string
  publicId?: string
  userId?: number
  createdAt?: string
  updatedAt?: string
  metadata?: {
    width?: number
    height?: number
    format?: string
    size?: number
  } | null
}

export interface AuthSession {
  message?: string
  token: string
  user: User
}

export interface TransformParams {
  rotate?: number
  width?: number
  height?: number
  crop?: string
  watermarkText?: string
  format?: 'png' | 'webp' | 'jpeg' | 'jpg'
  save?: boolean
}
