import { useState } from 'react'
import { Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatRupiah } from '../lib/format'
import type { Product } from '../types'
import { ProductImage } from './ProductImage'
import { ProductModal } from './ProductModal'

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const hasVariants = product.variants.some((variant) => variant.active)
  const outOfStock = product.trackStock && product.stock <= 0

  const add = () => {
    if (hasVariants) {
      setModalOpen(true)
      return
    }
    addItem(product.id, undefined, 1)
    openCart()
  }

  return (
    <>
      <article className="product-card">
        <div className="product-card__image-wrap">
          <ProductImage src={product.imageUrl} alt={product.name} className="product-card__image" />
          {product.featured && <span className="product-card__badge">Unggulan</span>}
          {outOfStock && <span className="product-card__sold">Stok habis</span>}
        </div>
        <div className="product-card__body">
          <p className="product-card__path">{product.categoryName} · {product.submenuName}</p>
          <h3>{product.name}</h3>
          <p className="product-card__description">{product.description || 'Produk pilihan BUTET STORE.'}</p>
          <div className="product-card__footer">
            <strong>{formatRupiah(product.minimumPrice)}{hasVariants && <small> mulai</small>}</strong>
            <button className="button button--icon" type="button" onClick={add} disabled={outOfStock} aria-label={`Tambah ${product.name} ke keranjang`}>
              {hasVariants ? <Plus aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
            </button>
          </div>
        </div>
      </article>
      <ProductModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
