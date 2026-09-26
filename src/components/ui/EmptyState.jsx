import Icon from './Icon'

// ใช้แสดงเมื่อไม่มีข้อมูล / เกิดข้อผิดพลาด — บอกเสมอว่า "ต้องทำอะไรต่อ"
export default function EmptyState({ icon = 'info', title, description, action, tone = 'default', className = '' }) {
  const iconBox = tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-sky text-brand-ink'
  return (
    <div className={`card flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <span className={`grid h-16 w-16 place-items-center rounded-full ${iconBox}`}>
        <Icon name={icon} size={30} />
      </span>
      {title && <h2 className="mt-4 text-lg font-bold">{title}</h2>}
      {description && <p className="mt-1 max-w-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
