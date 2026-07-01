import { useState, useMemo } from 'react'
import { toKey, fromKey, addDays, formatLong, isToday } from '../dateUtils.js'

const STATUS = {
  present_paid: { label: 'حاضر ودُفع', short: 'دُفع', color: '#3d5a4c', bg: '#c9d9cd' },
  present_unpaid: { label: 'حاضر ولم يُدفع', short: 'لم يُدفع', color: '#b5532f', bg: '#f1d9cc' },
  absent: { label: 'غائب', short: 'غائب', color: '#6b6358', bg: '#e3dccb' },
}

function StatusPicker({ value, onChange, onClose, employeeName }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{employeeName}</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 18 }}>اختر الحالة لهذا اليوم</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(STATUS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { onChange(key); onClose() }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 14,
                background: value === key ? s.bg : 'var(--surface-2)',
                border: value === key ? `2px solid ${s.color}` : '2px solid transparent',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--ink)',
              }}
            >
              <span>{s.label}</span>
              {value === key && <span style={{ color: s.color }}>✓</span>}
            </button>
          ))}
          {value && (
            <button
              onClick={() => { onChange(null); onClose() }}
              className="btn-ghost"
              style={{ textAlign: 'center', marginTop: 4 }}
            >
              مسح الحالة
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TodayScreen({ data, updateData }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [pickerEmployee, setPickerEmployee] = useState(null)

  const dateKey = toKey(selectedDate)
  const dayEntries = data.entries[dateKey] || {}
  const employees = data.employees

  const setStatus = (employeeId, status) => {
    updateData((prev) => {
      const entries = { ...prev.entries }
      const dayObj = { ...(entries[dateKey] || {}) }
      if (status === null) {
        delete dayObj[employeeId]
      } else {
        dayObj[employeeId] = status
      }
      if (Object.keys(dayObj).length === 0) {
        delete entries[dateKey]
      } else {
        entries[dateKey] = dayObj
      }
      return { ...prev, entries }
    })
  }

  const summary = useMemo(() => {
    let present = 0, unpaid = 0
    employees.forEach((e) => {
      const s = dayEntries[e.id]
      if (s === 'present_paid' || s === 'present_unpaid') present++
      if (s === 'present_unpaid') unpaid++
    })
    return { present, unpaid, total: employees.length }
  }, [dayEntries, employees])

  return (
    <div>
      <div className="card" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          aria-label="اليوم التالي"
          style={{ fontSize: 22, padding: '6px 10px', borderRadius: 10 }}
        >
          ‹
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{formatLong(selectedDate)}</div>
          {!isToday(selectedDate) && (
            <button
              onClick={() => setSelectedDate(new Date())}
              style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}
            >
              الرجوع إلى اليوم
            </button>
          )}
        </div>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          aria-label="اليوم السابق"
          style={{ fontSize: 22, padding: '6px 10px', borderRadius: 10 }}
        >
          ›
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>لا يوجد موظفون بعد</p>
          <p style={{ fontSize: 14 }}>أضف الموظفين من تبويب «الموظفون» لتبدأ بتسجيل الحضور</p>
        </div>
      ) : (
        <>
          <div
            className="card"
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'space-around',
              textAlign: 'center',
              padding: '14px 8px',
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{summary.present}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>حاضر</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--warn)' }}>{summary.unpaid}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>لم يُدفع</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-soft)' }}>{summary.total}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>الإجمالي</div>
            </div>
          </div>

          <div className="section-title">الموظفون</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employees.map((emp) => {
              const status = dayEntries[emp.id]
              const s = status ? STATUS[status] : null
              return (
                <button
                  key={emp.id}
                  className="card"
                  onClick={() => setPickerEmployee(emp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'right',
                    padding: '16px 18px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 20,
                      background: s ? s.bg : 'var(--surface-2)',
                      color: s ? s.color : 'var(--ink-soft)',
                    }}
                  >
                    {s ? s.short : 'لم يُحدد'}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {pickerEmployee && (
        <StatusPicker
          employeeName={pickerEmployee.name}
          value={dayEntries[pickerEmployee.id] || null}
          onChange={(status) => setStatus(pickerEmployee.id, status)}
          onClose={() => setPickerEmployee(null)}
        />
      )}
    </div>
  )
}
