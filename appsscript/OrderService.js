function createOrder_(payload) {
  const requestKey = requireText_(payload.requestKey, 'Kunci pesanan', 160)
  const customerName = requireText_(payload.customerName, 'Nama pembeli', 160)
  const phone = requirePhone_(payload.phone)
  const address = requireText_(payload.address, 'Alamat pengiriman', 1000)
  const notes = cleanText_(payload.notes, 1000)
  const paymentMethod = normalizePaymentMethod_(payload.paymentMethod)
  const incomingItems = Array.isArray(payload.items) ? payload.items.slice(0, APP_CONFIG.orderItemLimit) : []
  if (!incomingItems.length) {
    throw new Error('Pesanan harus memiliki minimal satu produk.')
  }
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const existing = readRows_(SHEET_NAMES.orders).find((row) => String(row.requestKey) === requestKey)
    if (existing) {
      return { ...toPublicOrder_(existing), duplicate: true }
    }
    const items = normalizeOrderItems_(incomingItems)
    const productRows = readRows_(SHEET_NAMES.products)
    const variantRows = readRows_(SHEET_NAMES.variants)
    const resolvedItems = resolveOrderItems_(items, productRows, variantRows)
    validateStockAvailability_(resolvedItems, productRows, variantRows)
    applyStockDeductions_(resolvedItems, productRows, variantRows)
    const createdAt = nowIso_()
    const orderId = newId_('ord')
    const code = createOrderCode_(createdAt, readRows_(SHEET_NAMES.orders))
    const subtotal = resolvedItems.reduce((sum, item) => sum + item.subtotal, 0)
    const orderRow = {
      id: orderId,
      requestKey,
      code,
      createdAt,
      customerName,
      phone,
      address,
      notes,
      paymentMethod,
      subtotal,
      shipping: 0,
      total: subtotal,
      status: ORDER_STATUS.pendingPayment,
      stockDeducted: resolvedItems.some((item) => item.stockTracked),
      courier: '',
      trackingNumber: '',
      adminNotes: '',
      paidAt: '',
      orderedAt: '',
      shippedAt: '',
      completedAt: '',
      cancelledAt: '',
      updatedAt: createdAt,
    }
    const detailRows = resolvedItems.map((item) => ({
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitHpp: item.unitHpp,
      subtotal: item.subtotal,
      hppTotal: item.hppTotal,
    }))
    appendRows_(SHEET_NAMES.orders, [orderRow])
    appendRows_(SHEET_NAMES.orderDetails, detailRows)
    appendRows_(SHEET_NAMES.statusHistory, [{
      id: newId_('hst'),
      orderId,
      fromStatus: '',
      toStatus: ORDER_STATUS.pendingPayment,
      note: 'Pesanan dibuat dan menunggu pembayaran.',
      actor: 'CUSTOMER',
      createdAt,
    }])
    return toPublicOrder_(orderRow)
  } finally {
    lock.releaseLock()
  }
}

function normalizeOrderItems_(items) {
  const grouped = new Map()
  items.forEach((item) => {
    const productId = requireText_(item.productId, 'Produk', 100)
    const variantId = cleanText_(item.variantId, 100)
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > APP_CONFIG.maximumQuantity) {
      throw new Error('Jumlah produk tidak valid.')
    }
    const key = productId + '|' + variantId
    const current = grouped.get(key)
    if (current) {
      current.quantity += quantity
    } else {
      grouped.set(key, { productId, variantId, quantity })
    }
  })
  grouped.forEach((item) => {
    if (item.quantity > APP_CONFIG.maximumQuantity) {
      throw new Error('Jumlah produk melebihi batas.')
    }
  })
  return Array.from(grouped.values())
}

