import type { CartLine, Product, ResolvedCartLine } from '../types'

export function resolveCartLines(lines: CartLine[], products: Product[]): ResolvedCartLine[] {
  const productMap = new Map(products.map((product) => [product.id, product]))
  return lines.flatMap((line) => {
    const product = productMap.get(line.productId)
    if (!product || !product.active) {
      return []
    }
    const activeVariants = product.variants.filter((item) => item.active)
    if (activeVariants.length && !line.variantId) {
      return []
    }
    const variant = line.variantId ? activeVariants.find((item) => item.id === line.variantId) : undefined
    if (line.variantId && !variant) {
      return []
    }
    const source = variant || product
    const unitPrice = variant ? variant.price : product.price
    const availableStock = source.trackStock ? Math.max(0, source.stock) : null
    const quantity = availableStock === null ? line.quantity : Math.min(line.quantity, availableStock)
    return [{
      ...line,
      quantity,
      product,
      variant,
      unitPrice,
      lineTotal: unitPrice * quantity,
      availableStock,
    }]
  })
}

export function cartSubtotal(lines: ResolvedCartLine[]) {
  return lines.reduce((total, line) => total + line.lineTotal, 0)
}

export function cartQuantity(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0)
}

export function makeRequestKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
