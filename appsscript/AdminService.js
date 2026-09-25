function setupButet_() {
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    seedButet_()
    const properties = PropertiesService.getScriptProperties()
    if (properties.getProperty('BUTET_ADMIN_HASH')) {
      if (properties.getProperty('BUTET_SETUP_DOCUMENT_ID')) {
        return {
          ok: true,
          alreadyConfigured: true,
          message: 'Admin BUTET STORE sudah terkonfigurasi.',
        }
      }
      properties.deleteProperty('BUTET_ADMIN_USERNAME')
      properties.deleteProperty('BUTET_ADMIN_SALT')
      properties.deleteProperty('BUTET_ADMIN_HASH')
    }
    const temporaryPassword = createTemporaryPassword_()
    const setupDocument = createSetupDocument_(temporaryPassword)
    const salt = Utilities.getUuid().replace(/-/g, '')
    properties.setProperties({
      BUTET_ADMIN_USERNAME: 'admin',
      BUTET_ADMIN_SALT: salt,
      BUTET_ADMIN_HASH: hashSecret_(temporaryPassword, salt),
    })
    properties.setProperty('BUTET_SETUP_DOCUMENT_ID', setupDocument.getId())
    return {
      ok: true,
      alreadyConfigured: false,
      setupDocumentId: setupDocument.getId(),
      setupDocumentUrl: setupDocument.getUrl(),
      message: 'Dokumen kredensial awal dibuat di Google Drive akun pemilik.',
    }
  } finally {
    lock.releaseLock()
  }
}

function seedButet_() {
  initializeSheets_()
  const now = nowIso_()
  const existingCategories = readRows_(SHEET_NAMES.categories)
  const existingSlugs = new Set(existingCategories.map((row) => String(row.slug)))
  const newCategories = SEED_CATEGORIES
    .filter((category) => !existingSlugs.has(category[2]))
    .map((category) => ({
      id: category[0],
      name: category[1],
      slug: category[2],
      order: category[3],
      active: true,
      createdAt: now,
      updatedAt: now,
    }))
  if (newCategories.length) {
    appendRows_(SHEET_NAMES.categories, newCategories)
  }
  const currentSettings = readRows_(SHEET_NAMES.settings)
  const existingKeys = new Set(currentSettings.map((row) => String(row.key)))
  const newSettings = Object.keys(DEFAULT_SETTINGS)
    .filter((key) => !existingKeys.has(key))
    .map((key) => ({ key, value: DEFAULT_SETTINGS[key], updatedAt: now }))
  if (newSettings.length) {
    appendRows_(SHEET_NAMES.settings, newSettings)
  }
}

function createTemporaryPassword_() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let result = 'BS-'
  for (let index = 0; index < 16; index += 1) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return result
}

function createSetupDocument_(temporaryPassword) {
  const content = [
    'BUTET STORE — KREDENSIAL ADMIN AWAL',
    '',
    'Dokumen ini dibuat otomatis dan hanya dapat diakses akun pemilik script.',
    '',
    'URL aplikasi: /admin',
    'Username: admin',
    'Password sementara: ' + temporaryPassword,
    '',
    'Masuk ke aplikasi, buka Pengaturan, lalu immediately ganti password.',
    'Setelah password diganti, dokumen ini otomatis dipindahkan ke sampah.',
    '',
    'Waktu pembuatan: ' + nowIso_(),
  ].join('\n')
  return DriveApp.createFile(Utilities.newBlob(content, 'text/plain', 'BUTET STORE - Admin Awal.txt'))
}

function adminLogin_(payload) {
  const username = requireText_(payload.username, 'Username', 120)
  const password = requireText_(payload.password, 'Password', 200)
  const clientId = cleanText_(payload.clientId, 120) || 'unknown'
  const rateKey = 'login|' + hashSecret_(clientId, 'butet-login')
  const cache = CacheService.getScriptCache()
  const rate = parseRate_(cache.get(rateKey))
  if (rate.count >= APP_CONFIG.loginMaxAttempts && rate.expiresAt > Date.now()) {
    throw new Error('Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.')
  }
  const properties = PropertiesService.getScriptProperties()
  const expectedHash = properties.getProperty('BUTET_ADMIN_HASH')
  if (!expectedHash) {
    throw new Error('Admin belum dikonfigurasi. Jalankan setupButet_ dari editor Apps Script.')
  }
  const expectedUsername = properties.getProperty('BUTET_ADMIN_USERNAME') || 'admin'
  const salt = properties.getProperty('BUTET_ADMIN_SALT') || ''
  const usernameMatches = constantTimeEquals_(username, expectedUsername)
  const passwordMatches = constantTimeEquals_(hashSecret_(password, salt), expectedHash)
  if (!usernameMatches || !passwordMatches) {
    const nextCount = rate.count + 1
    cache.put(rateKey, JSON.stringify({ count: nextCount, expiresAt: rate.expiresAt || Date.now() + APP_CONFIG.loginWindowMinutes * 60 * 1000 }), APP_CONFIG.loginWindowMinutes * 60)
    throw new Error('Username atau password salah.')
  }
  cache.remove(rateKey)
  return createAdminSession_(expectedUsername)
}

