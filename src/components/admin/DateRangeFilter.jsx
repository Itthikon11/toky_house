import { localDateKey } from '../../lib/format'

export function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDateKey(d)
}

export const monthStart = () => {
  const d = new Date()
  return localDateKey(new Date(d.getFullYear(), d.getMonth(), 1))
}

// ช่วงวันที่ (yyyy-mm-dd) → ช่วงเวลา ISO สำหรับค้นบิล (ต้นวัน – สิ้นวัน ตามเวลาท้องถิ่น)
export function isoRange(from, to) {
  return {
    from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : null,
  }
}

// ตัวเลือกช่วงวันที่ของหน้ายอดขาย / การเงิน: ปุ่มลัด + เลือกวันเอง
export default function DateRangeFilter({ from, to, onChange }) {
  const today = daysAgo(0)
  const presets = [
    { label: 'วันนี้', from: today },
    { label: '7 วัน', from: daysAgo(6) },
    { label: '30 วัน', from: daysAgo(29) },
    { label: 'เดือนนี้', from: monthStart() },
  ]

  return (
    <div className="card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-end">
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange({ from: p.from, to: today })}
            className={`chip shrink-0 ${from === p.from && to === today ? 'chip-active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 md:max-w-md">
        <label>
          <span className="field-label">ตั้งแต่</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className="input" />
        </label>
        <label>
          <span className="field-label">ถึง</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className="input" />
        </label>
      </div>
    </div>
  )
}
