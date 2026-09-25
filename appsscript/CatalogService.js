function getCatalog_(includeInactive) {
  const categories = readRows_(SHEET_NAMES.categories)
  const submenus = readRows_(SHEET_NAMES.submenus)
  const products = readRows_(SHEET_NAMES.products)
  const variants = readRows_(SHEET_NAMES.variants)
  const categoryMap = new Map(categories.map((row) => [String(row.id), row]))
  const submenuMap = new Map(submenus.map((row) => [String(row.id), row]))
  const publicMode = !includeInactive
  const visibleCategories = categories
    .filter((row) => !publicMode || asBoolean_(row.active))
    .map(toCategory_)
    .sort(sortByOrderAndName_)
  const visibleSubmenus = submenus
    .filter((row) => !publicMode || (asBoolean_(row.active) && categoryMap.has(String(row.categoryId)) && asBoolean_(categoryMap.get(String(row.categoryId)).active)))
    .map((row) => toSubmenu_(row, categoryMap.get(String(row.categoryId))))
    .sort(sortByOrderAndName_)
  const visibleProducts = products
    .filter((row) => {
      if (!publicMode) {
        return true
      }
      const submenu = submenuMap.get(String(row.submenuId))
      return asBoolean_(row.active) && submenu && asBoolean_(submenu.active) && categoryMap.has(String(submenu.categoryId)) && asBoolean_(categoryMap.get(String(submenu.categoryId)).active)
    })
    .map((row) => {
      const submenu = submenuMap.get(String(row.submenuId))
      const category = submenu ? categoryMap.get(String(submenu.categoryId)) : null
      const productVariants = variants
        .filter((variant) => String(variant.productId) === String(row.id))
        .filter((variant) => !publicMode || asBoolean_(variant.active))
        .map(toVariant_)
        .sort(sortByOrderAndName_)
      return toProduct_(row, productVariants, submenu, category)
    })
    .sort(sortByOrderAndName_)
  return {
    categories: visibleCategories,
    submenus: visibleSubmenus,
    products: visibleProducts,
    settings: publicSettings_(),
  }
}

