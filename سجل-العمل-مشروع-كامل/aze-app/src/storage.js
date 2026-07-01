const STORAGE_KEY = 'aze_app_data_v1'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    return { ...defaultData(), ...parsed }
  } catch (e) {
    console.error('فشل تحميل البيانات', e)
    return defaultData()
  }
}

function defaultData() {
  return {
    employees: [],
    // entries: { "YYYY-MM-DD": { [employeeId]: "present_paid" | "present_unpaid" | "absent" } }
    entries: {},
    ledger: {
      baseAmount: 0,
      transactions: [], // { id, date, amount, details }
    },
  }
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
        resolve({ ...defaultData(), ...parsed })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export { loadData, saveData, exportData, importData, defaultData, STORAGE_KEY }
