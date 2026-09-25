import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, PackageSearch, Search, Shapes } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ErrorNotice } from '../components/ErrorNotice'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../context/CatalogContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPage } from './NotFoundPage'

export function MenuPage() {
  const { categorySlug, submenuSlug } = useParams()
  const { categories, submenus, products, error, refresh } = useCatalog()
  const [query, setQuery] = useState('')
  const category = categories.find((item) => item.slug === categorySlug)
  const submenusForCategory = submenus.filter((item) => item.categoryId === category?.id)
  const selectedSubmenu = submenuSlug ? submenusForCategory.find((item) => item.slug === submenuSlug) : undefined
  useDocumentTitle(category?.name || 'Menu')
  const visibleProducts = useMemo(() => products.filter((product) => {
    if (selectedSubmenu && product.submenuId !== selectedSubmenu.id) {
      return false
    }
    if (!selectedSubmenu && submenuSlug) {
      return false
    }
    const search = query.trim().toLowerCase()
    return !search || [product.name, product.description, product.categoryName, product.submenuName].some((value) => value.toLowerCase().includes(search))
  }), [products, query, selectedSubmenu, submenuSlug])

  if (!category) {
    return <NotFoundPage />
  }

  return (
    <div className="page-section container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/"><ArrowLeft aria-hidden="true" /> Beranda</Link>
        <ChevronRight aria-hidden="true" />
        <span>{category.name}</span>
        {selectedSubmenu && <><ChevronRight aria-hidden="true" /><span>{selectedSubmenu.name}</span></>}
      </nav>
      <header className="page-heading">
        <p className="eyebrow">Menu utama</p>
        <h1>{category.name}</h1>
        <p>{selectedSubmenu?.description || 'Pilih submenu untuk melihat produk yang tersedia.'}</p>
      </header>

      {!selectedSubmenu && (
        <section className="submenu-section">
          <h2>Submenu {category.name}</h2>
          {submenusForCategory.length ? (
            <div className="submenu-grid">
              {submenusForCategory.map((submenu) => (
                <Link key={submenu.id} to={`/menu/${category.slug}/${submenu.slug}`} className="submenu-card">
                  <span><Shapes aria-hidden="true" /></span>
                  <div><h3>{submenu.name}</h3><p>{submenu.description || `${products.filter((product) => product.submenuId === submenu.id).length} produk`}</p></div>
                  <ChevronRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Shapes} title="Submenu belum tersedia" description="Admin belum menambahkan submenu untuk menu ini." />
          )}
        </section>
      )}

      {selectedSubmenu && (
        <section className="catalog-section">
          <div className="catalog-toolbar">
            <div><p className="eyebrow">Submenu</p><h2>{selectedSubmenu.name}</h2></div>
            <label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk…" aria-label="Cari produk" /></label>
          </div>
          {error && <ErrorNotice message={error} action={<button className="button button--small" type="button" onClick={() => void refresh()}>Coba lagi</button>} />}
          {visibleProducts.length ? (
            <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <EmptyState icon={PackageSearch} title="Produk belum tersedia" description="Belum ada produk aktif pada submenu ini." action={<Link className="button button--soft" to={`/menu/${category.slug}`}>Kembali ke submenu</Link>} />
          )}
        </section>
      )}
    </div>
  )
}
