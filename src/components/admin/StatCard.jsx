import Icon from '../ui/Icon'

// การ์ดตัวเลขสรุปบนแดชบอร์ด (alert = เน้นสีแดงเมื่อมีเรื่องต้องจัดการ)
export default function StatCard({ icon, label, value, sub, alert = false }) {
  return (
    <div className={`card flex items-center gap-3 p-4 ${alert ? 'ring-4 ring-red-400/60' : ''}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${alert ? 'bg-red-600 text-white' : 'bg-brand-sky'}`}>
        <Icon name={icon} size={24} />
      </span>
      <div className="min-w-0">
        <div className="text-sm leading-tight text-subtle">{label}</div>
        <div className="font-num text-2xl leading-tight">{value}</div>
        {sub && <div className="truncate text-xs text-subtle">{sub}</div>}
      </div>
    </div>
  )
}
