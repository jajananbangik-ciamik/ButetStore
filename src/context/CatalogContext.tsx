import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiGet, isApiConfigured } from '../lib/api'
import type { CatalogData } from '../types'

const fallbackCatalog: CatalogData = {
  categories: [
    { id: 'kat-jajanan-frozen', name: 'Jajanan Frozen', slug: 'jajanan-frozen', order: 1, active: true },
    { id: 'kat-minuman', name: 'Minuman', slug: 'minuman', order: 2, active: true },
    { id: 'kat-lauk-frozen', name: 'Lauk Frozen', slug: 'lauk-frozen', order: 3, active: true },
    { id: 'kat-sprei', name: 'Sprei', slug: 'sprei', order: 4, active: true },
    { id: 'kat-kaos-premium-confetti', name: 'Kaos Premium Confetti', slug: 'kaos-premium-confetti', order: 5, active: true },
  ],
  submenus: [],
  products: [],
  settings: {
    storeName: 'BUTET STORE',
    slogan: 'Solusi belanja sehari-hari',
    tagline: 'Produk OK, Harga Hemat!!',
    storePhone: '',
    paymentInstructions: 'Selesaikan pembayaran sesuai metode yang dipilih, lalu tunggu konfirmasi admin.',
    qrisImageUrl: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    shippingNote: 'Biaya ongkir dibayar langsung kepada kurir.',
    promo: { active: false, title: '', message: '', imageUrl: '', link: '' },
  },
}

interface CatalogContextValue extends CatalogData {
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogData>(fallbackCatalog)
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiGet<CatalogData>('bootstrap')
      setCatalog({
        categories: data.categories || [],
        submenus: data.submenus || [],
        products: data.products || [],
        settings: data.settings || fallbackCatalog.settings,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Katalog belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ ...catalog, loading, error, refresh }), [catalog, loading, error, refresh])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog harus digunakan di dalam CatalogProvider.')
  }
  return context
}