function resolveOrderItems_(items, productRows, variantRows) {
  return items.map((item) => {
    const product = productRows.find((row) => String(row.id) === item.productId)
    if (!product || !asBoolean_(product.active)) {
      throw new Error('Produk tidak tersedia.')
    }
    const submenu = findRowById_(SHEET_NAMES.submenus, product.submenuId)
    const category = submenu ? findRowById_(SHEET_NAMES.categories, submenu.categoryId) : null
    if (!submenu || !category || !asBoolean_(submenu.active) || !asBoolean_(category.active)) {
      throw new Error('Produk sedang tidak tersedia.')
    }
    const productVariants = variantRows.filter((row) => String(row.productId) === item.productId && asBoolean_(row.active))
    let variant = null
    if (item.variantId) {
      variant = variantRows.find((row) => String(row.id) === item.variantId && String(row.productId) === item.productId)
      if (!variant || !asBoolean_(variant.active)) {
        throw new Error('Varian produk tidak tersedia.')
      }
    } else if (productVariants.length) {
      throw new Error('Pilih varian produk.')
    }
    const unitPrice = normalizeMoney_(variant ? variant.price : product.price, 'Harga produk')
    const unitHpp = normalizeMoney_(variant ? variant.hpp : product.hpp, 'HPP produk')
    const trackStock = variant ? asBoolean_(variant.trackStock) : asBoolean_(product.trackStock)
    return {
      productId: item.productId,
      variantId: item.variantId,
      productName: String(product.name),
      variantName: variant ? String(variant.name) : '',
      quantity: item.quantity,
      unitPrice,
      unitHpp,
      subtotal: unitPrice * item.quantity,
      hppTotal: unitHpp * item.quantity,
      stockTracked: trackStock,
    }
  })
}

function validateStockAvailability_(items, productRows, variantRows) {
  items.forEach((item) => {
    if (!item.stockTracked) {
      return
    }
    const row = item.variantId
      ? variantRows.find((variant) => String(variant.id) === item.variantId)
      : productRows.find((product) => String(product.id) === item.productId)
    const stock = asNumber_(row && row.stock, 0)
    if (stock < item.quantity) {
      throw new Error('Stok ' + item.productName + ' tidak mencukupi.')
    }
  })
}

function applyStockDeductions_(items, productRows, variantRows) {
  items.forEach((item) => {
    if (!item.stockTracked) {
      return
    }
    const sheetName = item.variantId ? SHEET_NAMES.variants : SHEET_NAMES.products
    const rowId = item.variantId || item.productId
    const row = item.variantId
      ? variantRows.find((variant) => String(variant.id) === rowId)
      : productRows.find((product) => String(product.id) === rowId)
    if (!row) {
      throw new Error('Data stok tidak ditemukan.')
    }
    const next = { ...row, stock: asNumber_(row.stock, 0) - item.quantity, updatedAt: nowIso_() }
    upsertRow_(sheetName, rowId, next)
  })
}

function restoreStock_(details) {
  const productRows = readRows_(SHEET_NAMES.products)
  const variantRows = readRows_(SHEET_NAMES.variants)
  details.forEach((detail) => {
    const rowId = detail.variantId || detail.productId
    const sheetName = detail.variantId ? SHEET_NAMES.variants : SHEET_NAMES.products
    const row = detail.variantId
      ? variantRows.find((variant) => String(variant.id) === rowId)
      : productRows.find((product) => String(product.id) === rowId)
    if (!row || !asBoolean_(row.trackStock)) {
      return
    }
    upsertRow_(sheetName, rowId, { ...row, stock: asNumber_(row.stock, 0) + asNumber_(detail.quantity, 0), updatedAt: nowIso_() })
  })
}

function listAdminOrders_(payload) {
  const status = cleanText_(payload.status, 40)
  const query = cleanText_(payload.query, 160).toLowerCase()
  const limit = Math.min(500, Math.max(1, Math.floor(asNumber_(payload.limit, 100))))
  const detailsByOrder = groupRowsByOrder_(SHEET_NAMES.orderDetails)
  const orders = readRows_(SHEET_NAMES.orders)
    .filter((row) => !status || status === 'ALL' || String(row.status) === status)
    .filter((row) => {
      if (!query) {
        return true
      }
      return [row.code, row.customerName, row.phone, row.id].some((value) => String(value || '').toLowerCase().includes(query))
    })
    .sort(sortOrdersByDateDescending_)
    .slice(0, limit)
  return orders.map((row) => toAdminOrder_(row, detailsByOrder.get(String(row.id)) || []))
}