function createAdminSession_(username) {
  const token = Utilities.base64EncodeWebSafe(Utilities.newBlob(Utilities.getUuid() + Utilities.getUuid()).getBytes()).replace(/=+$/g, '').slice(0, 64)
  const tokenHash = hashSecret_(token, 'butet-session')
  const expiresAt = Date.now() + APP_CONFIG.sessionHours * 60 * 60 * 1000
  const cache = CacheService.getScriptCache()
  cache.put('session|' + tokenHash, JSON.stringify({ username, expiresAt }), APP_CONFIG.sessionHours * 3600)
  const index = parseRate_(cache.get('admin-session-index'))
  const tokens = Array.from(new Set([...(index.values || []), tokenHash])).slice(-50)
  cache.put('admin-session-index', JSON.stringify({ values: tokens, expiresAt: Date.now() + APP_CONFIG.sessionHours * 3600 * 1000 }), APP_CONFIG.sessionHours * 3600)
  return {
    ok: true,
    sessionToken: token,
    expiresAt,
    username,
  }
}

function verifyAdminSession_(token) {
  if (!token) {
    throw new Error('Sesi admin diperlukan.')
  }
  const tokenHash = hashSecret_(String(token), 'butet-session')
  const cached = CacheService.getScriptCache().get('session|' + tokenHash)
  if (!cached) {
    throw new Error('Sesi admin tidak valid atau sudah berakhir.')
  }
  const session = JSON.parse(cached)
  if (!session.expiresAt || session.expiresAt <= Date.now()) {
    CacheService.getScriptCache().remove('session|' + tokenHash)
    throw new Error('Sesi admin sudah berakhir.')
  }
  return session
}

function adminLogout_(payload) {
  const token = cleanText_(payload.sessionToken, 200)
  if (token) {
    CacheService.getScriptCache().remove('session|' + hashSecret_(token, 'butet-session'))
  }
  return { ok: true }
}

function changeAdminPassword_(payload) {
  const username = requireText_(payload.username, 'Username', 120)
  const currentPassword = requireText_(payload.currentPassword, 'Password saat ini', 200)
  const newPassword = requireText_(payload.newPassword, 'Password baru', 200)
  if (newPassword.length < 10) {
    throw new Error('Password baru minimal 10 karakter.')
  }
  const properties = PropertiesService.getScriptProperties()
  const salt = properties.getProperty('BUTET_ADMIN_SALT') || ''
  const expectedHash = properties.getProperty('BUTET_ADMIN_HASH') || ''
  if (!constantTimeEquals_(username, properties.getProperty('BUTET_ADMIN_USERNAME') || 'admin') || !constantTimeEquals_(hashSecret_(currentPassword, salt), expectedHash)) {
    throw new Error('Password saat ini salah.')
  }
  const nextSalt = Utilities.getUuid().replace(/-/g, '')
  properties.setProperties({
    BUTET_ADMIN_SALT: nextSalt,
    BUTET_ADMIN_HASH: hashSecret_(newPassword, nextSalt),
  })
  clearAdminSessions_()
  trashSetupDocument_()
  return { ok: true, message: 'Password diperbarui. Silakan masuk kembali.' }
}

function clearAdminSessions_() {
  const cache = CacheService.getScriptCache()
  const index = parseRate_(cache.get('admin-session-index'))
  ;(index.values || []).forEach((tokenHash) => cache.remove('session|' + tokenHash))
  cache.remove('admin-session-index')
}

function trashSetupDocument_() {
  const documentId = PropertiesService.getScriptProperties().getProperty('BUTET_SETUP_DOCUMENT_ID')
  if (!documentId) {
    return
  }
  try {
    DriveApp.getFileById(documentId).setTrashed(true)
  } catch (error) {
    return
  }
  PropertiesService.getScriptProperties().deleteProperty('BUTET_SETUP_DOCUMENT_ID')
}

