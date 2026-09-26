import Icon from './Icon'
import { BILL_STATUS_META, ORDER_STATUS_META } from '../../config/constants'

// เขียนชื่อ class เต็ม ๆ (ห้ามต่อสตริง) เพื่อให้ Tailwind หาเจอตอน build
const TONES = {
  neutral: 'badge-neutral',
  info: 'badge-info',
  warning: 'badge-warning',
  success: 'badge-success',
  danger: 'badge-danger',
  brand: 'badge-brand',
}

export default function Badge({ tone = 'neutral', icon, children, className = '' }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.neutral} ${className}`}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.5} />}
      {children}
    </span>
  )
}

// ป้ายสถานะออเดอร์/บิล — สี ไอคอน และข้อความมาจาก config/constants.js ที่เดียว
export function StatusBadge({ kind = 'order', status, short = false, className }) {
  const meta = (kind === 'bill' ? BILL_STATUS_META : ORDER_STATUS_META)[status]
  if (!meta) return <Badge className={className}>{status}</Badge>
  return (
    <Badge tone={meta.tone} icon={meta.icon} className={className}>
      {short && meta.short ? meta.short : meta.label}
    </Badge>
  )
}
