import { useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles, X } from 'lucide-react'
import { useCatalog } from '../context/CatalogContext'

export function PromoPopup() {
  const { settings } = useCatalog()
  const [open, setOpen] = useState(false)
  const promo = settings.promo

  useEffect(() => {
    if (!promo.active || !promo.title) {
      return
    }
    const key = `butet-promo-${promo.title}-${promo.message}`
    if (sessionStorage.getItem(key)) {
      return
    }
    setOpen(true)
    sessionStorage.setItem(key, '1')
  }, [promo.active, promo.title, promo.message])

  if (!open || !promo.active || !promo.title) {
    return null
  }

  const content = (
    <>
      {promo.imageUrl && <img src={promo.imageUrl} alt="" />}
      <div>
        <p className="eyebrow"><Sparkles aria-hidden="true" /> Kabar BUTET</p>
        <h2 id="promo-title">{promo.title}</h2>
        {promo.message && <p>{promo.message}</p>}
        {promo.link && <span>Lihat penawaran <ArrowUpRight aria-hidden="true" /></span>}
      </div>
    </>
  )

  return (
    <div className="promo-popup" role="dialog" aria-modal="true" aria-labelledby="promo-title">
      <button className="icon-button promo-popup__close" type="button" onClick={() => setOpen(false)} aria-label="Tutup promosi"><X aria-hidden="true" /></button>
      {promo.link ? <a href={promo.link} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>{content}</a> : <div>{content}</div>}
    </div>
  )
}
