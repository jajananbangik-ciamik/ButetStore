import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, Edit3, Layers3, Plus, RefreshCw, Search, Shapes, Trash2 } from 'lucide-react'
import { ErrorNotice } from '../../components/ErrorNotice'
import { LoadingScreen } from '../../components/Loading'
import { ProductImage } from '../../components/ProductImage'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { adminPost } from '../../lib/adminApi'
import { formatRupiah } from '../../lib/format'
import type { CatalogData, Category, Product, Submenu } from '../../types'
import { CategoryForm } from './CategoryForm'
import { ProductForm } from './ProductForm'
import { SubmenuForm } from './SubmenuForm'

type Tab = 'categories' | 'submenus' | 'products'
type Editor = { type: Tab; value: Category | Submenu | Product | null } | null

const emptyCatalog: CatalogData = { categories: [], submenus: [], products: [], settings: { storeName: '', slogan: '', tagline: '', storePhone: '', paymentInstructions: '', qrisImageUrl: '', bankAccounts: [], bankName: '', bankAccountNumber: '', bankAccountHolder: '', shippingNote: '', promo: { active: false, title: '', message: '', imageUrl: '', link: '' } } }

export function AdminCatalogPage() {
  const { session } = useAdminAuth()
  const { refresh } = useCatalog()
  const [catalog, setCatalog] = useState<CatalogData>(emptyCatalog)
  const [tab, setTab] = useState<Tab>('categories')
  const [editor, setEditor] = useState<Editor>(null)
  const [query, setQuery] = useState('')
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
      const data = await adminPost<CatalogData>(session.sessionToken, 'getAdminCatalog')
      const settings = data.settings || emptyCatalog.settings
      const bankAccounts = Array.isArray(settings.bankAccounts) ? settings.bankAccounts : []
      setCatalog({ ...emptyCatalog, ...data, settings: { ...emptyCatalog.settings, ...settings, bankAccounts } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Katalog belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const afterSave = async () => {
    await Promise.all([load(), refresh()])
    setEditor(null)
  }

  const save = async (value: Record<string, unknown>) => {
    if (!session || !editor) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const action = editor.type === 'categories' ? 'saveCategory' : editor.type === 'submenus' ? 'saveSubmenu' : 'saveProduct'
      await adminPost(session.sessionToken, action, value)
      await afterSave()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Perubahan belum dapat disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (type: Tab, id: string, name: string) => {
    if (!session || !window.confirm(`Hapus ${name}?`)) {
      return
    }
    setError('')
    try {
      const action = type === 'categories' ? 'deleteCategory' : type === 'submenus' ? 'deleteSubmenu' : 'deleteProduct'
      await adminPost(session.sessionToken, action, { id })
      await Promise.all([load(), refresh()])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Data belum dapat dihapus.')
    }
  }

  const search = query.trim().toLowerCase()
  const visibleCategories = useMemo(() => catalog.categories.filter((item) => !search || item.name.toLowerCase().includes(search)), [catalog.categories, search])
  const visibleSubmenus = useMemo(() => catalog.submenus.filter((item) => !search || `${item.categoryName} ${item.name}`.toLowerCase().includes(search)), [catalog.submenus, search])
  const visibleProducts = useMemo(() => catalog.products.filter((item) => !search || `${item.categoryName} ${item.submenuName} ${item.name}`.toLowerCase().includes(search)), [catalog.products, search])

  if (loading && !catalog.categories.length) {
    return <LoadingScreen label="Memuat katalog…" />
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="eyebrow">Menu dan produk</p><h1>Katalog toko</h1><p>Kelola menu utama, submenu, produk, harga, stok, foto, dan unggulan.</p></div><button className="button button--soft" type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" /> Perbarui</button></header>
      <ErrorNotice message={error} />
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist">
          <button className={tab === 'categories' ? 'active' : ''} type="button" onClick={() => setTab('categories')}><Layers3 aria-hidden="true" /> Menu utama</button>
          <button className={tab === 'submenus' ? 'active' : ''} type="button" onClick={() => setTab('submenus')}><Shapes aria-hidden="true" /> Submenu</button>
          <button className={tab === 'products' ? 'active' : ''} type="button" onClick={() => setTab('products')}><Boxes aria-hidden="true" /> Produk</button>
        </div>
        <div className="admin-toolbar__actions"><label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari…" /></label><button className="button button--primary" type="button" onClick={() => setEditor({ type: tab, value: null })}><Plus aria-hidden="true" /> Tambah</button></div>
      </div>

      {tab === 'categories' && <section className="admin-panel"><div className="admin-list">{visibleCategories.map((category) => <article key={category.id}><span className="admin-list__number">{category.order}</span><div><strong>{category.name}</strong><small>/{category.slug} · {category.active ? 'Aktif' : 'Disembunyikan'}</small></div><div className="admin-list__actions"><button className="icon-button" type="button" onClick={() => setEditor({ type: 'categories', value: category })} aria-label={`Edit ${category.name}`}><Edit3 aria-hidden="true" /></button><button className="icon-button icon-button--danger" type="button" onClick={() => void remove('categories', category.id, category.name)} aria-label={`Hapus ${category.name}`}><Trash2 aria-hidden="true" /></button></div></article>)}{!visibleCategories.length && <p className="muted">Belum ada menu utama.</p>}</div></section>}

      {tab === 'submenus' && <section className="admin-panel"><div className="admin-list">{visibleSubmenus.map((submenu) => <article key={submenu.id}><span className="admin-list__number"><Shapes aria-hidden="true" /></span><div><strong>{submenu.name}</strong><small>{submenu.categoryName} · /{submenu.slug} · {submenu.active ? 'Aktif' : 'Disembunyikan'}</small></div><div className="admin-list__actions"><button className="icon-button" type="button" onClick={() => setEditor({ type: 'submenus', value: submenu })} aria-label={`Edit ${submenu.name}`}><Edit3 aria-hidden="true" /></button><button className="icon-button icon-button--danger" type="button" onClick={() => void remove('submenus', submenu.id, submenu.name)} aria-label={`Hapus ${submenu.name}`}><Trash2 aria-hidden="true" /></button></div></article>)}{!visibleSubmenus.length && <p className="muted">Belum ada submenu.</p>}</div></section>}

      {tab === 'products' && <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produk</th><th>Menu</th><th>Harga</th><th>Stok</th><th>Status</th><th /></tr></thead><tbody>{visibleProducts.map((product) => <tr key={product.id}><td><div className="table-product"><ProductImage src={product.imageUrl} alt={product.name} /><span><strong>{product.name}</strong><small>{product.variants.length ? `${product.variants.length} varian` : product.description || 'Tanpa deskripsi'}</small></span></div></td><td>{product.categoryName}<small>{product.submenuName}</small></td><td>{formatRupiah(product.minimumPrice)}<small>HPP {formatRupiah(product.hpp)}</small></td><td>{product.trackStock ? product.stock : 'Tidak dilacak'}</td><td><span className={`status-badge ${product.active ? 'status-badge--success' : 'status-badge--danger'}`}>{product.active ? 'Aktif' : 'Nonaktif'}</span>{product.featured && <small className="status-featured">Unggulan</small>}</td><td><div className="admin-list__actions"><button className="icon-button" type="button" onClick={() => setEditor({ type: 'products', value: product })} aria-label={`Edit ${product.name}`}><Edit3 aria-hidden="true" /></button><button className="icon-button icon-button--danger" type="button" onClick={() => void remove('products', product.id, product.name)} aria-label={`Hapus ${product.name}`}><Trash2 aria-hidden="true" /></button></div></td></tr>)}{!visibleProducts.length && <tr><td colSpan={6}><p className="muted">Belum ada produk.</p></td></tr>}</tbody></table></div></section>}

      {editor?.type === 'categories' && <CategoryForm open category={editor.value as Category | null} onClose={() => setEditor(null)} onSave={save} busy={saving} />}
      {editor?.type === 'submenus' && <SubmenuForm open submenu={editor.value as Submenu | null} categories={catalog.categories} onClose={() => setEditor(null)} onSave={save} busy={saving} />}
      {editor?.type === 'products' && <ProductForm open product={editor.value as Product | null} submenus={catalog.submenus} onClose={() => setEditor(null)} onSave={save} busy={saving} />}
    </div>
  )
}