function getAdminOrder_(id) {
  const orderId = requireText_(id, 'Pesanan', 100)
  const row = findRowById_(SHEET_NAMES.orders, orderId)
  if (!row) {
    throw new Error('Pesanan tidak ditemukan.')
  }
  const details = readRows_(SHEET_NAMES.orderDetails).filter((detail) => String(detail.orderId) === orderId)
  const history = readRows_(SHEET_NAMES.statusHistory).filter((item) => String(item.orderId) === orderId).sort(sortHistoryAscending_)
  return toAdminOrder_(row, details, history)
}

function updateOrderStatus_(payload, actor) {
  const orderId = requireText_(payload.id, 'Pesanan', 100)
  const nextStatus = requireText_(payload.status, 'Status pesanan', 40)
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const order = findRowById_(SHEET_NAMES.orders, orderId)
    if (!order) {
      throw new Error('Pesanan tidak ditemukan.')
    }
    const currentStatus = String(order.status)
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(nextStatus)) {
      throw new Error('Perubahan status pesanan tidak valid.')
    }
    const note = cleanText_(payload.note, 1000)
    const courier = cleanText_(payload.courier, 100)
    const trackingNumber = cleanText_(payload.trackingNumber, 100)
    if (nextStatus === ORDER_STATUS.shipped && !courier) {
      throw new Error('Kurir wajib diisi sebelum pesanan ditandai dikirim.')
    }
    if (nextStatus === ORDER_STATUS.cancelled && asBoolean_(order.stockDeducted)) {
      const details = readRows_(SHEET_NAMES.orderDetails).filter((detail) => String(detail.orderId) === orderId)
      restoreStock_(details)
      order.stockDeducted = false
    }
    const now = nowIso_()
    const next = {
      ...order,
      status: nextStatus,
      adminNotes: note || order.adminNotes,
      courier: courier || order.courier,
      trackingNumber: trackingNumber || order.trackingNumber,
      updatedAt: now,
    }
    if (nextStatus === ORDER_STATUS.paid) {
      next.paidAt = order.paidAt || now
    }
    if (nextStatus === ORDER_STATUS.ordered) {
      next.orderedAt = now
    }
    if (nextStatus === ORDER_STATUS.shipped) {
      next.shippedAt = now
    }
    if (nextStatus === ORDER_STATUS.completed) {
      next.completedAt = now
    }
    if (nextStatus === ORDER_STATUS.cancelled) {
      next.cancelledAt = now
    }
    upsertRow_(SHEET_NAMES.orders, orderId, next)
    appendRows_(SHEET_NAMES.statusHistory, [{
      id: newId_('hst'),
      orderId,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      note,
      actor: cleanText_(actor, 120) || 'ADMIN',
      createdAt: now,
    }])
    return getAdminOrder_(orderId)
  } finally {
    lock.releaseLock()
  }
}

function trackOrder_(payload) {
  const code = requireText_(payload.code, 'Nomor pesanan', 80).toUpperCase()
  const phoneSuffix = requirePhoneSuffix_(payload.phoneSuffix)
  const order = readRows_(SHEET_NAMES.orders).find((row) => String(row.code).toUpperCase() === code)
  if (!order) {
    throw new Error('Pesanan tidak ditemukan atau data tidak cocok.')
  }
  const phoneDigits = String(order.phone || '').replace(/\D/g, '')
  if (phoneDigits.slice(-4) !== phoneSuffix) {
    throw new Error('Pesanan tidak ditemukan atau data tidak cocok.')
  }
  return { order: toPublicOrder_(order) }
}

