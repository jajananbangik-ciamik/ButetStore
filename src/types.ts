export type PaymentMethod = 'QRIS' | 'TRANSFER'

export type OrderStatus =
  | 'MENUNGGU_PEMBAYARAN'
  | 'TERBAYAR'
  | 'DIPESAN'
  | 'DIKIRIM'
  | 'SELESAI'
  | 'DIBATALKAN'

export interface Category {
  id: string
  name: string
  slug: string
  order: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Submenu {
  id: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  description: string
  imageUrl: string
  order: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  price: number
  hpp: number
  trackStock: boolean
  stock: number
  active: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  submenuId: string
  submenuName: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  description: string
  price: number
  minimumPrice: number
  imageUrl: string
  featured: boolean
  active: boolean
  trackStock: boolean
  stock: number
  hpp: number
  order: number
  variants: ProductVariant[]
  createdAt?: string
  updatedAt?: string
}

export interface PromoSettings {
  active: boolean
  title: string
  message: string
  imageUrl: string
  link: string
}

export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface StoreSettings {
  storeName: string
  slogan: string
  tagline: string
  storePhone: string
  paymentInstructions: string
  qrisImageUrl: string
  bankAccounts: BankAccount[]
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  shippingNote: string
  promo: PromoSettings
}

export interface CatalogData {
  categories: Category[]
  submenus: Submenu[]
  products: Product[]
  settings: StoreSettings
}

export interface CartLine {
  productId: string
  variantId?: string
  quantity: number
}

export interface ResolvedCartLine extends CartLine {
  product: Product
  variant?: ProductVariant
  unitPrice: number
  lineTotal: number
  availableStock: number | null
}

export interface PublicOrder {
  id: string
  code: string
  createdAt: string
  customerName: string
  phone: string
  address: string
  notes: string
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  courier: string
  trackingNumber: string
  paidAt?: string
  updatedAt: string
  duplicate?: boolean
}

export interface OrderDetail {
  orderId: string
  productId: string
  variantId: string
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
  unitHpp: number
  subtotal: number
  hppTotal: number
}

export interface StatusHistory {
  id: string
  fromStatus: OrderStatus | ''
  toStatus: OrderStatus
  note: string
  actor: string
  createdAt: string
}

export interface AdminOrder extends PublicOrder {
  fullPhone: string
  adminNotes: string
  itemCount: number
  stockDeducted: boolean
  orderedAt?: string
  shippedAt?: string
  completedAt?: string
  cancelledAt?: string
  details?: OrderDetail[]
  history?: StatusHistory[]
}

export interface AdminDashboard {
  stats: {
    pendingPayment: number
    paid: number
    processing: number
    completed: number
    todayOrders: number
    todayRevenue: number
  }
  recentOrders: AdminOrder[]
}

export interface ProfitReport {
  period: 'TODAY' | '7D' | '30D' | 'MONTH' | 'ALL'
  summary: {
    revenue: number
    hpp: number
    profit: number
    margin: number
    orderCount: number
    quantity: number
    missingHppItems: number
  }
  products: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
    hpp: number
    profit: number
    margin: number
  }>
}

export interface AdminSession {
  sessionToken: string
  expiresAt: number
  username: string
}

export interface ImageUpload {
  fileId: string
  url: string
  thumbnailUrl: string
}
