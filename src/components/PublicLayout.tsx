import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CartDrawer } from './CartDrawer'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { PromoPopup } from './PromoPopup'

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="site-shell">
      <Navbar />
      <main><Outlet /></main>
      <Footer />
      <CartDrawer />
      <PromoPopup />
    </div>
  )
}
