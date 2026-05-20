const baseUrl = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = { ...init.headers }

  // Only set Content-Type if there's a body
  if (init.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  const text = await response.text()
  const body: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = (body as { message?: string } | null)?.message ?? response.statusText
    throw new ApiError(message, response.status, body)
  }

  return body as T
}
