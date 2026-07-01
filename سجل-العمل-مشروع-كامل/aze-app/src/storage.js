const STORAGE_KEY = 'aze_app_data_v1'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    const merged = { ...defaultData(), ...parsed }
    merged.entries = normalizeEntries(merged.entries)
    return merged
  } catch (e) {
    console.error('فشل تحميل البيانات', e)
    return defaultData()
  }
}

function defaultData() {
  return {
    employees: [],
    // entries: { "YYYY-MM-DD": { [employeeId]: { present: true|false|null, paid: number } } }
    entries: {},
    ledger: {
      baseAmount: 0,
      transactions: [], // { id, date, amount, details }
    },
  }
}

// Migrates old string statuses ("present_paid" | "present_unpaid" | "absent")
// into the new { present, paid } shape, and leaves already-new entries intact.
function normalizeEntries(entries) {
  if (!entries || typeof entries !== 'object') return {}
  const out = {}
  for (const [dateKey, dayObj] of Object.entries(entries)) {
    if (!dayObj || typeof dayObj !== 'object') continue
    const day = {}
    for (const [empId, val] of Object.entries(dayObj)) {
      if (val && typeof val === 'object') {
        const present = val.present === true ? true : val.present === false ? false : null
        const paid = Number(val.paid) || 0
        if (present !== null || paid) day[empId] = { present, paid }
      } else if (typeof val === 'string') {
        if (val === 'present_paid') day[empId] = { present: true, paid: 0 }
        else if (val === 'present_unpaid') day[empId] = { present: true, paid: 0 }
        else if (val === 'absent') day[empId] = { present: false, paid: 0 }
      }
    }
    if (Object.keys(day).length > 0) out[dateKey] = day
  }
  return out
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('فشل حفظ البيانات', e)
    return false
  }
}

function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const today = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `نسخة_احتياطية_${today}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const merged = { ...defaultData(), ...parsed }
        merged.entries = normalizeEntries(merged.entries)
        resolve(merged)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export { loadData, saveData, exportData, importData, defaultData, STORAGE_KEY }
