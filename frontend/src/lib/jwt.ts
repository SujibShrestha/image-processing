export interface JwtPayload {
  id?: number
  email?: string
  iat?: number
}

export function decodeJwtPayload<T extends object = JwtPayload>(token: string): T | null {
  try {
    const payload = token.split('.')[1]

    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const json = atob(padded)

    return JSON.parse(json) as T
  } catch {
    return null
  }
}
