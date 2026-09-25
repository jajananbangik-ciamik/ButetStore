import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, PackageSearch, ShoppingCart, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { Brand } from './Brand'

export function Navbar() {
  const { categories } = useCatalog()
  const { count, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <NavLink to="/" end>Beranda</NavLink>
          <div className="nav-dropdown" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
            <button type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
              Menu <ChevronDown aria-hidden="true" />
            </button>
            <div className="nav-dropdown__panel">
              {categories.map((category) => <Link key={category.id} to={`/menu/${category.slug}`}>{category.name}</Link>)}
            </div>
          </div>
          <NavLink to="/lacak">Lacak Pesanan</NavLink>
        </nav>
        <div className="site-header__actions">
          <button className="cart-button" type="button" onClick={openCart} aria-label={`Buka keranjang, ${count} item`}>
            <ShoppingCart aria-hidden="true" />
            <span>Keranjang</span>
            {count > 0 && <b>{count > 99 ? '99+' : count}</b>}
          </button>
          <button className="menu-button" type="button" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-label="Buka menu">
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Navigasi seluler">
          <NavLink to="/" end><PackageSearch aria-hidden="true" /> Beranda</NavLink>
          <p>Menu utama</p>
          {categories.map((category) => <NavLink key={category.id} to={`/menu/${category.slug}`}>{category.name}</NavLink>)}
          <NavLink to="/lacak">Lacak Pesanan</NavLink>
        </nav>
      )}
    </header>
  )
}
