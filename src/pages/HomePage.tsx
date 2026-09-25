import { Link } from 'react-router-dom'
import { ArrowRight, BedDouble, CookingPot, CupSoda, Package, ShieldCheck, Shirt, Snowflake, Sparkles, Truck } from 'lucide-react'
import { ErrorNotice } from '../components/ErrorNotice'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../context/CatalogContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const categoryIcons = [Snowflake, CupSoda, CookingPot, BedDouble, Shirt]

export function HomePage() {
  const { categories, submenus, products, settings, loading, error, refresh } = useCatalog()
  useDocumentTitle('Beranda')
  const featured = products.filter((product) => product.featured)

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <p className="eyebrow"><Sparkles aria-hidden="true" /> Belanja lebih mudah</p>
            <h1>{settings.slogan}</h1>
            <p className="hero__tagline">{settings.tagline}</p>
            <p className="hero__description">Pilih produk favorit, masukkan keranjang, lalu selesaikan pembayaran dengan QRIS atau transfer bank. Admin akan memverifikasi sebelum pesanan diproses.</p>
            <div className="hero__actions">
              <a className="button button--primary button--large" href="#produk-unggulan">Lihat produk <ArrowRight aria-hidden="true" /></a>
              <Link className="button button--soft button--large" to="/lacak">Lacak pesanan</Link>
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <span className="hero__bubble hero__bubble--pink" />
            <span className="hero__bubble hero__bubble--yellow" />
            <span className="hero__bubble hero__bubble--blue" />
            <div className="hero__bag"><Package /><strong>BUTET</strong><span>STORE</span></div>
            <div className="hero__sticker hero__sticker--top">Produk OK</div>
            <div className="hero__sticker hero__sticker--bottom">Harga Hemat!!</div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><p className="eyebrow">Mulai belanja</p><h2>Menu utama</h2></div>
          <p>Setiap menu memiliki submenu dan produk yang dapat dikelola admin.</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index] || Package
            const count = submenus.filter((submenu) => submenu.categoryId === category.id).length
            return (
              <Link className={`category-card category-card--${(index % 5) + 1}`} to={`/menu/${category.slug}`} key={category.id}>
                <span className="category-card__icon"><Icon aria-hidden="true" /></span>
                <div><h3>{category.name}</h3><p>{count ? `${count} submenu tersedia` : 'Submenu sedang disiapkan'}</p></div>
                <ArrowRight aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="section section--soft" id="produk-unggulan">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Pilihan admin</p><h2>Produk unggulan</h2></div>
            <p>Produk yang sedang direkomendasikan BUTET STORE.</p>
          </div>
          {error && <ErrorNotice message={error} action={<button className="button button--small" type="button" onClick={() => void refresh()}>Coba lagi</button>} />}
          {featured.length > 0 ? (
            <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="soft-empty"><Package aria-hidden="true" /><h3>{loading ? 'Memuat produk unggulan…' : 'Produk unggulan sedang disiapkan'}</h3><p>Admin dapat menambahkan produk dan menandainya sebagai unggulan.</p></div>
          )}
        </div>
      </section>

      <section className="section container">
        <div className="benefit-grid">
          <article><span><ShieldCheck aria-hidden="true" /></span><h3>Produk terkurasi</h3><p>Informasi produk, harga, dan stok ditampilkan dengan jelas.</p></article>
          <article><span><Sparkles aria-hidden="true" /></span><h3>Harga hemat</h3><p>Total dihitung otomatis dari pilihan Anda.</p></article>
          <article><span><Truck aria-hidden="true" /></span><h3>Dikirim setelah dibayar</h3><p>Admin memverifikasi pembayaran sebelum pesanan diproses.</p></article>
        </div>
      </section>
    </>
  )
}
