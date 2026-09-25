import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Modal } from '../../components/Modal'
import type { Product, ProductVariant, Submenu } from '../../types'

type VariantForm = Omit<ProductVariant, 'productId' | 'createdAt' | 'updatedAt'>

function toVariantForm(variant?: ProductVariant): VariantForm {
  return variant ? { id: variant.id, name: variant.name, price: variant.price, hpp: variant.hpp, trackStock: variant.trackStock, stock: variant.stock, active: variant.active, order: variant.order } : { id: '', name: '', price: 0, hpp: 0, trackStock: true, stock: 0, active: true, order: 1 }
}

export function ProductForm({ product, submenus, open, onClose, onSave, busy }: { product: Product | null; submenus: Submenu[]; open: boolean; onClose: () => void; onSave: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [submenuId, setSubmenuId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [hpp, setHpp] = useState(0)
  const [stock, setStock] = useState(0)
  const [trackStock, setTrackStock] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [active, setActive] = useState(true)
  const [order, setOrder] = useState(0)
  const [variants, setVariants] = useState<VariantForm[]>([])

  useEffect(() => {
    setSubmenuId(product?.submenuId || submenus[0]?.id || '')
    setName(product?.name || '')
    setSlug(product?.slug || '')
    setDescription(product?.description || '')
    setPrice(product?.price || 0)
    setHpp(product?.hpp || 0)
    setStock(product?.stock || 0)
    setTrackStock(product?.trackStock ?? true)
    setImageUrl(product?.imageUrl || '')
    setVideoUrl(product?.videoUrl || '')
    setFeatured(product?.featured ?? false)
    setActive(product?.active ?? true)
    setOrder(product?.order || 0)
    setVariants(product?.variants.map(toVariantForm) || [])
  }, [product, submenus, open])

  const updateVariant = (index: number, values: Partial<VariantForm>) => {
    setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...values } : variant))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void onSave({ id: product?.id || '', submenuId, name, slug, description, price, hpp, stock, trackStock, imageUrl, videoUrl, featured, active, order, variants })
  }

  return (
    <Modal open={open} title={product ? 'Edit produk' : 'Tambah produk'} onClose={onClose} size="large">
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>Submenu</span><select required value={submenuId} onChange={(event) => setSubmenuId(event.target.value)}>{submenus.map((submenu) => <option key={submenu.id} value={submenu.id}>{submenu.categoryName} · {submenu.name}</option>)}</select></label>
          <label className="field"><span>Nama produk</span><input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Slug URL</span><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="otomatis dari nama" /></label>
          <label className="field"><span>Urutan</span><input type="number" min={0} value={order} onChange={(event) => setOrder(Number(event.target.value) || 0)} /></label>
          <label className="field"><span>Harga dasar (Rp)</span><input required type="number" min={0} value={price} onChange={(event) => setPrice(Number(event.target.value) || 0)} /></label>
          <label className="field"><span>HPP / modal (Rp)</span><input required type="number" min={0} value={hpp} onChange={(event) => setHpp(Number(event.target.value) || 0)} /></label>
        </div>
        <label className="field"><span>Deskripsi</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <ImageUploadField label="Foto produk" value={imageUrl} onChange={setImageUrl} />
        <label className="field field--full"><span>Link video (opsional)</span><input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtu.be/... atau https://.../video.mp4" /></label>
        <small className="muted">Mendukung YouTube, Vimeo, atau file video HTTPS seperti MP4 dan WebM.</small>
        <div className="form-grid form-grid--compact">
          <label className="check-field"><input type="checkbox" checked={trackStock} onChange={(event) => setTrackStock(event.target.checked)} /><span>Lacak stok produk tanpa varian</span></label>
          <label className="field"><span>Stok produk</span><input type="number" min={0} value={stock} disabled={!trackStock} onChange={(event) => setStock(Number(event.target.value) || 0)} /></label>
          <label className="check-field"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /><span>Tampilkan di Produk Unggulan</span></label>
          <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span>Produk aktif</span></label>
        </div>
        <section className="variant-editor">
          <div><h3>Varian</h3><p>Kosongkan jika produk hanya memiliki satu harga.</p></div>
          {variants.map((variant, index) => <div className="variant-editor__row" key={variant.id || index}><input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} placeholder="Nama varian" /><input type="number" min={0} value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) || 0 })} placeholder="Harga" /><input type="number" min={0} value={variant.hpp} onChange={(event) => updateVariant(index, { hpp: Number(event.target.value) || 0 })} placeholder="HPP" /><input type="number" min={0} value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) || 0 })} placeholder="Stok" /><label className="check-field"><input type="checkbox" checked={variant.trackStock} onChange={(event) => updateVariant(index, { trackStock: event.target.checked })} /><span>Stok</span></label><button className="icon-button" type="button" onClick={() => setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))} aria-label="Hapus varian"><Trash2 aria-hidden="true" /></button></div>)}
          <button className="button button--soft button--small" type="button" onClick={() => setVariants((current) => [...current, toVariantForm({ id: '', productId: '', name: '', price: 0, hpp: 0, trackStock: true, stock: 0, active: true, order: current.length + 1 })])}><Plus aria-hidden="true" /> Tambah varian</button>
        </section>
        <div className="form-actions"><button className="button button--soft" type="button" onClick={onClose}>Batal</button><button className="button button--primary" type="submit" disabled={busy || !submenus.length}>{busy ? 'Menyimpan…' : 'Simpan produk'}</button></div>
      </form>
    </Modal>
  )
}
