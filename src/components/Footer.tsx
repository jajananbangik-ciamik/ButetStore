import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useCatalog } from '../context/CatalogContext'
import { Brand } from './Brand'

export function Footer() {
  const { settings, categories } = useCatalog()
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Brand />
          <p>{settings.slogan}. {settings.tagline}</p>
        </div>
        <div>
          <h2>Menu</h2>
          {categories.map((category) => <Link key={category.id} to={`/menu/${category.slug}`}>{category.name}</Link>)}
        </div>
        <div>
          <h2>Bantuan</h2>
          <Link to="/lacak">Lacak pesanan</Link>
          <Link to="/checkout">Checkout</Link>
          {settings.storePhone && <a href={`https://wa.me/${settings.storePhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /> WhatsApp</a>}
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} BUTET STORE</span>
        <span>Produk OK, Harga Hemat!!</span>
      </div>
    </footer>
  )
}
