import { ORDER_STATUS_CANCELLED } from '../config/constants'

export const baht = (n) => `${Number(n || 0).toLocaleString('th-TH')}฿`

export function timeAgo(iso) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (sec < 60) return 'เมื่อสักครู่'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ชม. ที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH')
}

export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

export const dateTimeOf = (iso) => new Date(iso).toLocaleString('th-TH')

// รวมรายการจากทุกรอบของบิลเป็นรายการเดียว (เมนูเดียวกันรวมจำนวน)
export function mergeBillItems(orders = []) {
  const map = new Map()
  for (const o of orders) {
    if (o.status === ORDER_STATUS_CANCELLED) continue
    for (const it of o.items || []) {
      const key = `${it.menu_id}|${it.price}`
      const prev = map.get(key)
      map.set(key, prev ? { ...prev, qty: prev.qty + it.qty } : { ...it })
    }
  }
  return [...map.values()]
}

export function summarizeItems(items = []) {
  if (!items.length) return '-'
  const first = `${items[0].qty}× ${items[0].name}`
  return items.length > 1 ? `${first} +${items.length - 1} รายการ` : first
}

// เรียงรหัสเมนูแบบธรรมชาติ A1, A2, … A10
export const byCode = (a, b) =>
  String(a.code).localeCompare(String(b.code), undefined, { numeric: true })

// yyyy-mm-dd ตามเวลาท้องถิ่น
export function localDateKey(d) {
  const x = new Date(d)
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${x.getFullYear()}-${m}-${day}`
}