function getAdminDashboard_() {
  const orders = readRows_(SHEET_NAMES.orders)
  const todayKey = localDateKey_(new Date())
  const verifiedStatuses = [ORDER_STATUS.paid, ORDER_STATUS.ordered, ORDER_STATUS.shipped, ORDER_STATUS.completed]
  const todayOrders = orders.filter((row) => localDateKey_(row.createdAt) === todayKey)
  const todayRevenue = todayOrders.filter((row) => verifiedStatuses.includes(String(row.status))).reduce((sum, row) => sum + asNumber_(row.total, 0), 0)
  const detailsByOrder = groupRowsByOrder_(SHEET_NAMES.orderDetails)
  return {
    stats: {
      pendingPayment: orders.filter((row) => String(row.status) === ORDER_STATUS.pendingPayment).length,
      paid: orders.filter((row) => String(row.status) === ORDER_STATUS.paid).length,
      processing: orders.filter((row) => [ORDER_STATUS.ordered, ORDER_STATUS.shipped].includes(String(row.status))).length,
      completed: orders.filter((row) => String(row.status) === ORDER_STATUS.completed).length,
      todayOrders: todayOrders.length,
      todayRevenue,
    },
    recentOrders: orders.slice().sort(sortOrdersByDateDescending_).slice(0, 8).map((row) => toAdminOrder_(row, detailsByOrder.get(String(row.id)) || [])),
  }
}

function getProfitReport_(payload) {
  const period = requirePeriod_(payload.period)
  const now = new Date()
  const start = periodStart_(period, now)
  const orders = readRows_(SHEET_NAMES.orders).filter((row) => {
    if (![ORDER_STATUS.paid, ORDER_STATUS.ordered, ORDER_STATUS.shipped, ORDER_STATUS.completed].includes(String(row.status))) {
      return false
    }
    const paidAt = row.paidAt || row.createdAt
    const timestamp = new Date(paidAt).getTime()
    return !start || (Number.isFinite(timestamp) && timestamp >= start.getTime())
  })
  const detailsByOrder = groupRowsByOrder_(SHEET_NAMES.orderDetails)
  const productMap = new Map()
  let revenue = 0
  let hpp = 0
  let quantity = 0
  let missingHppItems = 0
  orders.forEach((order) => {
    const orderDetails = detailsByOrder.get(String(order.id)) || []
    const orderRevenue = asNumber_(order.subtotal, asNumber_(order.total, 0))
    revenue += orderRevenue
    orderDetails.forEach((detail) => {
      const itemQuantity = Math.max(0, asNumber_(detail.quantity, 0))
      const itemRevenue = asNumber_(detail.subtotal, 0)
      const itemHpp = asNumber_(detail.hppTotal, 0)
      quantity += itemQuantity
      hpp += itemHpp
      if (itemQuantity > 0 && asNumber_(detail.unitHpp, 0) <= 0) {
        missingHppItems += itemQuantity
      }
      const productId = String(detail.productId)
      const current = productMap.get(productId) || { productId, productName: String(detail.productName || detail.productId), quantity: 0, revenue: 0, hpp: 0, profit: 0, margin: 0 }
      current.quantity += itemQuantity
      current.revenue += itemRevenue
      current.hpp += itemHpp
      productMap.set(productId, current)
    })
  })
  const products = Array.from(productMap.values()).map((product) => {
    const profit = product.revenue - product.hpp
    return { ...product, profit, margin: product.revenue > 0 ? profit / product.revenue : 0 }
  }).sort((left, right) => right.revenue - left.revenue)
  const profit = revenue - hpp
  return {
    period,
    summary: {
      revenue,
      hpp,
      profit,
      margin: revenue > 0 ? profit / revenue : 0,
      orderCount: orders.length,
      quantity,
      missingHppItems,
    },
    products,
  }
}

