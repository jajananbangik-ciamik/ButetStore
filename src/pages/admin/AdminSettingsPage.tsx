import { useEffect, useState, type FormEvent } from 'react'
import { Eye, KeyRound, Save, ShieldCheck, Store, WalletCards } from 'lucide-react'
import { ErrorNotice } from '../../components/ErrorNotice'
import { ImageUploadField } from '../../components/admin/ImageUploadField'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { adminPost } from '../../lib/adminApi'
import type { StoreSettings } from '../../types'

export function AdminSettingsPage() {
  const { session, logout } = useAdminAuth()
  const { settings, refresh } = useCatalog()
  const [form, setForm] = useState<StoreSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const setValue = (key: keyof StoreSettings, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))
  const setPromo = (key: keyof StoreSettings['promo'], value: string | boolean) => setForm((current) => ({ ...current, promo: { ...current.promo, [key]: value } }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) {
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await adminPost(session.sessionToken, 'saveSettings', {
        STORE_NAME: form.storeName,
        STORE_SLOGAN: form.slogan,
        STORE_TAGLINE: form.tagline,
        STORE_PHONE: form.storePhone,
        PAYMENT_INSTRUCTIONS: form.paymentInstructions,
        QRIS_IMAGE_URL: form.qrisImageUrl,
        BANK_NAME: form.bankName,
        BANK_ACCOUNT_NUMBER: form.bankAccountNumber,
        BANK_ACCOUNT_HOLDER: form.bankAccountHolder,
        SHIPPING_NOTE: form.shippingNote,
        PROMO_ACTIVE: form.promo.active,
        PROMO_TITLE: form.promo.title,
        PROMO_MESSAGE: form.promo.message,
        PROMO_IMAGE_URL: form.promo.imageUrl,
        PROMO_LINK: form.promo.link,
      })
      await refresh()
      setSuccess('Pengaturan toko berhasil disimpan.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pengaturan belum dapat disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!session) {
      return
    }
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak sama.')
      return
    }
    setPasswordSaving(true)
    try {
      const result = await adminPost<{ message: string }>(session.sessionToken, 'changePassword', { currentPassword, newPassword })
      setPasswordMessage(result.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await logout()
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : 'Password belum dapat diganti.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header"><div><p className="eyebrow">Konfigurasi toko</p><h1>Pengaturan</h1><p>Atur informasi toko, pembayaran, promosi, dan keamanan admin.</p></div></header>
      <div className="settings-layout">
        <form className="admin-panel settings-form" onSubmit={save}>
          <div className="admin-panel__heading"><div><h2><Store aria-hidden="true" /> Identitas toko</h2><p>Informasi yang tampil di beranda.</p></div></div>
          <ErrorNotice message={error} />
          {success && <div className="notice notice--success"><ShieldCheck aria-hidden="true" /> {success}</div>}
          <div className="form-grid">
            <label className="field"><span>Nama toko</span><input required value={form.storeName} onChange={(event) => setValue('storeName', event.target.value)} /></label>
            <label className="field"><span>Nomor WhatsApp</span><input value={form.storePhone} onChange={(event) => setValue('storePhone', event.target.value)} placeholder="08xxxxxxxxxx" /></label>
            <label className="field field--full"><span>Semboyan utama</span><input value={form.slogan} onChange={(event) => setValue('slogan', event.target.value)} /></label>
            <label className="field field--full"><span>Tagline</span><input value={form.tagline} onChange={(event) => setValue('tagline', event.target.value)} /></label>
          </div>
          <div className="admin-panel__heading"><div><h2><WalletCards aria-hidden="true" /> Pembayaran</h2><p>QRIS dan rekening dapat diisi tanpa mengubah kode aplikasi.</p></div></div>
          <ImageUploadField label="Gambar QRIS" value={form.qrisImageUrl} onChange={(value) => setValue('qrisImageUrl', value)} />
          <div className="form-grid">
            <label className="field"><span>Nama bank</span><input value={form.bankName} onChange={(event) => setValue('bankName', event.target.value)} placeholder="Contoh: Bank XYZ" /></label>
            <label className="field"><span>Nomor rekening</span><input value={form.bankAccountNumber} onChange={(event) => setValue('bankAccountNumber', event.target.value)} /></label>
            <label className="field field--full"><span>Atas nama</span><input value={form.bankAccountHolder} onChange={(event) => setValue('bankAccountHolder', event.target.value)} /></label>
            <label className="field field--full"><span>Instruksi pembayaran</span><textarea rows={3} value={form.paymentInstructions} onChange={(event) => setValue('paymentInstructions', event.target.value)} /></label>
            <label className="field field--full"><span>Catatan ongkir</span><input value={form.shippingNote} onChange={(event) => setValue('shippingNote', event.target.value)} /></label>
          </div>
          <div className="admin-panel__heading"><div><h2><Eye aria-hidden="true" /> Promosi / popup</h2><p>Tampilkan kabar baru atau promotion di beranda.</p></div></div>
          <label className="check-field"><input type="checkbox" checked={form.promo.active} onChange={(event) => setPromo('active', event.target.checked)} /><span>Aktifkan popup promosi</span></label>
          <div className="form-grid">
            <label className="field"><span>Judul popup</span><input value={form.promo.title} onChange={(event) => setPromo('title', event.target.value)} /></label>
            <label className="field"><span>Tautan popup</span><input value={form.promo.link} onChange={(event) => setPromo('link', event.target.value)} placeholder="https://…" /></label>
            <label className="field field--full"><span>Pesan popup</span><textarea rows={3} value={form.promo.message} onChange={(event) => setPromo('message', event.target.value)} /></label>
          </div>
          <ImageUploadField label="Gambar promosi" value={form.promo.imageUrl} onChange={(value) => setPromo('imageUrl', value)} />
          <div className="form-actions"><button className="button button--primary" type="submit" disabled={saving}><Save aria-hidden="true" /> {saving ? 'Menyimpan…' : 'Simpan pengaturan'}</button></div>
        </form>

        <form className="admin-panel password-panel" onSubmit={changePassword}>
          <div className="admin-panel__heading"><div><h2><KeyRound aria-hidden="true" /> Keamanan admin</h2><p>Ganti password setelah membaca kredensial awal.</p></div></div>
          {passwordError && <ErrorNotice message={passwordError} />}
          {passwordMessage && <div className="notice notice--success"><ShieldCheck aria-hidden="true" /> {passwordMessage}</div>}
          <label className="field"><span>Password saat ini</span><input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="field"><span>Password baru</span><input required minLength={10} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label className="field"><span>Konfirmasi password baru</span><input required minLength={10} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button className="button button--soft" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Mengganti…' : 'Ganti password'}</button>
          <p className="muted">Semua sesi admin akan dikeluarkan setelah password diganti.</p>
        </form>
      </div>
    </div>
  )
}
