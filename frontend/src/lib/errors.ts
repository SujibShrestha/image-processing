import axios from 'axios'

type ApiErrorBody = {
  message?: string
  error?: string
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined

    return body?.message ?? body?.error ?? error.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
