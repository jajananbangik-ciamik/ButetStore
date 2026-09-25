const API_URL = String(import.meta.env.VITE_BUTET_API_URL || '').trim().replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const isApiConfigured = Boolean(API_URL)

function withoutEnvelope(payload: Record<string, unknown>) {
  const result = { ...payload }
  delete result.ok
  delete result.error
  return result
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, credentials: 'omit', cache: 'no-store' })
    const text = await response.text()
    let payload: Record<string, unknown>
    try {
      payload = text ? JSON.parse(text) as Record<string, unknown> : {}
    } catch {
      throw new ApiError('Respons server tidak valid.')
    }
    if (!response.ok || payload.ok === false) {
      throw new ApiError(String(payload.error || 'Permintaan gagal diproses.'))
    }
    return (payload.data ?? withoutEnvelope(payload)) as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Server terlalu lama merespons. Silakan coba lagi.')
    }
    throw new ApiError('Tidak dapat terhubung ke server BUTET STORE.')
  } finally {
    window.clearTimeout(timeout)
  }
}

export function apiGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_URL) {
    return Promise.reject(new ApiError('Endpoint backend belum dikonfigurasi.'))
  }
  const search = new URLSearchParams({ action, ...params })
  return request<T>(`${API_URL}?${search.toString()}`, { method: 'GET' })
}

export function apiPost<T>(payload: Record<string, unknown>): Promise<T> {
  if (!API_URL) {
    return Promise.reject(new ApiError('Endpoint backend belum dikonfigurasi.'))
  }
  return request<T>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new ApiError('Gambar tidak dapat dibaca.'))
    reader.readAsDataURL(file)
  })
}
