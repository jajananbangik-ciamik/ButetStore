import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { classNames } from '../lib/utils'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
}

export function Modal({ open, title, onClose, children, size = 'medium' }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={classNames('modal', `modal--${size}`)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  )
}
