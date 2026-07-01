import { useRef } from 'react'

export default function SettingsScreen({ data, onExport, onImport }) {
  const fileInputRef = useRef(null)

  return (
    <div>
      <div className="card" style={{ marginTop: 12, background: 'var(--warn-soft)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--warn)', marginBottom: 4 }}>
              البيانات محفوظة فقط على هذا الجهاز
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)' }}>
              إذا حذفت المتصفح أو غيّرت الجهاز، ستفقد البيانات إلا إذا أخذت نسخة احتياطية بانتظام.
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">نسخة احتياطية</div>

      <button className="btn-primary" onClick={onExport}>
        ⬇ تحميل نسخة احتياطية
      </button>

      <button
        className="btn-secondary"
        style={{ width: '100%', marginTop: 10 }}
        onClick={() => fileInputRef.current?.click()}
      >
        ⬆ استعادة من نسخة احتياطية
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            if (confirm('سيتم استبدال كل البيانات الحالية بالنسخة المستوردة. متابعة؟')) {
              onImport(file)
            }
          }
          e.target.value = ''
        }}
      />

      <div className="section-title">عن التطبيق</div>
      <div className="card">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
          {data.employees.length} موظف · {Object.keys(data.entries).length} يوم مسجَّل · {data.ledger.transactions.length} دفعة
        </div>
      </div>
    </div>
  )
}
