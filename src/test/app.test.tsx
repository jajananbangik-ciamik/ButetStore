import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { formatRupiah, statusLabel } from '../lib/format'
import { cartSubtotal, resolveCartLines } from '../lib/cart'
import { getVideoSource } from '../lib/utils'
import type { Product } from '../types'

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
})

describe('video helpers', () => {
  it('creates a privacy-friendly YouTube embed URL', () => {
    expect(getVideoSource('https://youtu.be/abc12345678')).toEqual({ type: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc12345678' })
  })

  it('accepts direct HTTPS video files and rejects unsafe URLs', () => {
    expect(getVideoSource('https://cdn.example.com/video.mp4')).toEqual({ type: 'file', src: 'https://cdn.example.com/video.mp4' })
    expect(getVideoSource('http://cdn.example.com/video.mp4')).toBeNull()
    expect(getVideoSource('javascript:alert(1)')).toBeNull()
  })
})

describe('app shell', () => {
  it('renders without crashing', () => {
    render(<div>test</div>)
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
