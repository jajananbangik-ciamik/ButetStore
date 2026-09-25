import { useEffect, useState, type FormEvent } from 'react'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { Modal } from '../../components/Modal'
import type { Category, Submenu } from '../../types'

export function SubmenuForm({ submenu, categories, open, onClose, onSave, busy }: { submenu: Submenu | null; categories: Category[]; open: boolean; onClose: () => void; onSave: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [order, setOrder] = useState(0)
  const [active, setActive] = useState(true)

  useEffect(() => {
    setCategoryId(submenu?.categoryId || categories[0]?.id || '')
    setName(submenu?.name || '')
    setSlug(submenu?.slug || '')
    setDescription(submenu?.description || '')
    setImageUrl(submenu?.imageUrl || '')
    setOrder(submenu?.order || 0)
    setActive(submenu?.active ?? true)
  }, [submenu, categories, open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void onSave({ id: submenu?.id || '', categoryId, name, slug, description, imageUrl, order, active })
  }

  return (
    <Modal open={open} title={submenu ? 'Edit submenu' : 'Tambah submenu'} onClose={onClose} size="medium">
      <form className="form-stack" onSubmit={submit}>
        <label className="field"><span>Menu utama</span><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="field"><span>Nama submenu</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Frozen food" /></label>
        <label className="field"><span>Slug URL</span><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="otomatis dari nama" /></label>
        <label className="field"><span>Deskripsi</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <ImageUploadField label="Foto submenu" value={imageUrl} onChange={setImageUrl} />
        <label className="field"><span>Urutan</span><input type="number" min={0} value={order} onChange={(event) => setOrder(Number(event.target.value) || 0)} /></label>
        <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span>Tampilkan di toko</span></label>
        <div className="form-actions"><button className="button button--soft" type="button" onClick={onClose}>Batal</button><button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan submenu'}</button></div>
      </form>
    </Modal>
  )
}
