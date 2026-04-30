import { api, API_PREFIX } from '@/services/api'
import type { AuthSession, User } from '@/types/models'
import type { LoginValues, RegisterValues } from '@/validation/auth'

export async function login(values: LoginValues) {
  const { data } = await api.post<AuthSession>(`${API_PREFIX}/auth/login`, values)
  return data
}

export async function register(values: RegisterValues) {
  const payload = {
    name: values.name,
    email: values.email,
    password: values.password,
    avatar: values.avatar,
  }

  const { data } = await api.post<AuthSession>(`${API_PREFIX}/auth/register`, payload)
  return data
}

export async function getProfile(userId: number) {
  const { data } = await api.get<{ user: User }>(`${API_PREFIX}/users/${userId}`)
  return data.user
}

export async function updateProfile(userId: number, payload: Partial<Pick<User, 'name' | 'avatar'>>) {
  const { data } = await api.patch<{ user: User }>(`${API_PREFIX}/users/${userId}`, payload)
  return data.user
}
