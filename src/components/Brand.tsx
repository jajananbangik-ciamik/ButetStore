import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="BUTET STORE — Beranda">
      <img className="brand__mark" src="./favicon.svg" alt="" />
      <span className="brand__copy">
        <strong>BUTET STORE</strong>
        {!compact && <small>Solusi belanja sehari-hari</small>}
      </span>
    </Link>
  )
}
