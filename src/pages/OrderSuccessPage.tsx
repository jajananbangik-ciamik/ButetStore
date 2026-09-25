import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Banknote, CheckCircle2, Copy, QrCode, Truck } from 'lucide-react'
import { useState } from 'react'
import { ErrorNotice } from '../components/ErrorNotice'
import { StatusBadge } from '../components/StatusBadge'
import { useCatalog } from '../context/CatalogContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatRupiah } from '../lib/format'
import type { PublicOrder } from '../types'

export function OrderSuccessPage() {
  const { orderId } = useParams()
  const { settings } = useCatalog()
  const [copied, setCopied] = useState(false)
  useDocumentTitle('Pesanan dibuat')
  let order: PublicOrder | null = null
  try {
    const stored = sessionStorage.getItem('butet-last-order')
    const parsed = stored ? JSON.parse(stored) as PublicOrder : null
    order = parsed?.id === orderId ? parsed : null
  } catch {
    order = null
  }

  if (!order) {
    return (
      <div className="page-section container">
        <ErrorNotice message="Detail pesanan tidak tersedia di perangkat ini. Gunakan menu Lacak Pesanan." />
        <Link className="button button--primary" to="/lacak">Lacak pesanan</Link>
      </div>
    )
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(order.code)
    setCopied(true)
  }

  return (
    <div className="page-section container order-success">
      <section className="success-card">
        <span className="success-card__icon"><CheckCircle2 aria-hidden="true" /></span>
        <p className="eyebrow">Pesanan berhasil dibuat</p>
        <h1>Silakan selesaikan pembayaran</h1>
        <p>Admin akan memverifikasi pembayaran sebelum menandai pesanan sebagai dipesan.</p>
        <div className="order-code"><span><small>Nomor pesanan</small><strong>{order.code}</strong></span><button className="icon-button" type="button" onClick={() => void copyCode()} aria-label="Salin nomor pesanan"><Copy aria-hidden="true" /></button></div>
        {copied && <small className="success-card__copied">Nomor pesanan disalin.</small>}
        <div className="success-total"><span>Total pembayaran</span><strong>{formatRupiah(order.total)}</strong></div>
      </section>

      <section className="payment-detail-card">
        {order.paymentMethod === 'QRIS' ? (
          <><div className="payment-detail-card__heading"><QrCode aria-hidden="true" /><div><h2>Bayar dengan QRIS</h2><p>{settings.paymentInstructions}</p></div></div>{settings.qrisImageUrl && <img className="qris-image" src={settings.qrisImageUrl} alt="Kode QRIS BUTET STORE" />}</>
        ) : (
          <><div className="payment-detail-card__heading"><Banknote aria-hidden="true" /><div><h2>Transfer bank</h2><p>{settings.paymentInstructions}</p></div></div><dl className="bank-details"><div><dt>Bank</dt><dd>{settings.bankName}</dd></div><div><dt>Nomor rekening</dt><dd>{settings.bankAccountNumber}</dd></div><div><dt>Atas nama</dt><dd>{settings.bankAccountHolder}</dd></div></dl></>
        )}
        <div className="shipping-note"><Truck aria-hidden="true" /><span><strong>Catatan pengiriman</strong>{settings.shippingNote}</span></div>
      </section>

      <div className="order-success__actions"><Link className="button button--primary" to="/lacak">Lacak pesanan <ArrowRight aria-hidden="true" /></Link><Link className="button button--soft" to="/">Kembali ke beranda</Link></div>
      <StatusBadge status={order.status} />
    </div>
  )
}