function saveSettings_(payload) {
  const textLimits = {
    STORE_NAME: 100,
    STORE_SLOGAN: 200,
    STORE_TAGLINE: 200,
    STORE_PHONE: 30,
    PAYMENT_INSTRUCTIONS: 800,
    SHIPPING_NOTE: 300,
    PROMO_TITLE: 140,
    PROMO_MESSAGE: 600,
  }
  const legacyBank = {
    bankName: cleanText_(payload.BANK_NAME, 100),
    accountNumber: cleanText_(payload.BANK_ACCOUNT_NUMBER, 100),
    accountHolder: cleanText_(payload.BANK_ACCOUNT_HOLDER, 150),
  }
  const bankAccounts = Object.prototype.hasOwnProperty.call(payload, 'BANK_ACCOUNTS_JSON')
    ? parseBankAccountsInput_(payload.BANK_ACCOUNTS_JSON)
    : parseBankAccountsInput_([legacyBank])
  Object.keys(textLimits).forEach((key) => {
    setSetting_(key, cleanText_(payload[key], textLimits[key]))
  })
  const primaryBank = bankAccounts[0] || {}
  setSetting_('BANK_ACCOUNTS_JSON', JSON.stringify(bankAccounts))
  setSetting_('BANK_NAME', primaryBank.bankName || '')
  setSetting_('BANK_ACCOUNT_NUMBER', primaryBank.accountNumber || '')
  setSetting_('BANK_ACCOUNT_HOLDER', primaryBank.accountHolder || '')
  setSetting_('QRIS_IMAGE_URL', safeImageUrl_(payload.QRIS_IMAGE_URL))
  setSetting_('PROMO_IMAGE_URL', safeImageUrl_(payload.PROMO_IMAGE_URL))
  setSetting_('PROMO_LINK', safeImageUrl_(payload.PROMO_LINK))
  setSetting_('PROMO_ACTIVE', payload.PROMO_ACTIVE === true ? 'true' : 'false')
  return publicSettings_()
}

function parseBankAccountsInput_(value) {
  let accounts = value
  if (typeof value === 'string') {
    if (!value.trim()) {
      accounts = []
    } else {
      try {
        accounts = JSON.parse(value)
      } catch (error) {
        throw new Error('Daftar rekening tidak valid.')
      }
    }
  }
  if (!Array.isArray(accounts)) {
    throw new Error('Daftar rekening tidak valid.')
  }
  if (accounts.length > APP_CONFIG.maximumBankAccounts) {
    throw new Error('Maksimal ' + APP_CONFIG.maximumBankAccounts + ' rekening dapat disimpan.')
  }
  return accounts.map((account, index) => {
    if (!account || typeof account !== 'object' || Array.isArray(account)) {
      throw new Error('Rekening ke-' + (index + 1) + ' tidak valid.')
    }
    const bankName = cleanText_(account.bankName, 100)
    const accountNumber = cleanText_(account.accountNumber, 100)
    const accountHolder = cleanText_(account.accountHolder, 150)
    if (!bankName && !accountNumber && !accountHolder) {
      return null
    }
    if (!bankName || !accountNumber || !accountHolder) {
      throw new Error('Rekening ke-' + (index + 1) + ' harus lengkap.')
    }
    return {
      id: cleanText_(account.id, 100) || 'bank-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12),
      bankName,
      accountNumber,
      accountHolder,
    }
  }).filter(Boolean)
}

function getAdminSettings_() {
  return publicSettings_()
}

function uploadAdminImage_(payload) {
  const dataUrl = String(payload.dataUrl || '')
  const match = dataUrl.match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/)
  if (!match) {
    throw new Error('Format gambar harus PNG, JPG, atau WebP.')
  }
  if (dataUrl.length > APP_CONFIG.maximumDataUrlLength) {
    throw new Error('Ukuran gambar terlalu besar. Maksimal sekitar 3 MB.')
  }
  const bytes = Utilities.base64Decode(match[3])
  if (!bytes.length) {
    throw new Error('File gambar tidak memiliki isi.')
  }
  const extension = match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1]
  const fileName = 'butet-image-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12) + '.' + extension
  const blob = Utilities.newBlob(bytes, match[1], fileName)
  const folder = getUploadFolder_()
  const file = folder.createFile(blob)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  } catch (error) {
    file.setTrashed(true)
    throw new Error('Drive tidak dapat membagikan gambar secara publik. Periksa izin akun.')
  }
  return {
    ok: true,
    fileId: file.getId(),
    url: 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(file.getId()),
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(file.getId()) + '&sz=w1000',
  }
}

function getUploadFolder_() {
  const properties = PropertiesService.getScriptProperties()
  const folderId = properties.getProperty('BUTET_UPLOAD_FOLDER_ID')
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId)
    } catch (error) {
      properties.deleteProperty('BUTET_UPLOAD_FOLDER_ID')
    }
  }
  const folder = DriveApp.createFolder('BUTET STORE - Upload')
  properties.setProperty('BUTET_UPLOAD_FOLDER_ID', folder.getId())
  return folder
}

function hashSecret_(secret, salt) {
  let value = String(salt || '') + ':' + String(secret || '')
  for (let index = 0; index < 2500; index += 1) {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value + ':' + index)
    value = Utilities.base64Encode(digest)
  }
  return value
}

function constantTimeEquals_(left, right) {
  const first = String(left || '')
  const second = String(right || '')
  let difference = first.length ^ second.length
  const length = Math.max(first.length, second.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (first.charCodeAt(index) || 0) ^ (second.charCodeAt(index) || 0)
  }
  return difference === 0
}

function parseRate_(value) {
  if (!value) {
    return { count: 0, expiresAt: 0, values: [] }
  }
  try {
    return JSON.parse(value)
  } catch (error) {
    return { count: 0, expiresAt: 0, values: [] }
  }
}
