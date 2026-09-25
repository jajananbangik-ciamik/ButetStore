import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingScreen } from './components/Loading'
import { PublicLayout } from './components/PublicLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { MenuPage } from './pages/MenuPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { TrackOrderPage } from './pages/TrackOrderPage'
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminProfitPage } from './pages/admin/AdminProfitPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'

function AdminGuard() {
  const { session, loading } = useAdminAuth()
  if (loading) {
    return <LoadingScreen label="Memeriksa sesi admin…" />
  }
  return session ? <AdminLayout /> : <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu/:categorySlug" element={<MenuPage />} />
        <Route path="menu/:categorySlug/:submenuSlug" element={<MenuPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="lacak" element={<TrackOrderPage />} />
        <Route path="pesanan/:orderId" element={<OrderSuccessPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminGuard />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="katalog" element={<AdminCatalogPage />} />
        <Route path="pesanan" element={<AdminOrdersPage />} />
        <Route path="laporan" element={<AdminProfitPage />} />
        <Route path="pengaturan" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <CatalogProvider>
      <CartProvider>
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </CartProvider>
    </CatalogProvider>
  )
}
