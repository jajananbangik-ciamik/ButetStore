function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('BUTET_SPREADSHEET_ID')
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId)
  }
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  if (!activeSpreadsheet) {
    throw new Error('Spreadsheet BUTET STORE belum terhubung.')
  }
  PropertiesService.getScriptProperties().setProperty('BUTET_SPREADSHEET_ID', activeSpreadsheet.getId())
  return activeSpreadsheet
}

function getSheet_(name) {
  const spreadsheet = getSpreadsheet_()
  const sheet = spreadsheet.getSheetByName(name)
  if (!sheet) {
    throw new Error('Sheet ' + name + ' tidak ditemukan.')
  }
  return sheet
}

function ensureSheet_(name) {
  const spreadsheet = getSpreadsheet_()
  let sheet = spreadsheet.getSheetByName(name)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name)
  }
  const headers = SHEET_SCHEMAS[name]
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0]
    if (headers.some((header, index) => currentHeaders[index] !== header)) {
      throw new Error('Struktur sheet ' + name + ' tidak sesuai.')
    }
  }
  return sheet
}

function initializeSheets_() {
  Object.keys(SHEET_SCHEMAS).forEach(ensureSheet_)
}

function readRows_(name) {
  const sheet = ensureSheet_(name)
  const headers = SHEET_SCHEMAS[name]
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) {
    return []
  }
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
  return values.map((row) => {
    const item = {}
    headers.forEach((header, index) => {
      item[header] = row[index]
    })
    return item
  })
}

function appendRows_(name, rows) {
  if (!rows.length) {
    return
  }
  const sheet = ensureSheet_(name)
  const headers = SHEET_SCHEMAS[name]
  const startRow = Math.max(sheet.getLastRow() + 1, 2)
  sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows.map((row) => headers.map((header) => {
    const value = row[header]
    return value === undefined || value === null ? '' : value
  })))
}

function replaceRows_(name, rows) {
  const sheet = ensureSheet_(name)
  const headers = SHEET_SCHEMAS[name]
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map((row) => headers.map((header) => {
      const value = row[header]
      return value === undefined || value === null ? '' : value
    })))
  }
  if (sheet.getLastRow() > rows.length + 1) {
    sheet.getRange(rows.length + 2, 1, sheet.getLastRow() - rows.length - 1, headers.length).clearContent()
  }
}

function findRowById_(name, id) {
  return readRows_(name).find((row) => String(row.id) === String(id)) || null
}

function findRowByColumn_(name, column, value) {
  return readRows_(name).find((row) => String(row[column]) === String(value)) || null
}

function upsertRow_(name, id, values) {
  const sheet = ensureSheet_(name)
  const headers = SHEET_SCHEMAS[name]
  const rows = readRows_(name)
  const existingIndex = rows.findIndex((row) => String(row.id) === String(id))
  const current = existingIndex >= 0 ? rows[existingIndex] : { id }
  const next = { ...current, ...values, id }
  if (existingIndex >= 0) {
    rows[existingIndex] = next
    sheet.getRange(existingIndex + 2, 1, 1, headers.length).setValues([headers.map((header) => next[header] ?? '')])
  } else {
    appendRows_(name, [next])
  }
  return next
}

function deleteRowsByColumn_(name, column, value) {
  const sheet = ensureSheet_(name)
  const rows = readRows_(name).filter((row) => String(row[column]) !== String(value))
  replaceRows_(name, rows)
}

function truncateSheet_(name, lastRow) {
  const sheet = ensureSheet_(name)
  if (sheet.getLastRow() > lastRow) {
    sheet.getRange(lastRow + 1, 1, sheet.getLastRow() - lastRow, SHEET_SCHEMAS[name].length).clearContent()
  }
}

function getSettingsMap_() {
  const settings = {}
  readRows_(SHEET_NAMES.settings).forEach((row) => {
    settings[String(row.key)] = String(row.value ?? '')
  })
  return { ...DEFAULT_SETTINGS, ...settings }
}

function getSetting_(key) {
  return getSettingsMap_()[key] ?? ''
}

function setSetting_(key, value) {
  const rows = readRows_(SHEET_NAMES.settings)
  const existing = rows.find((row) => String(row.key) === String(key))
  const now = new Date().toISOString()
  if (existing) {
    existing.value = value == null ? '' : String(value)
    existing.updatedAt = now
  } else {
    rows.push({ key, value: value == null ? '' : String(value), updatedAt: now })
  }
  replaceRows_(SHEET_NAMES.settings, rows)
}

function publicSettings_() {
  const settings = getSettingsMap_()
  return {
    storeName: settings.STORE_NAME,
    slogan: settings.STORE_SLOGAN,
    tagline: settings.STORE_TAGLINE,
    storePhone: settings.STORE_PHONE,
    paymentInstructions: settings.PAYMENT_INSTRUCTIONS,
    qrisImageUrl: settings.QRIS_IMAGE_URL,
    bankName: settings.BANK_NAME,
    bankAccountNumber: settings.BANK_ACCOUNT_NUMBER,
    bankAccountHolder: settings.BANK_ACCOUNT_HOLDER,
    shippingNote: settings.SHIPPING_NOTE,
    promo: {
      active: asBoolean_(settings.PROMO_ACTIVE),
      title: settings.PROMO_TITLE,
      message: settings.PROMO_MESSAGE,
      imageUrl: settings.PROMO_IMAGE_URL,
      link: settings.PROMO_LINK,
    },
  }
}

function asNumber_(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function asBoolean_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1'
}

function slugify_(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function newId_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12)
}

function nowIso_() {
  return new Date().toISOString()
}

function cleanText_(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength || APP_CONFIG.maximumTextLength)
}

function requireText_(value, label, maxLength) {
  const result = cleanText_(value, maxLength || 160)
  if (!result) {
    throw new Error(label + ' wajib diisi.')
  }
  return result
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}
