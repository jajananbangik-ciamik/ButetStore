import type { OrderStatus } from '../types'

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID')

export function formatRupiah(value: number) {
  return rupiahFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value: number) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatPercent(value: number) {
  return `${numberFormatter.format(Number.isFinite(value) ? value : 0)}%`
}

export function formatDate(value?: string) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    MENUNGGU_PEMBAYARAN: 'Menunggu pembayaran',
    TERBAYAR: 'Pembayaran terverifikasi',
    DIPESAN: 'Sedang dipesan',
    DIKIRIM: 'Dalam pengiriman',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
  }
  return labels[status]
}

export function statusTone(status: OrderStatus) {
  const tones: Record<OrderStatus, string> = {
    MENUNGGU_PEMBAYARAN: 'warning',
    TERBAYAR: 'info',
    DIPESAN: 'purple',
    DIKIRIM: 'blue',
    SELESAI: 'success',
    DIBATALKAN: 'danger',
  }
  return tones[status]
}

export function formatOrderId(value: string) {
  return value.replace(/-/g, ' ').toUpperCase()
}
