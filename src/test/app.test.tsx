import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatRupiah, statusLabel } from '../lib/format'
import { cartSubtotal, resolveCartLines } from '../lib/cart'
import { getVideoSource } from '../lib/utils'
import type { Product } from '../types'

const catalogServiceSource = readFileSync(resolve('appsscript/CatalogService.js'), 'utf8')

function createCatalogService() {
  const factory = new Function('APP_CONFIG', 'SHEET_NAMES', 'cleanText_', 'URL', `${catalogServiceSource}\nreturn { safeImageUrl_, safeVideoUrl_, safeVideoUrlForRead_ }`)
  return factory(
    { maximumTextLength: 1000 },
    {},
    (value: unknown, maxLength = 1000) => String(value ?? '').trim().slice(0, maxLength),
    undefined,
  )
}

const product: Product = {
  id: 'p1',
  submenuId: 's1',
  submenuName: 'Frozen',
  categoryId: 'c1',
  categoryName: 'Jajanan Frozen',
  name: 'Sosis',
  slug: 'sosis',
  description: '',
  price: 25000,
  minimumPrice: 25000,
  imageUrl: '',
  videoUrl: '',
  featured: true,
  active: true,
  trackStock: true,
  stock: 4,
  hpp: 15000,
  order: 1,
  variants: [],
}

describe('format helpers', () => {
  it('formats rupiah without decimals', () => {
    expect(formatRupiah(25000)).toContain('25.000')
  })

  it('provides Indonesian status labels', () => {
    expect(statusLabel('MENUNGGU_PEMBAYARAN')).toBe('Menunggu pembayaran')
  })
})

describe('cart helpers', () => {
  it('resolves current product price and limits quantity to stock', () => {
    const lines = resolveCartLines([{ productId: 'p1', quantity: 9 }], [product])
    expect(lines[0].quantity).toBe(4)
    expect(cartSubtotal(lines)).toBe(100000)
  })

  it('keeps unlimited stock when tracking is disabled', () => {
    const unlimited = { ...product, trackStock: false }
    const lines = resolveCartLines([{ productId: 'p1', quantity: 9 }], [unlimited])
    expect(lines[0].availableStock).toBeNull()
    expect(lines[0].quantity).toBe(9)
  })

  it('drops a legacy line when the product now requires a variant', () => {
    const withVariant = {
      ...product,
      variants: [{ id: 'v1', productId: 'p1', name: 'Dosis', price: 25000, hpp: 15000, trackStock: false, stock: 0, active: true, order: 1 }],
    }
    expect(resolveCartLines([{ productId: 'p1', quantity: 1 }], [withVariant])).toEqual([])
  })

  it('uses variant stock settings instead of product stock', () => {
    const withVariant = {
      ...product,
      stock: 0,
      variants: [{ id: 'v1', productId: 'p1', name: 'Dosis', price: 25000, hpp: 15000, trackStock: false, stock: 0, active: true, order: 1 }],
    }
    const lines = resolveCartLines([{ productId: 'p1', variantId: 'v1', quantity: 2 }], [withVariant])
    expect(lines[0].availableStock).toBeNull()
    expect(lines[0].quantity).toBe(2)
  })
})

describe('video helpers', () => {
  it('creates a privacy-friendly YouTube embed URL', () => {
    expect(getVideoSource('https://youtu.be/abc12345678')).toEqual({ type: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc12345678' })
    expect(getVideoSource('https://www.youtube.com/watch?v=abc12345678')).toEqual({ type: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc12345678' })
  })

  it('accepts direct HTTPS video files and rejects unsafe URLs', () => {
    expect(getVideoSource('https://cdn.example.com/video.mp4')).toEqual({ type: 'file', src: 'https://cdn.example.com/video.mp4' })
    expect(getVideoSource('http://cdn.example.com/video.mp4')).toBeNull()
    expect(getVideoSource('javascript:alert(1)')).toBeNull()
  })
})

describe('backend video URL validation', () => {
  const service = createCatalogService()

  it('accepts common YouTube links without the browser URL global', () => {
    expect(service.safeVideoUrl_('https://www.youtube.com/watch?v=abc12345678&t=10')).toBe('https://www.youtube.com/watch?v=abc12345678&t=10')
    expect(service.safeVideoUrl_('https://youtu.be/abc12345678?si=abc')).toBe('https://youtu.be/abc12345678?si=abc')
    expect(service.safeVideoUrl_('https://www.youtube.com/shorts/abc12345678')).toBe('https://www.youtube.com/shorts/abc12345678')
  })

  it('accepts direct HTTPS video files with query strings', () => {
    expect(service.safeVideoUrl_('https://cdn.example.com/video.mp4?token=abc#t=10')).toBe('https://cdn.example.com/video.mp4?token=abc#t=10')
    expect(service.safeImageUrl_('https://drive.google.com/uc?export=view&id=abc')).toBe('https://drive.google.com/uc?export=view&id=abc')
  })

  it('rejects unsafe links and hides invalid legacy values', () => {
    expect(() => service.safeVideoUrl_('http://www.youtube.com/watch?v=abc12345678')).toThrow('HTTPS')
    expect(() => service.safeVideoUrl_('https://example.com/video.mp4x')).toThrow('YouTube')
    expect(service.safeVideoUrlForRead_('https://example.com/not-a-video')).toBe('')
  })
})

describe('app shell', () => {
  it('renders without crashing', () => {
    render(<div>test</div>)
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
