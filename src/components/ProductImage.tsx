import { useEffect, useState } from 'react'
import { PackageOpen } from 'lucide-react'

export function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div className={`product-image product-image--empty ${className}`} role="img" aria-label={alt}>
        <PackageOpen aria-hidden="true" />
        <span>{alt}</span>
      </div>
    )
  }

  return <img className={`product-image ${className}`} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}
