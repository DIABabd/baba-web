import { useState, useMemo, useRef } from 'react'
import { toKey, fromKey, addDays, formatLong, isToday, formatNumber } from '../dateUtils.js'

const PRESENT = { label: 'حاضر', color: '#3d5a4c', bg: '#c9d9cd' }
const ABSENT = { label: 'غائب', color: '#6b6358', bg: '#e3dccb' }

function EntryEditor({ entry, onSave, onClose, employeeName }) {
  const [present, setPresent] = useState(entry?.present ?? null)
  const [paid, setPaid] = useState(
    entry && Number(entry.paid) ? String(entry.paid) : ''
  )

  const save = () => {
    onSave({ present, paid: Number(paid) || 0 })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{employeeName}</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 18 }}>الحضور والمبلغ المدفوع لهذا اليوم</p>

        <label className="field-label">الحضور</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { key: true, s: PRESENT },
            { key: false, s: ABSENT },
          ].map(({ key, s }) => (
            <button
              key={String(key)}
              onClick={() => setPresent((p) => (p === key ? null : key))}
              style={{
                flex: 1,
                padding: '14px 10px',
                borderRadius: 14,
                background: present === key ? s.bg : 'var(--surface-2)',
                border: present === key ? `2px solid ${s.color}` : '2px solid transparent',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--ink)',
              }}
            >
              {s.label} {present === key && '✓'}
            </button>
          ))}
        </div>

        <label className="field-label" htmlFor="paid-amount">المبلغ المدفوع</label>
        <input
          id="paid-amount"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          placeholder="0"
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" onClick={save}>حفظ</button>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
        {entry && (
          <button
            onClick={() => { onSave(null); onClose() }}
            className="btn-ghost"
            style={{ textAlign: 'center', marginTop: 12, width: '100%' }}
          >
            مسح تسجيل هذا اليوم
          </button>
        )}
      </div>
    </div>
  )
}

export default function TodayScreen({ data, updateData }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [pickerEmployee, setPickerEmployee] = useState(null)
  const dateInputRef = useRef(null)

  const openDatePicker = () => {
    const el = dateInputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return } catch { /* fall through */ }
    }
    el.focus()
    el.click()
  }

  const dateKey = toKey(selectedDate)
  const dayEntries = data.entries[dateKey] || {}
  const employees = data.employees

  const setEntry = (employeeId, entry) => {
    updateData((prev) => {
      const entries = { ...prev.entries }
      const dayObj = { ...(entries[dateKey] || {}) }
      const isEmpty = !entry || (entry.present == null && !entry.paid)
      if (isEmpty) {
        delete dayObj[employeeId]
      } else {
        dayObj[employeeId] = {
          present: entry.present === true ? true : entry.present === false ? false : null,
          paid: Number(entry.paid) || 0,
        }
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
    let present = 0, totalPaid = 0
    employees.forEach((e) => {
      const en = dayEntries[e.id]
      if (!en) return
      if (en.present === true) present++
      totalPaid += Number(en.paid) || 0
    })
    return { present, totalPaid, total: employees.length }
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
        <div style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
          <button
            onClick={openDatePicker}
            style={{ fontWeight: 800, fontSize: 16, background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{formatLong(selectedDate)}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>▾</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={toKey(selectedDate)}
            onChange={(e) => { if (e.target.value) setSelectedDate(fromKey(e.target.value)) }}
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', bottom: 0, left: '50%', width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0 }}
          />
          {!isToday(selectedDate) && (
            <div>
              <button
                onClick={() => setSelectedDate(new Date())}
                style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}
              >
                الرجوع إلى اليوم
              </button>
            </div>
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
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--warn)' }}>{formatNumber(summary.totalPaid)}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>المدفوع</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-soft)' }}>{summary.total}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>الإجمالي</div>
            </div>
          </div>

          <div className="section-title">الموظفون</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employees.map((emp) => {
              const en = dayEntries[emp.id]
              const att = en && en.present === true ? PRESENT : en && en.present === false ? ABSENT : null
              const paid = en ? Number(en.paid) || 0 : 0
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {paid > 0 && (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: 20,
                          background: '#f1d9cc',
                          color: '#b5532f',
                        }}
                      >
                        {formatNumber(paid)}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '6px 14px',
                        borderRadius: 20,
                        background: att ? att.bg : 'var(--surface-2)',
                        color: att ? att.color : 'var(--ink-soft)',
                      }}
                    >
                      {att ? att.label : 'لم يُحدد'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {pickerEmployee && (
        <EntryEditor
          employeeName={pickerEmployee.name}
          entry={dayEntries[pickerEmployee.id] || null}
          onSave={(entry) => setEntry(pickerEmployee.id, entry)}
          onClose={() => setPickerEmployee(null)}
        />
      )}
    </div>
  )
}
