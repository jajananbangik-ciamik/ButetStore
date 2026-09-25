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

export type ImageCompressionProfile = 'standard' | 'qris'

export interface PreparedImage {
  dataUrl: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
}

const imageCompressionProfiles = {
  standard: { maxDimension: 1600, quality: 0.82, types: ['image/webp', 'image/jpeg'] },
  qris: { maxDimension: 2400, quality: 0.95, types: ['image/png', 'image/jpeg'] },
} as const

const maximumUploadDataUrlLength = 4200000

function dataUrlSize(value: string) {
  const base64 = value.includes(',') ? value.slice(value.indexOf(',') + 1) : ''
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor(base64.length * 3 / 4) - padding)
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new ApiError('Gambar tidak dapat diproses.'))
    image.src = dataUrl
  })
}

function scaledDimensions(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function drawImage(image: HTMLImageElement, width: number, height: number, maxDimension: number) {
  const dimensions = scaledDimensions(width, height, maxDimension)
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new ApiError('Browser tidak dapat mengompresi gambar.')
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, dimensions.width, dimensions.height)
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
  return canvas
}

function encodeCanvas(canvas: HTMLCanvasElement, types: readonly string[], quality: number) {
  let best = ''
  types.forEach((type) => {
    try {
      const candidate = canvas.toDataURL(type, quality)
      if (candidate.startsWith('data:image/') && (!best || candidate.length < best.length)) {
        best = candidate
      }
    } catch {
      return
    }
  })
  return best
}

export async function compressImageFile(file: File, profile: ImageCompressionProfile = 'standard'): Promise<PreparedImage> {
  if (!/^image\/(?:png|jpe?g|webp)$/i.test(file.type)) {
    throw new ApiError('Format gambar harus PNG, JPG, atau WebP.')
  }
  const originalDataUrl = await fileToDataUrl(file)
  const image = await loadImage(originalDataUrl)
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (!width || !height) {
    throw new ApiError('Gambar tidak memiliki dimensi yang valid.')
  }
  const settings = imageCompressionProfiles[profile]
  const smallFileThreshold = profile === 'qris' ? 1500000 : 750000
  if (file.size <= smallFileThreshold && Math.max(width, height) <= settings.maxDimension) {
    return { dataUrl: originalDataUrl, originalSize: file.size, compressedSize: dataUrlSize(originalDataUrl), width, height }
  }

  let maxDimension: number = settings.maxDimension
  let quality: number = settings.quality
  let best = ''
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const canvas = drawImage(image, width, height, maxDimension)
    const candidate = encodeCanvas(canvas, settings.types, quality)
    if (candidate && (!best || candidate.length < best.length)) {
      best = candidate
    }
    if (candidate.length <= maximumUploadDataUrlLength || attempt === 3) {
      break
    }
    maxDimension = Math.max(640, Math.floor(maxDimension * 0.8))
    quality = Math.max(0.55, quality - 0.08)
  }
  if (!best) {
    throw new ApiError('Gambar tidak dapat dikompresi.')
  }
  const useCompressed = best.length < originalDataUrl.length || originalDataUrl.length > maximumUploadDataUrlLength
  const dataUrl = useCompressed ? best : originalDataUrl
  if (dataUrl.length > maximumUploadDataUrlLength) {
    throw new ApiError('Gambar masih terlalu besar. Pilih gambar dengan resolusi lebih rendah.')
  }
  return { dataUrl, originalSize: file.size, compressedSize: dataUrlSize(dataUrl), width, height }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new ApiError('Gambar tidak dapat dibaca.'))
    reader.readAsDataURL(file)
  })
}
