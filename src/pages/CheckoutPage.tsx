import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote, Check, CreditCard, MapPin, Minus, Plus, QrCode, ShoppingBag, Truck } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { ErrorNotice } from '../components/ErrorNotice'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { apiPost } from '../lib/api'
import { cartSubtotal, makeRequestKey, resolveCartLines } from '../lib/cart'
import { formatRupiah } from '../lib/format'
import type { PaymentMethod, PublicOrder } from '../types'

export function CheckoutPage() {
  const { lines, updateQuantity, clearCart } = useCart()
  const { products, settings } = useCatalog()
  const navigate = useNavigate()
  const requestKey = useRef(makeRequestKey())
  const resolved = resolveCartLines(lines, products)
  const subtotal = cartSubtotal(resolved)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  useDocumentTitle('Checkout')

  const qrisReady = Boolean(settings.qrisImageUrl)
  const transferReady = Boolean(settings.bankName && settings.bankAccountNumber && settings.bankAccountHolder)
  const paymentReady = paymentMethod === 'QRIS' ? qrisReady : transferReady

  if (!resolved.length) {
    return (
      <div className="page-section container">
        <EmptyState icon={ShoppingBag} title="Keranjang masih kosong" description="Tambahkan produk sebelum melanjutkan checkout." action={<Link className="button button--primary" to="/">Mulai belanja</Link>} />
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!paymentReady) {
      setError('Metode pembayaran belum dikonfigurasi admin.')
      return
    }
    setSubmitting(true)
    try {
      const result = await apiPost<{ order: PublicOrder }>({
        action: 'createOrder',
        requestKey: requestKey.current,
        customerName,
        phone,
        address,
        notes,
        paymentMethod,
        items: resolved.map((line) => ({ productId: line.productId, variantId: line.variantId || '', quantity: line.quantity })),
      })
      sessionStorage.setItem('butet-last-order', JSON.stringify(result.order))
      clearCart()
      navigate(`/pesanan/${result.order.id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pesanan belum dapat dibuat.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-section container">
      <Link className="back-link" to="/"><ArrowLeft aria-hidden="true" /> Lanjut belanja</Link>
      <header className="page-heading page-heading--checkout"><p className="eyebrow">Langkah terakhir</p><h1>Checkout</h1><p>Isi data pengiriman dan pilih metode pembayaran.</p></header>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-form-stack">
          <ErrorNotice message={error} />
          <section className="form-card">
            <div className="form-card__heading"><span><MapPin aria-hidden="true" /></span><div><h2>Data pengiriman</h2><p>Admin akan menghubungi Anda jika ada yang perlu dikonfirmasi.</p></div></div>
            <div className="form-grid">
              <label className="field"><span>Nama pembeli</span><input required autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama lengkap" /></label>
              <label className="field"><span>Nomor WhatsApp</span><input required autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" /></label>
              <label className="field field--full"><span>Alamat lengkap</span><textarea required rows={4} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, dan kode pos" /></label>
              <label className="field field--full"><span>Catatan <small>Opsional</small></span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Contoh: titip di pos Bloc A" /></label>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card__heading"><span><CreditCard aria-hidden="true" /></span><div><h2>Metode pembayaran</h2><p>{settings.paymentInstructions}</p></div></div>
            <div className="payment-options">
              <label className={`payment-option ${paymentMethod === 'QRIS' ? 'payment-option--selected' : ''} ${!qrisReady ? 'payment-option--disabled' : ''}`}>
                <input type="radio" name="payment" value="QRIS" checked={paymentMethod === 'QRIS'} disabled={!qrisReady} onChange={() => setPaymentMethod('QRIS')} />
                <QrCode aria-hidden="true" /><span><strong>QRIS</strong><small>{qrisReady ? 'Bayar dari aplikasi apa pun' : 'Belum diatur admin'}</small></span>
                {paymentMethod === 'QRIS' && qrisReady && <Check aria-hidden="true" />}
              </label>
              <label className={`payment-option ${paymentMethod === 'TRANSFER' ? 'payment-option--selected' : ''} ${!transferReady ? 'payment-option--disabled' : ''}`}>
                <input type="radio" name="payment" value="TRANSFER" checked={paymentMethod === 'TRANSFER'} disabled={!transferReady} onChange={() => setPaymentMethod('TRANSFER')} />
                <Banknote aria-hidden="true" /><span><strong>Transfer bank</strong><small>{transferReady ? 'Virtual account atau rekening' : 'Belum diatur admin'}</small></span>
                {paymentMethod === 'TRANSFER' && transferReady && <Check aria-hidden="true" />}
              </label>
            </div>
            <div className="shipping-note"><Truck aria-hidden="true" /><span><strong>Pengiriman</strong>{settings.shippingNote}</span></div>
          </section>
        </div>

        <aside className="order-summary">
          <h2>Ringkasan pesanan</h2>
          <div className="order-summary__items">
            {resolved.map((line) => (
              <div className="summary-product" key={`${line.productId}-${line.variantId || ''}`}>
                <div><strong>{line.product.name}</strong>{line.variant && <small>{line.variant.name}</small>}<span>{formatRupiah(line.unitPrice)} × {line.quantity}</span></div>
                <div className="quantity-control quantity-control--small">
                  <button type="button" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)} aria-label="Kurangi"><Minus aria-hidden="true" /></button>
                  <input type="number" value={line.quantity} readOnly aria-label={`Jumlah ${line.product.name}`} />
                  <button type="button" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)} aria-label="Tambah"><Plus aria-hidden="true" /></button>
                </div>
                <strong>{formatRupiah(line.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal produk</span><strong>{formatRupiah(subtotal)}</strong></div>
          <div className="summary-row"><span>Ongkir</span><strong>Dibayar ke kurir</strong></div>
          <div className="summary-row summary-row--total"><span>Total pembayaran</span><strong>{formatRupiah(subtotal)}</strong></div>
          <button className="button button--primary button--full" type="submit" disabled={submitting || !paymentReady}>{submitting ? 'Memproses…' : 'Buat pesanan'}</button>
          <small className="order-summary__note">Pesanan menunggu verifikasi pembayaran oleh admin.</small>
        </aside>
      </form>
    </div>
  )
}
