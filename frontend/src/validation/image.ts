import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) {
    return undefined
  }

  const number = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(number as number) ? number : value
}, z.number().int().optional())

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const transformSchema = z.object({
  rotate: optionalNumber.refine((value) => value === undefined || (value >= -360 && value <= 360), {
    message: 'Rotate must be between -360 and 360.',
  }).optional(),
  width: optionalNumber.refine((value) => value === undefined || value > 0, {
    message: 'Width must be greater than 0.',
  }).optional(),
  height: optionalNumber.refine((value) => value === undefined || value > 0, {
    message: 'Height must be greater than 0.',
  }).optional(),
  cropX: optionalNumber.refine((value) => value === undefined || value >= 0, {
    message: 'Crop X must be 0 or greater.',
  }).optional(),
  cropY: optionalNumber.refine((value) => value === undefined || value >= 0, {
    message: 'Crop Y must be 0 or greater.',
  }).optional(),
  cropWidth: optionalNumber.refine((value) => value === undefined || value > 0, {
    message: 'Crop width must be greater than 0.',
  }).optional(),
  cropHeight: optionalNumber.refine((value) => value === undefined || value > 0, {
    message: 'Crop height must be greater than 0.',
  }).optional(),
  watermarkText: z.preprocess(trimToUndefined, z.string().max(120).optional()),
  format: z.enum(['png', 'webp', 'jpeg', 'jpg']).default('png'),
})

export type TransformValues = z.infer<typeof transformSchema>
