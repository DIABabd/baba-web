import { useState, useMemo } from 'react'
import { formatShort, formatNumber } from '../dateUtils.js'

function makeId() {
  return 'tx_' + Math.random().toString(36).slice(2, 10)
}

function TransactionForm({ onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const canSave = amount !== '' && !isNaN(Number(amount)) && Number(amount) > 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>إضافة دفعة</h3>

        <label className="field-label" htmlFor="tx-date">التاريخ</label>
        <input
          id="tx-date"
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="tx-amount">المبلغ المدفوع</label>
        <input
          id="tx-amount"
          type="number"
          inputMode="decimal"
          className="input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          style={{ marginBottom: 14 }}
          autoFocus
        />

        <label className="field-label" htmlFor="tx-details">التفاصيل (لماذا؟)</label>
        <input
          id="tx-details"
          className="input"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="مثال: تكسي، مشتريات..."
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onSave({ id: makeId(), date, amount: Number(amount), details: details.trim() })
              onClose()
            }}
          >
            حفظ الدفعة
          </button>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  )
}

function BaseAmountForm({ initial, onSave, onClose }) {
  const [value, setValue] = useState(String(initial || ''))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>تعديل مبلغ السلفة الأساسي</h3>
        <label className="field-label" htmlFor="base-amount">المبلغ</label>
        <input
          id="base-amount"
          type="number"
          inputMode="decimal"
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn-primary"
            onClick={() => { onSave(Number(value) || 0); onClose() }}
          >
            حفظ
          </button>
          <button className="btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  )
}

export default function LedgerScreen({ data, updateData }) {
  const [txFormOpen, setTxFormOpen] = useState(false)
  const [baseFormOpen, setBaseFormOpen] = useState(false)

  const { baseAmount, transactions } = data.ledger

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions]
  )

  const totalPaid = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions])
  const balance = baseAmount - totalPaid

  const addTransaction = (tx) => {
    updateData((prev) => ({
      ...prev,
      ledger: { ...prev.ledger, transactions: [...prev.ledger.transactions, tx] },
    }))
  }

  const deleteTransaction = (id) => {
    updateData((prev) => ({
      ...prev,
      ledger: { ...prev.ledger, transactions: prev.ledger.transactions.filter((t) => t.id !== id) },
    }))
  }

  const setBaseAmount = (value) => {
    updateData((prev) => ({ ...prev, ledger: { ...prev.ledger, baseAmount: value } }))
  }

  return (
    <div>
      <div className="card" style={{ marginTop: 12, textAlign: 'center', padding: '24px 18px' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, marginBottom: 6 }}>
          الرصيد المتبقي
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: balance >= 0 ? 'var(--accent)' : 'var(--warn)',
          }}
        >
          {formatNumber(balance)}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 8,
            fontSize: 13,
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: 20,
            background: balance >= 0 ? 'var(--accent-soft)' : 'var(--warn-soft)',
            color: balance >= 0 ? 'var(--accent)' : 'var(--warn)',
          }}
        >
          {balance >= 0 ? 'زيادة' : 'نقص'}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>المبلغ الأساسي للسلفة</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{formatNumber(baseAmount)}</div>
        </div>
        <button className="btn-secondary" onClick={() => setBaseFormOpen(true)}>تعديل</button>
      </div>

      <div className="section-title">سجل الدفعات</div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💸</div>
          <p style={{ fontWeight: 700, fontSize: 16 }}>لا توجد دفعات مسجلة بعد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.details || 'بدون تفاصيل'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {formatShort(new Date(t.date))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 800, color: 'var(--warn)' }}>-{formatNumber(t.amount)}</span>
                <button
                  onClick={() => { if (confirm('حذف هذه الدفعة؟')) deleteTransaction(t.id) }}
                  aria-label="حذف"
                  style={{ color: 'var(--ink-soft)', fontSize: 18, padding: 4 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setTxFormOpen(true)}>
        + إضافة دفعة
      </button>

      {txFormOpen && <TransactionForm onSave={addTransaction} onClose={() => setTxFormOpen(false)} />}
      {baseFormOpen && (
        <BaseAmountForm initial={baseAmount} onSave={setBaseAmount} onClose={() => setBaseFormOpen(false)} />
      )}
    </div>
  )
}
