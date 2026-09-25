import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { cartSubtotal, resolveCartLines } from '../lib/cart'
import { formatRupiah } from '../lib/format'
import { EmptyState } from './EmptyState'
import { ProductImage } from './ProductImage'

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, removeItem } = useCart()
  const { products } = useCatalog()
  const resolved = resolveCartLines(lines, products)
  const subtotal = cartSubtotal(resolved)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, closeCart])

  if (!isOpen) {
    return null
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeCart()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="cart-drawer__header">
          <div>
            <p className="eyebrow">Pesanan Anda</p>
            <h2 id="cart-title">Keranjang</h2>
          </div>
          <button className="icon-button" type="button" onClick={closeCart} aria-label="Tutup keranjang"><X aria-hidden="true" /></button>
        </header>
        {resolved.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Keranjang masih kosong"
            description="Pilih produk dari menu untuk mulai belanja."
            action={<Link className="button button--primary" to="/" onClick={closeCart}>Lihat produk</Link>}
          />
        ) : (
          <>
            <div className="cart-drawer__items">
              {resolved.map((line) => {
                const max = line.availableStock === null ? 99 : Math.max(1, line.availableStock)
                return (
                  <article className="cart-line" key={`${line.productId}-${line.variantId || ''}`}>
                    <ProductImage src={line.product.imageUrl} alt={line.product.name} className="cart-line__image" />
                    <div className="cart-line__body">
                      <div className="cart-line__top">
                        <div>
                          <h3>{line.product.name}</h3>
                          {line.variant && <small>{line.variant.name}</small>}
                        </div>
                        <button className="icon-button icon-button--small" type="button" onClick={() => removeItem(line.productId, line.variantId)} aria-label={`Hapus ${line.product.name}`}><Trash2 aria-hidden="true" /></button>
                      </div>
                      <div className="cart-line__bottom">
                        <div className="quantity-control quantity-control--small">
                          <button type="button" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity - 1)} aria-label="Kurangi"><Minus aria-hidden="true" /></button>
                          <input type="number" value={line.quantity} min={1} max={max} onChange={(event) => updateQuantity(line.productId, line.variantId, Math.min(max, Math.max(1, Number(event.target.value) || 1)))} aria-label={`Jumlah ${line.product.name}`} />
                          <button type="button" onClick={() => updateQuantity(line.productId, line.variantId, line.quantity + 1)} aria-label="Tambah"><Plus aria-hidden="true" /></button>
                        </div>
                        <strong>{formatRupiah(line.lineTotal)}</strong>
                      </div>
                      {line.availableStock !== null && line.quantity >= line.availableStock && <small className="muted">Maksimal stok tersedia</small>}
                    </div>
                  </article>
                )
              })}
            </div>
            <footer className="cart-drawer__footer">
              <div className="summary-row summary-row--total"><span>Subtotal produk</span><strong>{formatRupiah(subtotal)}</strong></div>
              <p className="cart-drawer__note">Ongkir dibayar langsung kepada kurir.</p>
              <Link className="button button--primary button--full" to="/checkout" onClick={closeCart}>
                Checkout <ArrowRight aria-hidden="true" />
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
