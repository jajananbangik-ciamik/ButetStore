const APP_CONFIG = Object.freeze({
  name: 'BUTET STORE',
  version: '1.0.0',
  sessionHours: 8,
  loginWindowMinutes: 15,
  loginMaxAttempts: 5,
  orderItemLimit: 50,
  maximumQuantity: 99,
  maximumTextLength: 1000,
  maximumDataUrlLength: 4500000,
  maximumBankAccounts: 10,
  adminPropertyPrefix: 'BUTET_',
})

const SHEET_NAMES = Object.freeze({
  categories: 'Kategori',
  submenus: 'Submenu',
  products: 'Produk',
  variants: 'Varian',
  orders: 'Pesanan',
  orderDetails: 'PesananDetail',
  statusHistory: 'RiwayatStatus',
  settings: 'Pengaturan',
})

const SHEET_SCHEMAS = Object.freeze({
  [SHEET_NAMES.categories]: ['id', 'name', 'slug', 'order', 'active', 'createdAt', 'updatedAt'],
  [SHEET_NAMES.submenus]: ['id', 'categoryId', 'name', 'slug', 'description', 'imageUrl', 'order', 'active', 'createdAt', 'updatedAt'],
  [SHEET_NAMES.products]: ['id', 'submenuId', 'name', 'slug', 'description', 'price', 'imageUrl', 'featured', 'active', 'trackStock', 'stock', 'hpp', 'order', 'createdAt', 'updatedAt'],
  [SHEET_NAMES.variants]: ['id', 'productId', 'name', 'price', 'trackStock', 'stock', 'hpp', 'active', 'order', 'createdAt', 'updatedAt'],
  [SHEET_NAMES.orders]: ['id', 'requestKey', 'code', 'createdAt', 'customerName', 'phone', 'address', 'notes', 'paymentMethod', 'subtotal', 'shipping', 'total', 'status', 'stockDeducted', 'courier', 'trackingNumber', 'adminNotes', 'paidAt', 'orderedAt', 'shippedAt', 'completedAt', 'cancelledAt', 'updatedAt'],
  [SHEET_NAMES.orderDetails]: ['orderId', 'productId', 'variantId', 'productName', 'variantName', 'quantity', 'unitPrice', 'unitHpp', 'subtotal', 'hppTotal'],
  [SHEET_NAMES.statusHistory]: ['id', 'orderId', 'fromStatus', 'toStatus', 'note', 'actor', 'createdAt'],
  [SHEET_NAMES.settings]: ['key', 'value', 'updatedAt'],
})

const ORDER_STATUS = Object.freeze({
  pendingPayment: 'MENUNGGU_PEMBAYARAN',
  paid: 'TERBAYAR',
  ordered: 'DIPESAN',
  shipped: 'DIKIRIM',
  completed: 'SELESAI',
  cancelled: 'DIBATALKAN',
})

const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.pendingPayment]: [ORDER_STATUS.paid, ORDER_STATUS.cancelled],
  [ORDER_STATUS.paid]: [ORDER_STATUS.ordered, ORDER_STATUS.cancelled],
  [ORDER_STATUS.ordered]: [ORDER_STATUS.shipped, ORDER_STATUS.cancelled],
  [ORDER_STATUS.shipped]: [ORDER_STATUS.completed],
  [ORDER_STATUS.completed]: [],
  [ORDER_STATUS.cancelled]: [],
})

const DEFAULT_SETTINGS = Object.freeze({
  STORE_NAME: 'BUTET STORE',
  STORE_SLOGAN: 'Solusi belanja sehari-hari',
  STORE_TAGLINE: 'Produk OK, Harga Hemat!!',
  STORE_PHONE: '',
  PAYMENT_INSTRUCTIONS: 'Selesaikan pembayaran sesuai metode yang dipilih, lalu tunggu konfirmasi admin.',
  QRIS_IMAGE_URL: '',
  BANK_NAME: '',
  BANK_ACCOUNT_NUMBER: '',
  BANK_ACCOUNT_HOLDER: '',
  BANK_ACCOUNTS_JSON: '[]',
  SHIPPING_NOTE: 'Biaya ongkir dibayar langsung kepada kurir.',
  PROMO_ACTIVE: 'false',
  PROMO_TITLE: '',
  PROMO_MESSAGE: '',
  PROMO_IMAGE_URL: '',
  PROMO_LINK: '',
})

const SEED_CATEGORIES = Object.freeze([
  ['kat-jajanan-frozen', 'Jajanan Frozen', 'jajanan-frozen', 1],
  ['kat-minuman', 'Minuman', 'minuman', 2],
  ['kat-lauk-frozen', 'Lauk Frozen', 'lauk-frozen', 3],
  ['kat-sprei', 'Sprei', 'sprei', 4],
  ['kat-kaos-premium-confetti', 'Kaos Premium Confetti', 'kaos-premium-confetti', 5],
])