function toPublicOrder_(row) {
  return {
    id: String(row.id),
    code: String(row.code),
    createdAt: String(row.createdAt || ''),
    customerName: String(row.customerName || ''),
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    notes: String(row.notes || ''),
    paymentMethod: String(row.paymentMethod || 'QRIS'),
    subtotal: asNumber_(row.subtotal, 0),
    shipping: asNumber_(row.shipping, 0),
    total: asNumber_(row.total, 0),
    status: String(row.status || ORDER_STATUS.pendingPayment),
    courier: String(row.courier || ''),
    trackingNumber: String(row.trackingNumber || ''),
    paidAt: row.paidAt ? String(row.paidAt) : undefined,
    updatedAt: String(row.updatedAt || row.createdAt || ''),
  }
}

function toAdminOrder_(row, details, history) {
  const itemCount = details.reduce((sum, detail) => sum + asNumber_(detail.quantity, 0), 0)
  return {
    ...toPublicOrder_(row),
    fullPhone: String(row.phone || ''),
    adminNotes: String(row.adminNotes || ''),
    itemCount,
    stockDeducted: asBoolean_(row.stockDeducted),
    orderedAt: row.orderedAt ? String(row.orderedAt) : undefined,
    shippedAt: row.shippedAt ? String(row.shippedAt) : undefined,
    completedAt: row.completedAt ? String(row.completedAt) : undefined,
    cancelledAt: row.cancelledAt ? String(row.cancelledAt) : undefined,
    details: details ? details.map(toOrderDetail_) : undefined,
    history: history ? history.map(toHistory_) : undefined,
  }
}

function toOrderDetail_(row) {
  return {
    orderId: String(row.orderId),
    productId: String(row.productId),
    variantId: String(row.variantId || ''),
    productName: String(row.productName || ''),
    variantName: String(row.variantName || ''),
    quantity: asNumber_(row.quantity, 0),
    unitPrice: asNumber_(row.unitPrice, 0),
    unitHpp: asNumber_(row.unitHpp, 0),
    subtotal: asNumber_(row.subtotal, 0),
    hppTotal: asNumber_(row.hppTotal, 0),
  }
}

function toHistory_(row) {
  return {
    id: String(row.id),
    fromStatus: String(row.fromStatus || ''),
    toStatus: String(row.toStatus),
    note: String(row.note || ''),
    actor: String(row.actor || ''),
    createdAt: String(row.createdAt || ''),
  }
}

function groupRowsByOrder_(sheetName) {
  const grouped = new Map()
  readRows_(sheetName).forEach((row) => {
    const key = String(row.orderId)
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key).push(row)
  })
  return grouped
}

function sortOrdersByDateDescending_(left, right) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
}

function sortHistoryAscending_(left, right) {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
}

function createOrderCode_(createdAt, existingOrders) {
  const date = String(createdAt).slice(0, 10).replace(/-/g, '')
  let code
  do {
    code = 'BS-' + date + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase()
  } while (existingOrders.some((row) => String(row.code) === code))
  return code
}

function normalizePaymentMethod_(value) {
  const method = String(value || '').toUpperCase()
  if (method !== 'QRIS' && method !== 'TRANSFER') {
    throw new Error('Metode pembayaran tidak valid.')
  }
  return method
}

function requirePhone_(value) {
  const phone = cleanText_(value, 40)
  if (!/^[0-9+() .-]{8,40}$/.test(phone)) {
    throw new Error('Nomor WhatsApp tidak valid.')
  }
  return phone
}

function requirePhoneSuffix_(value) {
  const suffix = String(value || '').replace(/\D/g, '')
  if (suffix.length !== 4) {
    throw new Error('4 digit akhir WhatsApp wajib diisi.')
  }
  return suffix
}

function requirePeriod_(value) {
  const period = String(value || '30D').toUpperCase()
  if (!['TODAY', '7D', '30D', 'MONTH', 'ALL'].includes(period)) {
    throw new Error('Periode laporan tidak valid.')
  }
  return period
}

function periodStart_(period, now) {
  if (period === 'ALL') {
    return null
  }
  if (period === 'TODAY') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'MONTH') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  const days = period === '7D' ? 6 : 29
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
}

function localDateKey_(value) {
  const date = value instanceof Date ? value : new Date(String(value || ''))
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd')
}
