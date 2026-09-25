import { useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPost } from '../../lib/adminApi'
import { fileToDataUrl } from '../../lib/api'
import type { ImageUpload } from '../../types'

export function ImageUploadField({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const { session } = useAdminAuth()
  const input = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      const result = await adminPost<ImageUpload>(session.sessionToken, 'uploadImage', { dataUrl })
      onChange(result.thumbnailUrl || result.url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gambar gagal diunggah.')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="image-upload-field">
      <span>{label}</span>
      {value && <img src={value} alt="Pratinjau" />}
      <div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void upload(event)} hidden />
        <button className="button button--soft button--small" type="button" onClick={() => input.current?.click()} disabled={loading}>{loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />} {value ? 'Ganti gambar' : 'Unggah gambar'}</button>
        {value && <button className="icon-button" type="button" onClick={() => onChange('')} aria-label="Hapus gambar"><Trash2 aria-hidden="true" /></button>}
      </div>
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}
