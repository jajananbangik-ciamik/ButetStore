import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Play, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatRupiah } from '../lib/format'
import { getVideoSource } from '../lib/utils'
import type { Product } from '../types'
import { ProductImage } from './ProductImage'
import { ProductModal } from './ProductModal'

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const activeVariants = product.variants.filter((variant) => variant.active)
  const hasVariants = activeVariants.length > 0
  const hasVideo = Boolean(getVideoSource(product.videoUrl))
  const outOfStock = hasVariants
    ? !activeVariants.some((variant) => !variant.trackStock || variant.stock > 0)
    : product.trackStock && product.stock <= 0

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }
    event.preventDefault()
    setModalOpen(true)
  }

  const add = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (hasVariants) {
      setModalOpen(true)
      return
    }
    addItem(product.id, undefined, 1)
    openCart()
  }

  return (
    <>
      <article className="product-card" role="button" tabIndex={0} aria-haspopup="dialog" aria-label={`Lihat detail ${product.name}`} onClick={() => setModalOpen(true)} onKeyDown={handleCardKeyDown}>
        <div className="product-card__image-wrap">
          <ProductImage src={product.imageUrl} alt={product.name} className="product-card__image" />
          {hasVideo && <button className="product-card__play" type="button" onClick={(event) => { event.stopPropagation(); setModalOpen(true) }} aria-label={`Putar video ${product.name}`}><Play aria-hidden="true" /></button>}
          {product.featured && <span className="product-card__badge">Unggulan</span>}
          {outOfStock && <span className="product-card__sold">Stok habis</span>}
        </div>
        <div className="product-card__body">
          <p className="product-card__path">{product.categoryName} · {product.submenuName}</p>
          <h3>{product.name}</h3>
          <p className="product-card__description">{product.description || 'Produk pilihan BUTET STORE.'}</p>
          <div className="product-card__footer">
            <strong>{formatRupiah(product.minimumPrice)}{hasVariants && <small> mulai</small>}</strong>
            <button className="button button--icon" type="button" onClick={add} disabled={outOfStock && !hasVariants} aria-label={hasVariants ? `Pilih varian ${product.name}` : `Tambah ${product.name} ke keranjang`}>
              {hasVariants ? <Plus aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
            </button>
          </div>
        </div>
      </article>
      <ProductModal product={product} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
