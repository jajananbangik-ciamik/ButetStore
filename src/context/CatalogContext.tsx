import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { apiGet, isApiConfigured } from '../lib/api'
import type { CatalogData } from '../types'

const CATALOG_POLL_INTERVAL = 30000

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
    bankAccounts: [],
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
  refresh: (silent?: boolean) => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const [catalog, setCatalog] = useState<CatalogData>(fallbackCatalog)
  const [loading, setLoading] = useState(isApiConfigured)
  const [error, setError] = useState('')
  const refreshing = useRef(false)

  const refresh = useCallback(async (silent = false) => {
    if (!isApiConfigured) {
      setLoading(false)
      return
    }
    if (refreshing.current) {
      return
    }
    refreshing.current = true
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const data = await apiGet<CatalogData>('bootstrap')
      const incomingSettings = data.settings || fallbackCatalog.settings
      const incomingBankAccounts = Array.isArray(incomingSettings.bankAccounts) ? incomingSettings.bankAccounts : []
      const legacyBankAccounts = incomingSettings.bankName && incomingSettings.bankAccountNumber && incomingSettings.bankAccountHolder
        ? [{ id: 'legacy-bank-1', bankName: incomingSettings.bankName, accountNumber: incomingSettings.bankAccountNumber, accountHolder: incomingSettings.bankAccountHolder }]
        : []
      setCatalog({
        categories: data.categories || [],
        submenus: data.submenus || [],
        products: (data.products || []).map((product) => ({ ...product, videoUrl: product.videoUrl || '' })),
        settings: {
          ...fallbackCatalog.settings,
          ...incomingSettings,
          bankAccounts: incomingBankAccounts.length ? incomingBankAccounts : legacyBankAccounts,
        },
      })
      setError('')
    } catch (reason) {
      if (!silent) {
        setError(reason instanceof Error ? reason.message : 'Katalog belum dapat dimuat.')
      }
    } finally {
      refreshing.current = false
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (isAdminRoute) {
      return
    }
    const poll = () => {
      if (document.visibilityState === 'visible') {
        void refresh(true)
      }
    }
    const interval = window.setInterval(poll, CATALOG_POLL_INTERVAL)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        poll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAdminRoute, refresh])

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
