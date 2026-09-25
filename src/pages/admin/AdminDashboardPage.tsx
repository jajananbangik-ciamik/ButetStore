import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Banknote, CheckCircle2, Clock3, PackageCheck, RefreshCw, ShoppingBag, Truck } from 'lucide-react'
import { ErrorNotice } from '../../components/ErrorNotice'
import { LoadingScreen } from '../../components/Loading'
import { StatusBadge } from '../../components/StatusBadge'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPost } from '../../lib/adminApi'
import { formatDateTime, formatRupiah } from '../../lib/format'
import type { AdminDashboard } from '../../types'

export function AdminDashboardPage() {
  const { session } = useAdminAuth()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session) {
      return
    }
    setLoading(true)
    setError('')
    try {
      setData(await adminPost<AdminDashboard>(session.sessionToken, 'adminDashboard'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ringkasan belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return <LoadingScreen label="Memuat ringkasan…" />
  }

  const stats = data?.stats
  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="eyebrow">Hari ini</p><h1>Ringkasan toko</h1><p>Pantau pesanan yang menunggu verifikasi dan proses pengiriman.</p></div><button className="button button--soft" type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" /> Perbarui</button></header>
      <ErrorNotice message={error} />
      {stats && <div className="admin-stat-grid">
        <article><span className="admin-stat__icon admin-stat__icon--yellow"><Clock3 aria-hidden="true" /></span><div><small>Menunggu bayar</small><strong>{stats.pendingPayment}</strong><p>perlu verifikasi</p></div></article>
        <article><span className="admin-stat__icon admin-stat__icon--blue"><Banknote aria-hidden="true" /></span><div><small>Sudah dibayar</small><strong>{stats.paid}</strong><p>siap dipesan</p></div></article>
        <article><span className="admin-stat__icon admin-stat__icon--purple"><Truck aria-hidden="true" /></span><div><small>Proses kirim</small><strong>{stats.processing}</strong><p>dipesan atau dikirim</p></div></article>
        <article><span className="admin-stat__icon admin-stat__icon--green"><CheckCircle2 aria-hidden="true" /></span><div><small>Selesai</small><strong>{stats.completed}</strong><p>total pesanan</p></div></article>
        <article><span className="admin-stat__icon admin-stat__icon--pink"><ShoppingBag aria-hidden="true" /></span><div><small>Pesanan hari ini</small><strong>{stats.todayOrders}</strong><p>dibuat hari ini</p></div></article>
        <article><span className="admin-stat__icon admin-stat__icon--mint"><PackageCheck aria-hidden="true" /></span><div><small>Omzet terverifikasi</small><strong>{formatRupiah(stats.todayRevenue)}</strong><p>pembayaran terverifikasi</p></div></article>
      </div>}
      <section className="admin-panel">
        <div className="admin-panel__heading"><div><h2>Pesanan terbaru</h2><p>Delapan pesanan terakhir.</p></div><Link className="button button--small" to="/admin/pesanan">Semua pesanan <ArrowRight aria-hidden="true" /></Link></div>
        {data?.recentOrders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pesanan</th><th>Pembeli</th><th>Total</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td><strong>{order.code}</strong><small>{order.itemCount} item</small></td><td>{order.customerName}<small>{order.fullPhone}</small></td><td>{formatRupiah(order.total)}</td><td><StatusBadge status={order.status} /></td><td>{formatDateTime(order.createdAt)}</td></tr>)}</tbody></table></div> : <p className="muted">Belum ada pesanan.</p>}
      </section>
    </div>
  )
}
