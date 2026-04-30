import { z } from 'zod'

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export const registerSchema = z
  .object({
    name: z.preprocess(trimToUndefined, z.string().min(2, 'Name must be at least 2 characters.').max(80).optional()),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
    avatar: z.preprocess(trimToUndefined, z.string().url('Enter a valid avatar URL.').optional()),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
