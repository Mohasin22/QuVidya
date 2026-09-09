const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

type ApiErrorKind = 'unavailable' | 'invalid' | 'server'

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind

  constructor(message: string, kind: ApiErrorKind) {
    super(message)
    this.name = 'ApiClientError'
    this.kind = kind
  }
}

export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  } catch {
    throw new ApiClientError('The backend is unavailable. Start the FastAPI server and try again.', 'unavailable')
  }

  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null && 'detail' in payload && typeof payload.detail === 'string' ? payload.detail : 'The backend rejected this request.'
    throw new ApiClientError(detail, response.status === 400 ? 'invalid' : 'server')
  }
  return payload as T
}
