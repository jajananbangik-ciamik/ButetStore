function doGet(event) {
  try {
    const action = String(event?.parameter?.action || 'bootstrap')
    if (action === 'health') {
      return jsonResponse_(healthCheck_())
    }
    if (action === 'bootstrap') {
      return jsonResponse_({ ok: true, data: getCatalog_(false) })
    }
    return jsonResponse_({ ok: false, error: 'Endpoint tidak ditemukan.' })
  } catch (error) {
    return jsonResponse_({ ok: false, error: errorMessage_(error) })
  }
}

function doPost(event) {
  try {
    const body = parseBody_(event)
    const action = String(body.action || '')
    if (action === 'createOrder') {
      return jsonResponse_(createOrder_(body))
    }
    if (action === 'trackOrder') {
      return jsonResponse_(trackOrder_(body))
    }
    if (action === 'adminLogin') {
      return jsonResponse_(adminLogin_(body))
    }
    if (action === 'adminLogout') {
      return jsonResponse_(adminLogout_(body))
    }
    const session = verifyAdminSession_(body.sessionToken)
    if (action === 'adminSession') {
      return jsonResponse_({ ok: true, session })
    }
    if (action === 'getAdminCatalog') {
      return jsonResponse_({ ok: true, data: getCatalog_(true) })
    }
    if (action === 'saveCategory') {
      return jsonResponse_({ ok: true, data: saveCategory_(body) })
    }
    if (action === 'deleteCategory') {
      return jsonResponse_({ ok: true, data: deleteCategory_(body.id) })
    }
    if (action === 'saveSubmenu') {
      return jsonResponse_({ ok: true, data: saveSubmenu_(body) })
    }
    if (action === 'deleteSubmenu') {
      return jsonResponse_({ ok: true, data: deleteSubmenu_(body.id) })
    }
    if (action === 'saveProduct') {
      return jsonResponse_({ ok: true, data: saveProduct_(body) })
    }
    if (action === 'deleteProduct') {
      return jsonResponse_({ ok: true, data: deleteProduct_(body.id) })
    }
    if (action === 'listOrders') {
      return jsonResponse_({ ok: true, data: listAdminOrders_(body) })
    }
    if (action === 'getOrder') {
      return jsonResponse_({ ok: true, data: getAdminOrder_(body.id) })
    }
    if (action === 'updateOrderStatus') {
      return jsonResponse_({ ok: true, data: updateOrderStatus_(body, session.username) })
    }
    if (action === 'adminDashboard') {
      return jsonResponse_({ ok: true, data: getAdminDashboard_() })
    }
    if (action === 'profitReport') {
      return jsonResponse_({ ok: true, data: getProfitReport_(body) })
    }
    if (action === 'getSettings') {
      return jsonResponse_({ ok: true, data: getAdminSettings_() })
    }
    if (action === 'saveSettings') {
      return jsonResponse_({ ok: true, data: saveSettings_(body) })
    }
    if (action === 'uploadImage') {
      return jsonResponse_(uploadAdminImage_(body))
    }
    if (action === 'changePassword') {
      return jsonResponse_(changeAdminPassword_({ ...body, username: session.username }))
    }
    return jsonResponse_({ ok: false, error: 'Aksi tidak ditemukan.' })
  } catch (error) {
    return jsonResponse_({ ok: false, error: errorMessage_(error) })
  }
}

function setupButet() {
  return setupButet_()
}

function healthCheck_() {
  const spreadsheet = getSpreadsheet_()
  return {
    ok: true,
    app: APP_CONFIG.name,
    version: APP_CONFIG.version,
    spreadsheetName: spreadsheet.getName(),
    schemaReady: Object.keys(SHEET_SCHEMAS).every((name) => Boolean(spreadsheet.getSheetByName(name))),
    timestamp: nowIso_(),
  }
}

function parseBody_(event) {
  const contents = event?.postData?.contents || '{}'
  if (contents.length > APP_CONFIG.maximumDataUrlLength) {
    throw new Error('Data permintaan terlalu besar.')
  }
  const body = JSON.parse(contents)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Format permintaan tidak valid.')
  }
  return body
}

function errorMessage_(error) {
  const message = error && error.message ? String(error.message) : 'Terjadi kesalahan pada server.'
  return message.slice(0, 500)
}
