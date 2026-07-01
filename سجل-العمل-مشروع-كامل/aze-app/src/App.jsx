import { useState, useEffect, useMemo, useCallback } from 'react'
import { loadData, saveData, exportData, importData } from './storage.js'
import { toKey, fromKey, addDays, formatLong, formatShort, isToday, formatNumber } from './dateUtils.js'
import TodayScreen from './screens/TodayScreen.jsx'
import EmployeesScreen from './screens/EmployeesScreen.jsx'
import StatisticsScreen from './screens/StatisticsScreen.jsx'
import LedgerScreen from './screens/LedgerScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'

const TABS = [
  { id: 'today', label: 'اليوم', icon: '🗓️' },
  { id: 'employees', label: 'الموظفون', icon: '👥' },
  { id: 'stats', label: 'الإحصائيات', icon: '📊' },
  { id: 'ledger', label: 'السلفة', icon: '💰' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function App() {
  const [data, setData] = useState(() => loadData())
  const [tab, setTab] = useState('today')

  useEffect(() => {
    saveData(data)
  }, [data])

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  const handleImport = useCallback((file) => {
    importData(file).then((imported) => {
      setData(imported)
    }).catch(() => {
      alert('تعذرت قراءة الملف. تأكد أنه نسخة احتياطية صحيحة.')
    })
  }, [])

  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-title">سجل العمل</h1>
          <p className="app-subtitle">الحضور، الدفعات، والسلفة</p>
        </div>
      </header>

      <main>
        {tab === 'today' && <TodayScreen data={data} updateData={updateData} />}
        {tab === 'employees' && <EmployeesScreen data={data} updateData={updateData} />}
        {tab === 'stats' && <StatisticsScreen data={data} />}
        {tab === 'ledger' && <LedgerScreen data={data} updateData={updateData} />}
        {tab === 'settings' && (
          <SettingsScreen data={data} onExport={() => exportData(data)} onImport={handleImport} />
        )}
      </main>

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className="tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

export { toKey, fromKey, addDays, formatLong, formatShort, isToday, formatNumber }
