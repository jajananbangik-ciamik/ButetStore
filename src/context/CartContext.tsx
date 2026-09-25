import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cartQuantity } from '../lib/cart'
import type { CartLine } from '../types'

const storageKey = 'butet-store-cart-v1'

interface CartContextValue {
  lines: CartLine[]
  count: number
  isOpen: boolean
  addItem: (productId: string, variantId: string | undefined, quantity?: number) => void
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void
  removeItem: (productId: string, variantId?: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readStoredLines() {
  try {
    const stored = localStorage.getItem(storageKey)
    const parsed = stored ? JSON.parse(stored) as CartLine[] : []
    return Array.isArray(parsed) ? parsed.filter((line) => line.productId && Number.isInteger(line.quantity) && line.quantity > 0) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredLines)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lines))
  }, [lines])

  const addItem = useCallback((productId: string, variantId: string | undefined, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === productId && line.variantId === variantId)
      if (existing) {
        return current.map((line) => line === existing ? { ...line, quantity: line.quantity + quantity } : line)
      }
      return [...current, { productId, variantId, quantity }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) {
        return current.filter((line) => !(line.productId === productId && line.variantId === variantId))
      }
      return current.map((line) => line.productId === productId && line.variantId === variantId ? { ...line, quantity } : line)
    })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setLines((current) => current.filter((line) => !(line.productId === productId && line.variantId === variantId)))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ lines, count: cartQuantity(lines), isOpen, addItem, updateQuantity, removeItem, clearCart, openCart, closeCart }), [lines, isOpen, addItem, updateQuantity, removeItem, clearCart, openCart, closeCart])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart harus digunakan di dalam CartProvider.')
  }
  return context
}
