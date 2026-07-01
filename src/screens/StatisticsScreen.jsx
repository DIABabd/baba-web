import { useState, useMemo, useRef } from 'react'
import {
  toKey, fromKey, addDays, addMonths, addYears, startOfWeek,
  formatLong, formatShort, formatNumber, MONTHS_AR,
} from '../dateUtils.js'

const PERIODS = [
  { id: 'day', label: 'يومي' },
  { id: 'week', label: 'أسبوعي' },
  { id: 'month', label: 'شهري' },
  { id: 'year', label: 'سنوي' },
]

function getRange(anchor, period) {
  if (period === 'day') {
    return { start: anchor, end: anchor, label: formatLong(anchor) }
  }
  if (period === 'week') {
    const start = startOfWeek(anchor)
    const end = addDays(start, 6)
    return { start, end, label: `${formatShort(start)} — ${formatShort(end)}` }
  }
  if (period === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    return { start, end, label: `${MONTHS_AR[anchor.getMonth()]} ${anchor.getFullYear()}` }
  }
  const start = new Date(anchor.getFullYear(), 0, 1)
  const end = new Date(anchor.getFullYear(), 11, 31)
  return { start, end, label: `${anchor.getFullYear()}` }
}

function StatCard({ value, label, color }) {
  return (
    <div className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function StatisticsScreen({ data }) {
  const [period, setPeriod] = useState('month')
  const [anchor, setAnchor] = useState(new Date())

  const employees = data.employees
  const range = useMemo(() => getRange(anchor, period), [anchor, period])
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

  const move = (dir) => {
    setAnchor((d) => {
      if (period === 'day') return addDays(d, dir)
      if (period === 'week') return addDays(d, dir * 7)
      if (period === 'month') return addMonths(d, dir)
      return addYears(d, dir)
    })
  }

  const isCurrent = useMemo(() => {
    const nowKey = toKey(new Date())
    return nowKey >= toKey(range.start) && nowKey <= toKey(range.end)
  }, [range])

  const stats = useMemo(() => {
    const startKey = toKey(range.start)
    const endKey = toKey(range.end)
    const per = {}
    employees.forEach((e) => { per[e.id] = { present: 0, absent: 0, paid: 0 } })

    let present = 0, absent = 0, paid = 0
    const activeDays = new Set()

    Object.entries(data.entries).forEach(([dk, dayObj]) => {
      if (dk < startKey || dk > endKey) return
      Object.entries(dayObj).forEach(([empId, en]) => {
        if (!en) return
        const p = per[empId]
        const amt = Number(en.paid) || 0
        if (en.present === true) { present++; if (p) p.present++ }
        else if (en.present === false) { absent++; if (p) p.absent++ }
        paid += amt
        if (p) p.paid += amt
        if (en.present != null || amt) activeDays.add(dk)
      })
    })

    const marked = present + absent
    const rate = marked > 0 ? Math.round((present / marked) * 100) : 0
    const avgPerPresent = present > 0 ? Math.round(paid / present) : 0

    let topPresent = null, topPaid = null
    employees.forEach((e) => {
      const p = per[e.id]
      if (p.present > 0 && (!topPresent || p.present > per[topPresent.id].present)) topPresent = e
      if (p.paid > 0 && (!topPaid || p.paid > per[topPaid.id].paid)) topPaid = e
    })

    return { present, absent, paid, marked, rate, avgPerPresent, per, activeDays: activeDays.size, topPresent, topPaid }
  }, [data.entries, employees, range])

  return (
    <div>
      {/* Period selector */}
      <div
        className="card"
        style={{ marginTop: 12, display: 'flex', gap: 6, padding: 6 }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              background: period === p.id ? 'var(--accent)' : 'transparent',
              color: period === p.id ? '#fff' : 'var(--ink-soft)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      <div className="card" style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => move(1)} aria-label="التالي" style={{ fontSize: 22, padding: '6px 10px', borderRadius: 10 }}>‹</button>
        <div style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
          <button
            onClick={openDatePicker}
            style={{ fontWeight: 800, fontSize: 15, background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{range.label}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>▾</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={toKey(anchor)}
            onChange={(e) => { if (e.target.value) setAnchor(fromKey(e.target.value)) }}
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', bottom: 0, left: '50%', width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0 }}
          />
          {!isCurrent && (
            <div>
              <button
                onClick={() => setAnchor(new Date())}
                style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}
              >
                الرجوع إلى الآن
              </button>
            </div>
          )}
        </div>
        <button onClick={() => move(-1)} aria-label="السابق" style={{ fontSize: 22, padding: '6px 10px', borderRadius: 10 }}>›</button>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📊</div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>لا توجد بيانات بعد</p>
          <p style={{ fontSize: 14 }}>أضف الموظفين وسجّل الحضور لتظهر الإحصائيات</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <StatCard value={formatNumber(stats.paid)} label="إجمالي المدفوع" color="var(--warn)" />
            <StatCard value={`${stats.rate}%`} label="نسبة الحضور" color="var(--accent)" />
            <StatCard value={formatNumber(stats.present)} label="أيام الحضور" color="var(--accent)" />
            <StatCard value={formatNumber(stats.absent)} label="أيام الغياب" color="var(--ink-soft)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <StatCard value={formatNumber(stats.avgPerPresent)} label="متوسط الدفع لكل حضور" color="var(--ink)" />
            <StatCard value={formatNumber(stats.activeDays)} label="أيام العمل المسجّلة" color="var(--ink)" />
          </div>

          {(stats.topPresent || stats.topPaid) && (
            <div className="card" style={{ marginTop: 12, padding: '14px 16px' }}>
              {stats.topPresent && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>الأكثر حضوراً</span>
                  <span style={{ fontWeight: 700 }}>
                    {stats.topPresent.name} · {stats.per[stats.topPresent.id].present} أيام
                  </span>
                </div>
              )}
              {stats.topPaid && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: stats.topPresent ? 10 : 0 }}>
                  <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>الأعلى دفعاً</span>
                  <span style={{ fontWeight: 700 }}>
                    {stats.topPaid.name} · {formatNumber(stats.per[stats.topPaid.id].paid)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Per-employee breakdown */}
          <div className="section-title">حسب الموظف</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employees.map((emp) => {
              const p = stats.per[emp.id] || { present: 0, absent: 0, paid: 0 }
              return (
                <div key={emp.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--warn)' }}>{formatNumber(p.paid)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{p.present} حضور</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{p.absent} غياب</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
