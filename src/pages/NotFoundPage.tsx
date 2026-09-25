import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Halaman tidak ditemukan')
  return (
    <div className="page-section container">
      <div className="empty-state"><span className="empty-state__icon"><SearchX aria-hidden="true" /></span><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia.</p><Link className="button button--primary" to="/"><Home aria-hidden="true" /> Kembali ke beranda</Link></div>
    </div>
  )
}
