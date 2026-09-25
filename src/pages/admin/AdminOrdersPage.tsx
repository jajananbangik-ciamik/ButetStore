import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Banknote, CheckCircle2, ClipboardList, Filter, MapPin, PackageCheck, RefreshCw, Search, Send, Truck, XCircle } from 'lucide-react'
import { ErrorNotice } from '../../components/ErrorNotice'
import { LoadingScreen } from '../../components/Loading'
import { Modal } from '../../components/Modal'
import { StatusBadge } from '../../components/StatusBadge'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPost } from '../../lib/adminApi'
import { formatDateTime, formatRupiah, statusLabel } from '../../lib/format'
import type { AdminOrder, OrderStatus } from '../../types'

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'MENUNGGU_PEMBAYARAN', label: 'Menunggu pembayaran' },
  { value: 'TERBAYAR', label: 'Sudah dibayar' },
  { value: 'DIPESAN', label: 'Sedang dipesan' },
  { value: 'DIKIRIM', label: 'Dalam pengiriman' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
]

export function AdminOrdersPage() {
  const { session } = useAdminAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [status, setStatus] = useState('ALL')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [selected, setSelected] = useState<AdminOrder | null>(null)
  const [note, setNote] = useState('')
  const [courier, setCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await adminPost<AdminOrder[]>(session.sessionToken, 'listOrders', { status, query: appliedQuery, limit: 200 })
      setOrders(data)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pesanan belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [session, status, appliedQuery])

  useEffect(() => {
    void load()
  }, [load])

  const openOrder = async (order: AdminOrder) => {
    if (!session) {
      return
    }
    setError('')
    try {
      const detail = await adminPost<AdminOrder>(session.sessionToken, 'getOrder', { id: order.id })
      setSelected(detail)
      setNote('')
      setCourier(detail.courier)
      setTrackingNumber(detail.trackingNumber)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Detail pesanan belum dapat dimuat.')
    }
  }

  const updateStatus = async (nextStatus: OrderStatus) => {
    if (!session || !selected) {
      return
    }
    if (nextStatus === 'DIBATALKAN' && !window.confirm('Batalkan pesanan dan kembalikan stok?')) {
      return
    }
    if (nextStatus === 'DIKIRIM' && !courier.trim()) {
      setError('Nama kurir wajib diisi sebelum menandai dikirim.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await adminPost<AdminOrder>(session.sessionToken, 'updateOrderStatus', { id: selected.id, status: nextStatus, note, courier, trackingNumber })
      setSelected(updated)
      setNote('')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Status belum dapat diperbarui.')
    } finally {
      setSaving(false)
    }
  }

  const search = (event: FormEvent) => {
    event.preventDefault()
    setAppliedQuery(query.trim())
  }

  if (loading && !orders.length) {
    return <LoadingScreen label="Memuat pesanan…" />
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="eyebrow">Verifikasi dan pengiriman</p><h1>Pesanan</h1><p>Konfirmasi pembayaran, tandai pesanan dipesan, lalu proses pengiriman.</p></div><button className="button button--soft" type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" /> Perbarui</button></header>
      <ErrorNotice message={error} />
      <form className="admin-filter-bar" onSubmit={search}><label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode, nama, atau WhatsApp" /></label><label className="field field--compact"><span><Filter aria-hidden="true" /> Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="button button--primary" type="submit">Terapkan</button></form>

      <section className="admin-panel">
        {orders.length ? <div className="admin-table-wrap"><table className="admin-table admin-table--clickable"><thead><tr><th>Pesanan</th><th>Pembeli</th><th>Pembayaran</th><th>Total</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} onClick={() => void openOrder(order)}><td><strong>{order.code}</strong><small>{order.itemCount} item</small></td><td>{order.customerName}<small>{order.fullPhone}</small></td><td>{order.paymentMethod}</td><td>{formatRupiah(order.total)}</td><td><StatusBadge status={order.status} /></td><td>{formatDateTime(order.createdAt)}</td></tr>)}</tbody></table></div> : <p className="muted">Tidak ada pesanan yang sesuai filter.</p>}
      </section>

      <Modal open={Boolean(selected)} title={selected ? `Pesanan ${selected.code}` : 'Detail pesanan'} onClose={() => setSelected(null)} size="large">
        {selected && <div className="order-detail-admin">
          <div className="order-detail-admin__summary"><div><StatusBadge status={selected.status} /><p>Dibuat {formatDateTime(selected.createdAt)}</p></div><strong>{formatRupiah(selected.total)}</strong></div>
          <div className="order-detail-admin__grid">
            <div><MapPin aria-hidden="true" /><span><small>Alamat pengiriman</small><strong>{selected.address}</strong></span></div>
            <div><Banknote aria-hidden="true" /><span><small>Pembayaran</small><strong>{selected.paymentMethod}</strong><p>{selected.paidAt ? `Terverifikasi ${formatDateTime(selected.paidAt)}` : 'Belum diverifikasi'}</p></span></div>
          </div>
          <section className="order-detail-admin__items"><h2>Produk</h2>{selected.details?.map((detail, index) => <article key={`${detail.productId}-${detail.variantId}-${index}`}><div><strong>{detail.productName}</strong>{detail.variantName && <small>{detail.variantName}</small>}</div><span>{detail.quantity} × {formatRupiah(detail.unitPrice)}</span><strong>{formatRupiah(detail.subtotal)}</strong></article>)}</section>
          {selected.adminNotes && <div className="notice notice--neutral"><ClipboardList aria-hidden="true" /><span><strong>Catatan admin</strong>{selected.adminNotes}</span></div>}
          <section className="order-history"><h2>Riwayat status</h2>{selected.history?.map((item) => <div key={item.id}><span /><p><strong>{statusLabel(item.toStatus)}</strong><small>{formatDateTime(item.createdAt)}{item.note ? ` · ${item.note}` : ''}</small></p></div>)}</section>
          {selected.status !== 'SELESAI' && selected.status !== 'DIBATALKAN' && <div className="order-admin-actions">
            <label className="field"><span>Catatan admin <small>Opsional</small></span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan verifikasi, pemesanan, atau pengiriman" /></label>
            {selected.status === 'DIPESAN' && <div className="form-grid"><label className="field"><span>Kurir</span><input required value={courier} onChange={(event) => setCourier(event.target.value)} placeholder="Nama kurir" /></label><label className="field"><span>Nomor tracking <small>Opsional</small></span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label></div>}
            <div className="order-admin-actions__buttons">
              {selected.status === 'MENUNGGU_PEMBAYARAN' && <button className="button button--primary" type="button" disabled={saving} onClick={() => void updateStatus('TERBAYAR')}><CheckCircle2 aria-hidden="true" /> Verifikasi pembayaran</button>}
              {selected.status === 'TERBAYAR' && <button className="button button--primary" type="button" disabled={saving} onClick={() => void updateStatus('DIPESAN')}><PackageCheck aria-hidden="true" /> Tandai sudah dipesan</button>}
              {selected.status === 'DIPESAN' && <button className="button button--primary" type="button" disabled={saving} onClick={() => void updateStatus('DIKIRIM')}><Truck aria-hidden="true" /> Tandai dikirim</button>}
              {selected.status === 'DIKIRIM' && <button className="button button--primary" type="button" disabled={saving} onClick={() => void updateStatus('SELESAI')}><CheckCircle2 aria-hidden="true" /> Tandai selesai</button>}
              <button className="button button--danger-soft" type="button" disabled={saving} onClick={() => void updateStatus('DIBATALKAN')}><XCircle aria-hidden="true" /> Batalkan</button>
            </div>
          </div>}
          {selected.status === 'SELESAI' && <div className="notice notice--success"><CheckCircle2 aria-hidden="true" /> Pesanan telah selesai.</div>}
          {selected.status === 'DIBATALKAN' && <div className="notice notice--danger"><Send aria-hidden="true" /> Pesanan dibatalkan dan stok dikembalikan.</div>}
        </div>}
      </Modal>
    </div>
  )
}
