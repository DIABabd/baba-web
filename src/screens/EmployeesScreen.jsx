import { useState, useMemo } from 'react'
import { formatNumber } from '../dateUtils.js'

function makeId() {
  return 'emp_' + Math.random().toString(36).slice(2, 10)
}

function EmployeeForm({ initial, onSave, onClose, onDelete }) {
  const [name, setName] = useState(initial?.name || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>
          {initial ? 'تعديل الموظف' : 'إضافة موظف جديد'}
        </h3>
        <label className="field-label" htmlFor="emp-name">اسم الموظف</label>
        <input
          id="emp-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: أحمد"
          autoFocus
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn-primary"
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) { onSave(name.trim()); onClose() } }}
          >
            حفظ
          </button>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
        {initial && (
          <button
            onClick={() => { if (confirm(`حذف ${initial.name}؟ سيتم حذف كل سجلات حضوره أيضاً.`)) { onDelete(); onClose() } }}
            style={{ color: 'var(--warn)', fontWeight: 700, fontSize: 14, marginTop: 18, width: '100%', textAlign: 'center', padding: 10 }}
          >
            حذف الموظف
          </button>
        )}
      </div>
    </div>
  )
}

export default function EmployeesScreen({ data, updateData }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const stats = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const result = {}
    data.employees.forEach((e) => { result[e.id] = { present: 0, paid: 0 } })
    Object.entries(data.entries).forEach(([dateKey, dayObj]) => {
      if (!dateKey.startsWith(ym)) return
      Object.entries(dayObj).forEach(([empId, en]) => {
        if (!result[empId] || !en) return
        if (en.present === true) result[empId].present++
        result[empId].paid += Number(en.paid) || 0
      })
    })
    return result
  }, [data.entries, data.employees])

  const addEmployee = (name) => {
    updateData((prev) => ({
      ...prev,
      employees: [...prev.employees, { id: makeId(), name }],
    }))
  }

  const editEmployee = (id, name) => {
    updateData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, name } : e)),
    }))
  }

  const deleteEmployee = (id) => {
    updateData((prev) => {
      const entries = {}
      Object.entries(prev.entries).forEach(([dateKey, dayObj]) => {
        const copy = { ...dayObj }
        delete copy[id]
        if (Object.keys(copy).length > 0) entries[dateKey] = copy
      })
      return {
        ...prev,
        employees: prev.employees.filter((e) => e.id !== id),
        entries,
      }
    })
  }

  return (
    <div>
      {data.employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>لا يوجد موظفون بعد</p>
          <p style={{ fontSize: 14, marginBottom: 20 }}>أضف أول موظف لتبدأ</p>
        </div>
      ) : (
        <>
          <div className="section-title">هذا الشهر</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.employees.map((emp) => {
              const s = stats[emp.id] || { present: 0, paid: 0 }
              return (
                <button
                  key={emp.id}
                  className="card"
                  onClick={() => setEditing(emp)}
                  style={{ width: '100%', textAlign: 'right', padding: '16px 18px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</span>
                    <span style={{ color: 'var(--ink-soft)', fontSize: 18 }}>‹</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                      {s.present} أيام حضور
                    </span>
                    {s.paid > 0 && (
                      <span style={{ fontSize: 13, color: 'var(--warn)', fontWeight: 600 }}>
                        {formatNumber(s.paid)} مدفوع
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <button
        className="btn-primary"
        style={{ marginTop: 20 }}
        onClick={() => setFormOpen(true)}
      >
        + إضافة موظف
      </button>

      {formOpen && (
        <EmployeeForm
          onSave={addEmployee}
          onClose={() => setFormOpen(false)}
        />
      )}
      {editing && (
        <EmployeeForm
          initial={editing}
          onSave={(name) => editEmployee(editing.id, name)}
          onDelete={() => deleteEmployee(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
