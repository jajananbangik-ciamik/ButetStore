import { useState } from 'react'
import { Banknote, CheckCircle2, MapPin, Search, Truck } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { ErrorNotice } from '../components/ErrorNotice'
import { StatusBadge } from '../components/StatusBadge'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { apiPost } from '../lib/api'
import { formatRupiah } from '../lib/format'
import type { PublicOrder } from '../types'

const timeline = ['MENUNGGU_PEMBAYARAN', 'TERBAYAR', 'DIPESAN', 'DIKIRIM', 'SELESAI'] as const

export function TrackOrderPage() {
  const [code, setCode] = useState('')
  const [phoneSuffix, setPhoneSuffix] = useState('')
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useDocumentTitle('Lacak Pesanan')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setOrder(null)
    setLoading(true)
    try {
      const result = await apiPost<{ order: PublicOrder }>({ action: 'trackOrder', code, phoneSuffix })
      setOrder(result.order)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pesanan belum dapat ditemukan.')
    } finally {
      setLoading(false)
    }
  }

  const currentIndex = order ? timeline.indexOf(order.status as typeof timeline[number]) : -1

  return (
    <div className="page-section container track-page">
      <header className="page-heading"><p className="eyebrow">Status pesanan</p><h1>Lacak pesanan</h1><p>Masukkan nomor pesanan dan 4 digit akhir nomor WhatsApp.</p></header>
      <form className="track-form" onSubmit={submit}>
        <label className="field"><span>Nomor pesanan</span><input required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="BS-YYYYMMDD-XXXXXX" /></label>
        <label className="field"><span>4 digit akhir WhatsApp</span><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={phoneSuffix} onChange={(event) => setPhoneSuffix(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" /></label>
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? 'Mencari…' : <><Search aria-hidden="true" /> Lacak</>}</button>
      </form>
      <ErrorNotice message={error} />
      {order ? (
        <section className="tracking-result">
          <div className="tracking-result__header"><div><p className="eyebrow">Nomor pesanan</p><h2>{order.code}</h2></div><StatusBadge status={order.status} /></div>
          {order.status === 'DIBATALKAN' ? <div className="notice notice--danger"><strong>Pesanan dibatalkan.</strong> Hubungi admin jika diperlukan bantuan.</div> : <div className="status-timeline">{timeline.map((status, index) => <div className={`status-step ${index <= currentIndex ? 'status-step--active' : ''}`} key={status}><span>{index < currentIndex ? <CheckCircle2 aria-hidden="true" /> : index + 1}</span><small>{status.replaceAll('_', ' ')}</small></div>)}</div>}
          <div className="tracking-card-grid">
            <div><MapPin aria-hidden="true" /><span><small>Alamat</small><strong>{order.address}</strong></span></div>
            <div><Truck aria-hidden="true" /><span><small>Pengiriman</small><strong>{order.courier || 'Admin akan mengatur pengiriman'}</strong>{order.trackingNumber && <code>{order.trackingNumber}</code>}</span></div>
            <div><Banknote aria-hidden="true" /><span><small>Total pembayaran</small><strong>{formatRupiah(order.total)}</strong></span></div>
          </div>
        </section>
      ) : !loading && !error && <EmptyState icon={Search} title="Masukkan data pesanan" description="Status pembayaran dan pengiriman akan tampil di sini." />}
    </div>
  )
}
