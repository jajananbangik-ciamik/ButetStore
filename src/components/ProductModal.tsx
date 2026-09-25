import { useEffect, useMemo, useState } from 'react'
import { Minus, Play, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatRupiah } from '../lib/format'
import { getVideoSource } from '../lib/utils'
import type { Product } from '../types'
import { Modal } from './Modal'
import { ProductImage } from './ProductImage'

export function ProductModal({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  const { addItem, openCart } = useCart()
  const availableVariants = useMemo(() => product?.variants.filter((variant) => variant.active) || [], [product])
  const videoSource = useMemo(() => getVideoSource(product?.videoUrl), [product])
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!open || !product) {
      return
    }
    setVariantId(availableVariants.length === 1 ? availableVariants[0].id : '')
    setQuantity(1)
  }, [open, product, availableVariants])

  if (!product) {
    return null
  }

  const selectedVariant = availableVariants.find((variant) => variant.id === variantId)
  const selectedStock = selectedVariant?.trackStock ? selectedVariant.stock : product.trackStock ? product.stock : null
  const maxQuantity = selectedStock === null ? 99 : Math.max(1, Math.min(99, selectedStock))
  const requiresVariant = availableVariants.length > 0
  const canAdd = (!requiresVariant || Boolean(variantId)) && (selectedStock === null || selectedStock > 0)

  const submit = () => {
    if (!canAdd) {
      return
    }
    addItem(product.id, variantId || undefined, quantity)
    onClose()
    openCart()
  }

  return (
    <Modal open={open} title={product.name} onClose={onClose} size="medium">
      <div className="product-modal">
        <ProductImage src={product.imageUrl} alt={product.name} className="product-modal__image" />
        <div className="product-modal__content">
          <p className="eyebrow">{product.categoryName} · {product.submenuName}</p>
          <p className="product-modal__description">{product.description || 'Pilih varian dan jumlah sebelum memasukkan ke keranjang.'}</p>
          {videoSource && (
            <div className="product-video">
              <div className="product-video__heading"><Play aria-hidden="true" /> Video produk</div>
              {videoSource.type === 'embed'
                ? <iframe className="product-video__frame" src={videoSource.src} title={`Video ${product.name}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                : <video className="product-video__frame" src={videoSource.src} controls preload="metadata" poster={product.imageUrl || undefined} />}
            </div>
          )}
          {requiresVariant && (
            <fieldset className="variant-fieldset">
              <legend>Pilih varian</legend>
              <div className="variant-list">
                {availableVariants.map((variant) => {
                  const disabled = variant.trackStock && variant.stock <= 0
                  return (
                    <label className={`variant-option ${variantId === variant.id ? 'variant-option--selected' : ''}`} key={variant.id}>
                      <input
                        type="radio"
                        name="product-variant"
                        value={variant.id}
                        checked={variantId === variant.id}
                        disabled={disabled}
                        onChange={() => setVariantId(variant.id)}
                      />
                      <span>
                        <strong>{variant.name}</strong>
                        <small>{formatRupiah(variant.price)}</small>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}
          <div className="quantity-row">
            <span>Jumlah</span>
            <div className="quantity-control">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Kurangi jumlah"><Minus aria-hidden="true" /></button>
              <input type="number" min={1} max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))} />
              <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} aria-label="Tambah jumlah"><Plus aria-hidden="true" /></button>
            </div>
          </div>
          {selectedStock !== null && <small className="muted">Stok tersedia: {selectedStock}</small>}
          <div className="product-modal__footer">
            <strong>{formatRupiah((selectedVariant?.price || product.price) * quantity)}</strong>
            <button className="button button--primary" type="button" disabled={!canAdd} onClick={submit}>
              <ShoppingBag aria-hidden="true" /> Tambah ke keranjang
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
