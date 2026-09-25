import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import type { Category } from '../../types'

export function CategoryForm({ category, open, onClose, onSave, busy }: { category: Category | null; open: boolean; onClose: () => void; onSave: (value: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [order, setOrder] = useState(0)
  const [active, setActive] = useState(true)

  useEffect(() => {
    setName(category?.name || '')
    setSlug(category?.slug || '')
    setOrder(category?.order || 0)
    setActive(category?.active ?? true)
  }, [category, open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void onSave({ id: category?.id || '', name, slug, order, active })
  }

  return (
    <Modal open={open} title={category ? 'Edit menu utama' : 'Tambah menu utama'} onClose={onClose} size="small">
      <form className="form-stack" onSubmit={submit}>
        <label className="field"><span>Nama menu</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Contoh: Jajanan Frozen" /></label>
        <label className="field"><span>Slug URL</span><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="otomatis dari nama" /></label>
        <label className="field"><span>Urutan</span><input type="number" min={0} value={order} onChange={(event) => setOrder(Number(event.target.value) || 0)} /></label>
        <label className="check-field"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span>Tampilkan di toko</span></label>
        <div className="form-actions"><button className="button button--soft" type="button" onClick={onClose}>Batal</button><button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan menu'}</button></div>
      </form>
    </Modal>
  )
}
