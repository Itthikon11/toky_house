const STATUS_STYLES = {
  ชำระแล้ว: 'bg-green-400 text-green-950',
  รับออเดอร์: 'bg-gray-300 text-gray-800',
  ยังไม่ชำระ: 'bg-red-400 text-white',
}
export const STATUS_OPTIONS = ['รับออเดอร์', 'ยังไม่ชำระ', 'ชำระแล้ว']

export default function StatusSelect({ value, onChange }) {
  const style = STATUS_STYLES[value] || 'bg-gray-200 text-gray-700'
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer appearance-none rounded-full px-4 py-1.5 pr-8 text-sm font-bold shadow-soft outline-none transition ${style}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-white text-black">
            {s}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
        ▾
      </span>
    </div>
  )
}
