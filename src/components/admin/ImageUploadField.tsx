import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPost } from '../../lib/adminApi'
import { compressImageFile, type ImageCompressionProfile } from '../../lib/api'
import type { ImageUpload } from '../../types'

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }
  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`
}

export function ImageUploadField({ value, onChange, label, compression = 'standard' }: { value: string; onChange: (url: string) => void; label: string; compression?: ImageCompressionProfile }) {
  const { session } = useAdminAuth()
  const input = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session) {
      return
    }
    setLoading(true)
    setBusyLabel('Menyiapkan gambar…')
    setInfo('')
    setError('')
    try {
      const prepared = await compressImageFile(file, compression)
      setBusyLabel('Mengunggah…')
      const result = await adminPost<ImageUpload>(session.sessionToken, 'uploadImage', { dataUrl: prepared.dataUrl })
      onChange(result.thumbnailUrl || result.url)
      setInfo(prepared.compressedSize < prepared.originalSize ? `Dikompres dari ${formatBytes(prepared.originalSize)} menjadi ${formatBytes(prepared.compressedSize)}.` : `Siap diunggah (${formatBytes(prepared.compressedSize)}).`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gambar gagal diunggah.')
    } finally {
      setLoading(false)
      setBusyLabel('')
      event.target.value = ''
    }
  }

  return (
    <div className="image-upload-field">
      <span>{label}</span>
      {value && <img src={value} alt="Pratinjau" />}
      <div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void upload(event)} hidden />
        <button className="button button--soft button--small" type="button" onClick={() => input.current?.click()} disabled={loading}>{loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />} {loading ? busyLabel : value ? 'Ganti gambar' : 'Unggah gambar'}</button>
        {value && <button className="icon-button" type="button" onClick={() => { onChange(''); setInfo('') }} aria-label="Hapus gambar"><Trash2 aria-hidden="true" /></button>}
      </div>
      {error && <small className="field-error">{error}</small>}
      {info && <small className="muted">{info}</small>}
      <small className="muted">{compression === 'qris' ? 'QRIS dijaga dengan kualitas tinggi dan tetap diperkecil jika diperlukan.' : 'Gambar besar otomatis diperkecil dan dikompresi sebelum upload.'}</small>
    </div>
  )
}