function toCategory_(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    order: asNumber_(row.order, 0),
    active: asBoolean_(row.active),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toSubmenu_(row, category) {
  return {
    id: String(row.id),
    categoryId: String(row.categoryId),
    categoryName: category ? String(category.name) : '',
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description || ''),
    imageUrl: String(row.imageUrl || ''),
    order: asNumber_(row.order, 0),
    active: asBoolean_(row.active),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toVariant_(row) {
  return {
    id: String(row.id),
    productId: String(row.productId),
    name: String(row.name),
    price: asNumber_(row.price, 0),
    hpp: asNumber_(row.hpp, 0),
    trackStock: asBoolean_(row.trackStock),
    stock: asNumber_(row.stock, 0),
    active: asBoolean_(row.active),
    order: asNumber_(row.order, 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toProduct_(row, variants, submenu, category) {
  const availablePrices = variants.filter((variant) => variant.active).map((variant) => variant.price)
  if (!availablePrices.length) {
    availablePrices.push(asNumber_(row.price, 0))
  }
  const minimumPrice = availablePrices.length ? Math.min.apply(null, availablePrices) : 0
  return {
    id: String(row.id),
    submenuId: String(row.submenuId),
    submenuName: submenu ? String(submenu.name) : '',
    categoryId: submenu ? String(submenu.categoryId) : '',
    categoryName: category ? String(category.name) : '',
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description || ''),
    price: asNumber_(row.price, 0),
    minimumPrice,
    imageUrl: String(row.imageUrl || ''),
    videoUrl: safeVideoUrlForRead_(row.videoUrl),
    featured: asBoolean_(row.featured),
    active: asBoolean_(row.active),
    trackStock: asBoolean_(row.trackStock),
    stock: asNumber_(row.stock, 0),
    hpp: asNumber_(row.hpp, 0),
    order: asNumber_(row.order, 0),
    variants,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function sortByOrderAndName_(left, right) {
  const orderDifference = asNumber_(left.order, 0) - asNumber_(right.order, 0)
  if (orderDifference !== 0) {
    return orderDifference
  }
  return String(left.name).localeCompare(String(right.name), 'id')
}

function saveCategory_(payload) {
  const name = requireText_(payload.name, 'Nama menu', 100)
  const requestedSlug = slugify_(payload.slug || name)
  if (!requestedSlug) {
    throw new Error('Slug menu tidak valid.')
  }
  const categories = readRows_(SHEET_NAMES.categories)
  const duplicate = categories.find((row) => row.slug === requestedSlug && String(row.id) !== String(payload.id || ''))
  if (duplicate) {
    throw new Error('Slug menu sudah digunakan.')
  }
  const id = cleanText_(payload.id, 100) || newId_('kat')
  const now = nowIso_()
  const existing = categories.find((row) => String(row.id) === id)
  const next = {
    id,
    name,
    slug: requestedSlug,
    order: Math.max(0, Math.floor(asNumber_(payload.order, categories.length + 1))),
    active: payload.active !== false,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
  upsertRow_(SHEET_NAMES.categories, id, next)
  return toCategory_(next)
}

function deleteCategory_(id) {
  const categoryId = requireText_(id, 'Menu', 100)
  const submenuCount = readRows_(SHEET_NAMES.submenus).filter((row) => String(row.categoryId) === categoryId).length
  if (submenuCount) {
    throw new Error('Menu masih memiliki submenu dan tidak dapat dihapus.')
  }
  deleteRowsByColumn_(SHEET_NAMES.categories, 'id', categoryId)
  return { id: categoryId }
}

function saveSubmenu_(payload) {
  const categoryId = requireText_(payload.categoryId, 'Menu utama', 100)
  if (!findRowById_(SHEET_NAMES.categories, categoryId)) {
    throw new Error('Menu utama tidak ditemukan.')
  }
  const name = requireText_(payload.name, 'Nama submenu', 100)
  const requestedSlug = slugify_(payload.slug || name)
  if (!requestedSlug) {
    throw new Error('Slug submenu tidak valid.')
  }
  const submenus = readRows_(SHEET_NAMES.submenus)
  const duplicate = submenus.find((row) => row.slug === requestedSlug && String(row.id) !== String(payload.id || ''))
  if (duplicate) {
    throw new Error('Slug submenu sudah digunakan.')
  }
  const id = cleanText_(payload.id, 100) || newId_('sub')
  const now = nowIso_()
  const existing = submenus.find((row) => String(row.id) === id)
  const next = {
    id,
    categoryId,
    name,
    slug: requestedSlug,
    description: cleanText_(payload.description, 600),
    imageUrl: safeImageUrl_(payload.imageUrl),
    order: Math.max(0, Math.floor(asNumber_(payload.order, submenus.length + 1))),
    active: payload.active !== false,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
  upsertRow_(SHEET_NAMES.submenus, id, next)
  return toSubmenu_(next, findRowById_(SHEET_NAMES.categories, categoryId))
}

function deleteSubmenu_(id) {
  const submenuId = requireText_(id, 'Submenu', 100)
  const productCount = readRows_(SHEET_NAMES.products).filter((row) => String(row.submenuId) === submenuId).length
  if (productCount) {
    throw new Error('Submenu masih memiliki produk dan tidak dapat dihapus.')
  }
  deleteRowsByColumn_(SHEET_NAMES.submenus, 'id', submenuId)
  return { id: submenuId }
}

function saveProduct_(payload) {
  const submenuId = requireText_(payload.submenuId, 'Submenu', 100)
  if (!findRowById_(SHEET_NAMES.submenus, submenuId)) {
    throw new Error('Submenu tidak ditemukan.')
  }
  const name = requireText_(payload.name, 'Nama produk', 140)
  const requestedSlug = slugify_(payload.slug || name)
  if (!requestedSlug) {
    throw new Error('Slug produk tidak valid.')
  }
  const products = readRows_(SHEET_NAMES.products)
  const duplicate = products.find((row) => row.slug === requestedSlug && String(row.id) !== String(payload.id || ''))
  if (duplicate) {
    throw new Error('Slug produk sudah digunakan.')
  }
  const id = cleanText_(payload.id, 100) || newId_('prd')
  const now = nowIso_()
  const existing = products.find((row) => String(row.id) === id)
  const next = {
    id,
    submenuId,
    name,
    slug: requestedSlug,
    description: cleanText_(payload.description, 1200),
    price: normalizeMoney_(payload.price, 'Harga produk'),
    imageUrl: safeImageUrl_(payload.imageUrl),
    videoUrl: safeVideoUrl_(payload.videoUrl),
    featured: payload.featured === true,
    active: payload.active !== false,
    trackStock: payload.trackStock === true,
    stock: normalizeNonNegativeInteger_(payload.stock, 'Stok produk'),
    hpp: normalizeMoney_(payload.hpp, 'HPP produk'),
    order: Math.max(0, Math.floor(asNumber_(payload.order, products.length + 1))),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  }
  upsertRow_(SHEET_NAMES.products, id, next)
  const incomingVariants = Array.isArray(payload.variants) ? payload.variants.slice(0, 20) : []
  const previousVariants = readRows_(SHEET_NAMES.variants).filter((row) => String(row.productId) === id)
  const variantRows = incomingVariants.map((variant, index) => {
    const variantId = cleanText_(variant.id, 100) || newId_('var')
    const previousVariant = previousVariants.find((row) => String(row.id) === variantId)
    return {
      id: variantId,
      productId: id,
      name: requireText_(variant.name, 'Nama varian', 100),
      price: normalizeMoney_(variant.price, 'Harga varian'),
      hpp: normalizeMoney_(variant.hpp, 'HPP varian'),
      trackStock: variant.trackStock === true,
      stock: normalizeNonNegativeInteger_(variant.stock, 'Stok varian'),
      active: variant.active !== false,
      order: Math.max(0, Math.floor(asNumber_(variant.order, index + 1))),
      createdAt: previousVariant ? previousVariant.createdAt : now,
      updatedAt: now,
    }
  })
  const otherVariants = readRows_(SHEET_NAMES.variants).filter((row) => String(row.productId) !== id)
  replaceRows_(SHEET_NAMES.variants, [...otherVariants, ...variantRows])
  return toProduct_(next, variantRows.map(toVariant_), findRowById_(SHEET_NAMES.submenus, submenuId), getCategoryForSubmenu_(submenuId))
}

function deleteProduct_(id) {
  const productId = requireText_(id, 'Produk', 100)
  const product = findRowById_(SHEET_NAMES.products, productId)
  if (!product) {
    return { id: productId }
  }
  const variantRows = readRows_(SHEET_NAMES.variants)
  replaceRows_(SHEET_NAMES.variants, variantRows.filter((row) => String(row.productId) !== productId))
  deleteRowsByColumn_(SHEET_NAMES.products, 'id', productId)
  return { id: productId }
}

function getCategoryForSubmenu_(submenuId) {
  const submenu = findRowById_(SHEET_NAMES.submenus, submenuId)
  return submenu ? findRowById_(SHEET_NAMES.categories, submenu.categoryId) : null
}

function normalizeMoney_(value, label) {
  const number = Math.round(asNumber_(value, Number.NaN))
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(label + ' tidak valid.')
  }
  return number
}

function normalizeNonNegativeInteger_(value, label) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(label + ' tidak valid.')
  }
  return number
}

function hasUnsafeUrlCharacters_(value) {
  if (/\s/.test(value)) {
    return true
  }
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 32 || code === 127) {
      return true
    }
  }
  return false
}

function parseHttpsUrl_(value) {
  const rawUrl = cleanText_(value, 1000)
  if (!rawUrl || !/^https:\/\//i.test(rawUrl) || hasUnsafeUrlCharacters_(rawUrl) || rawUrl.indexOf('\\') >= 0) {
    return null
  }
  const authorityStart = 8
  const authorityTail = rawUrl.slice(authorityStart)
  const delimiterIndex = authorityTail.search(/[/?#]/)
  const authorityEnd = delimiterIndex < 0 ? rawUrl.length : authorityStart + delimiterIndex
  const authority = rawUrl.slice(authorityStart, authorityEnd)
  if (!authority || authority.indexOf('@') >= 0) {
    return null
  }
  let hostname = authority.toLowerCase()
  const portIndex = hostname.lastIndexOf(':')
  if (portIndex >= 0) {
    const port = hostname.slice(portIndex + 1)
    if (!/^\d+$/.test(port) || Number(port) !== 443) {
      return null
    }
    hostname = hostname.slice(0, portIndex)
  }
  if (!hostname || hostname.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/.test(hostname)) {
    return null
  }
  const remainder = rawUrl.slice(authorityEnd)
  const pathEnd = remainder.search(/[?#]/)
  return {
    rawUrl,
    hostname,
    pathname: pathEnd < 0 ? remainder : remainder.slice(0, pathEnd),
  }
}

function safeImageUrl_(value) {
  const parsed = parseHttpsUrl_(value)
  return parsed ? parsed.rawUrl : ''
}

function safeVideoUrlForRead_(value) {
  try {
    return safeVideoUrl_(value)
  } catch (error) {
    return ''
  }
}

function safeVideoUrl_(value) {
  const rawUrl = cleanText_(value, 1000)
  if (!rawUrl) {
    return ''
  }
  if (!/^https:\/\//i.test(rawUrl) || hasUnsafeUrlCharacters_(rawUrl) || rawUrl.indexOf('\\') >= 0) {
    throw new Error('URL video harus menggunakan HTTPS.')
  }
  const parsed = parseHttpsUrl_(rawUrl)
  if (!parsed) {
    throw new Error('URL video tidak valid.')
  }
  const hostname = parsed.hostname
  const isYoutube = hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtube-nocookie.com' || hostname.endsWith('.youtube-nocookie.com')
  const isVimeo = hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com') || hostname === 'player.vimeo.com'
  const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(parsed.pathname)
  if (!isYoutube && !isVimeo && !isDirectVideo) {
    throw new Error('URL video harus YouTube, Vimeo, atau file video HTTPS.')
  }
  return parsed.rawUrl
}
