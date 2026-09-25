import { useState, type FormEvent } from 'react'
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react'
import { Brand } from '../../components/Brand'
import { ErrorNotice } from '../../components/ErrorNotice'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function AdminLoginPage() {
  const { login } = useAdminAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useDocumentTitle('Login Admin')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Login gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login__card">
        <Brand />
        <div className="admin-login__heading"><span><LockKeyhole aria-hidden="true" /></span><div><p className="eyebrow">Akses terbatas</p><h1>Login admin</h1><p>Kelola katalog, pembayaran, pesanan, dan laporan keuntungan.</p></div></div>
        <ErrorNotice message={error} />
        <form onSubmit={submit} className="form-stack">
          <label className="field"><span>Username</span><input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label className="field"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="button button--primary button--full" type="submit" disabled={loading}>{loading ? 'Memeriksa…' : <><LogIn aria-hidden="true" /> Masuk</>}</button>
        </form>
        <p className="admin-login__hint"><ShieldCheck aria-hidden="true" /> Sesi admin berakhir otomatis setelah tidak aktif.</p>
      </section>
    </main>
  )
}
