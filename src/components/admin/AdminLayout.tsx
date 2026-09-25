import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Boxes, ChartNoAxesCombined, LayoutDashboard, LogOut, Menu, PackageSearch, Settings, ShoppingBag, Store, X } from 'lucide-react'
import { Brand } from '../Brand'
import { useAdminAuth } from '../../context/AdminAuthContext'

const navigation = [
  { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/admin/katalog', label: 'Katalog', icon: Boxes },
  { to: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/admin/laporan', label: 'Laporan Keuntungan', icon: ChartNoAxesCombined },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
]

export function AdminLayout() {
  const { session, logout } = useAdminAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const current = navigation.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__brand"><Brand /><button className="icon-button admin-sidebar__close" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu"><X aria-hidden="true" /></button></div>
        <nav aria-label="Navigasi admin">
          {navigation.map((item) => {
            const Icon = item.icon
            return <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}><Icon aria-hidden="true" /> {item.label}</NavLink>
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <div><span><Store aria-hidden="true" /></span><p><strong>{session?.username}</strong><small>Administrator</small></p></div>
          <button className="icon-button" type="button" onClick={() => void logout()} aria-label="Keluar"><LogOut aria-hidden="true" /></button>
        </div>
      </aside>
      {open && <button className="admin-sidebar-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" />}
      <div className="admin-main">
        <header className="admin-header">
          <div><button className="menu-button" type="button" onClick={() => setOpen(true)} aria-label="Buka menu admin"><Menu aria-hidden="true" /></button><span><small>Administrasi</small><strong>{current?.label || 'BUTET STORE'}</strong></span></div>
          <Link className="admin-header__store" to="/"><PackageSearch aria-hidden="true" /> Lihat toko</Link>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
