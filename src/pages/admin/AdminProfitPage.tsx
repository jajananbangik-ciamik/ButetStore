import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Banknote, Boxes, Coins, Percent, RefreshCw, TrendingUp } from 'lucide-react'
import { ErrorNotice } from '../../components/ErrorNotice'
import { LoadingScreen } from '../../components/Loading'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPost } from '../../lib/adminApi'
import { formatNumber, formatPercent, formatRupiah } from '../../lib/format'
import type { ProfitReport } from '../../types'

const periods = [
  { value: 'TODAY', label: 'Hari ini' },
  { value: '7D', label: '7 hari' },
  { value: '30D', label: '30 hari' },
  { value: 'MONTH', label: 'Bulan ini' },
  { value: 'ALL', label: 'Semua periode' },
] as const

export function AdminProfitPage() {
  const { session } = useAdminAuth()
  const [period, setPeriod] = useState<ProfitReport['period']>('30D')
  const [report, setReport] = useState<ProfitReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!session) {
      return
    }
    setLoading(true)
    setError('')
    try {
      setReport(await adminPost<ProfitReport>(session.sessionToken, 'profitReport', { period }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Laporan belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [session, period])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !report) {
    return <LoadingScreen label="Menghitung laporan keuntungan…" />
  }

  const summary = report?.summary
  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="eyebrow">Khusus admin</p><h1>Laporan Keuntungan</h1><p>Hanya pesanan dengan pembayaran terverifikasi yang dihitung.</p></div><div className="admin-header-actions"><label className="field field--compact"><span>Periode</span><select value={period} onChange={(event) => setPeriod(event.target.value as ProfitReport['period'])}>{periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button className="button button--soft" type="button" onClick={() => void load()}><RefreshCw aria-hidden="true" /> Perbarui</button></div></header>
      <ErrorNotice message={error} />
      {summary && <>
        {summary.missingHppItems > 0 && <div className="notice notice--warning"><AlertTriangle aria-hidden="true" /><span><strong>HPP belum lengkap.</strong> {formatNumber(summary.missingHppItems)} item terjual belum memiliki HPP, sehingga laba dapat terlihat terlalu besar.</span></div>}
        <div className="profit-stat-grid">
          <article><span><Banknote aria-hidden="true" /></span><small>Omzet</small><strong>{formatRupiah(summary.revenue)}</strong><p>{formatNumber(summary.orderCount)} pesanan terverifikasi</p></article>
          <article><span><Boxes aria-hidden="true" /></span><small>HPP</small><strong>{formatRupiah(summary.hpp)}</strong><p>{formatNumber(summary.quantity)} item terjual</p></article>
          <article className="profit-stat--accent"><span><TrendingUp aria-hidden="true" /></span><small>Laba bersih</small><strong>{formatRupiah(summary.profit)}</strong><p>Omzet dikurangi HPP</p></article>
          <article><span><Percent aria-hidden="true" /></span><small>Margin</small><strong>{formatPercent(summary.margin)}</strong><p>Laba dari omzet</p></article>
        </div>
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><h2>Laba per produk</h2><p>Rincian kontribusi produk pada periode terpilih.</p></div><Coins aria-hidden="true" /></div>
          {report?.products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produk</th><th>Qty</th><th>Omzet</th><th>HPP</th><th>Laba</th><th>Margin</th></tr></thead><tbody>{report.products.map((product) => <tr key={product.productId}><td><strong>{product.productName}</strong></td><td>{formatNumber(product.quantity)}</td><td>{formatRupiah(product.revenue)}</td><td>{formatRupiah(product.hpp)}</td><td><strong className={product.profit >= 0 ? 'text-success' : 'text-danger'}>{formatRupiah(product.profit)}</strong></td><td>{formatPercent(product.margin)}</td></tr>)}</tbody></table></div> : <p className="muted">Belum ada penjualan terverifikasi pada periode ini.</p>}
        </section>
      </>}
    </div>
  )
}
