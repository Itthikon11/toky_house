// ข้อมูลตัวอย่างสำหรับโหมดทดลอง (ยังไม่ได้เชื่อม Supabase)
import { randomId, randomToken } from '../../lib/security'

const IMG = '/images/products'

export const MENU_SEED = [
  { id: 'A1', code: 'A1', name: 'สังขยาใบเตย + บัตเตอร์คุกกี้', filling: 'หวาน', category: 'ขนมโตเกียว', price: 100, available: true, image: `${IMG}/S__11141155_0.jpg` },
  { id: 'A2', code: 'A2', name: 'ช็อกโกแลต + วิปครีม', filling: 'หวาน', category: 'ขนมโตเกียว', price: 100, available: true, image: `${IMG}/S__11141156_0.jpg` },
  { id: 'A3', code: 'A3', name: 'ไส้กรอก + ชีสยืด', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: true, image: `${IMG}/S__11141157_0.jpg` },
  { id: 'A4', code: 'A4', name: 'แฮม + ไข่ + พริกไทย', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: false, image: `${IMG}/S__11141136_0.jpg` },
  { id: 'A5', code: 'A5', name: 'หมูหยอง + น้ำสลัด', filling: 'คาว', category: 'ขนมโตเกียว', price: 110, available: true, image: `${IMG}/S__11141158_0.jpg` },
  { id: 'A6', code: 'A6', name: 'ครีมสด + สตรอว์เบอร์รี', filling: 'หวาน', category: 'ขนมโตเกียว', price: 110, available: true, image: `${IMG}/S__11141160_0.jpg` },
  { id: 'A7', code: 'A7', name: 'ไข่เค็ม + ลาวา', filling: 'หวาน', category: 'ขนมโตเกียว', price: 130, available: false, image: `${IMG}/S__11141161_0.jpg` },
  { id: 'A8', code: 'A8', name: 'นูเทลล่า + กล้วย', filling: 'หวาน', category: 'ขนมโตเกียว', price: 120, available: true, image: `${IMG}/S__11141162_0.jpg` },
  { id: 'A9', code: 'A9', name: 'ทูน่า + มายองเนส', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: true, image: `${IMG}/S__11141165_0.jpg` },
  { id: 'A10', code: 'A10', name: 'มัทฉะ + ถั่วแดง', filling: 'หวาน', category: 'ขนมโตเกียว', price: 130, available: true, image: `${IMG}/S__11141149_0.jpg` },
  { id: 'A11', code: 'A11', name: 'เบคอน + ชีส + ไข่', filling: 'คาว', category: 'ขนมโตเกียว', price: 130, available: true, image: `${IMG}/S__11141150_0.jpg` },
  { id: 'A12', code: 'A12', name: 'ชาไทย + ไข่มุก', filling: 'หวาน', category: 'เครื่องดื่ม', price: 60, available: true, image: `${IMG}/S__11141154_0.jpg` },
]

export function makeTables(count = 12) {
  const tables = Array.from({ length: count }, (_, i) => {
    const n = i + 1
    return {
      id: String(n),
      label: `โต๊ะที่ ${String(n).padStart(2, '0')}`,
      is_takeaway: false,
      token: randomToken(12),
      active: true,
      sort: n,
    }
  })
  tables.push({
    id: 'takeaway',
    label: 'สั่งกลับบ้าน',
    is_takeaway: true,
    token: randomToken(12),
    active: true,
    sort: 999,
  })
  return tables
}

// บิลย้อนหลัง 14 วัน (ชำระแล้ว) ไว้ให้กราฟยอดขายมีข้อมูล
export function makeHistory(tables) {
  const bills = []
  const orders = []
  const available = MENU_SEED.filter((m) => m.available)
  const dineIn = tables.filter((t) => !t.is_takeaway)
  let seq = 0
  for (let day = 14; day >= 1; day--) {
    const perDay = 3 + (day % 4)
    for (let k = 0; k < perDay; k++) {
      seq++
      const t = dineIn[seq % dineIn.length]
      const at = new Date()
      at.setDate(at.getDate() - day)
      at.setHours(10 + ((seq * 3) % 10), (seq * 17) % 60, 0, 0)
      const a = available[seq % available.length]
      const b = available[(seq + 4) % available.length]
      const items = [
        { menu_id: a.id, name: a.name, price: a.price, qty: 1 + (seq % 2) },
        { menu_id: b.id, name: b.name, price: b.price, qty: 1 },
      ]
      const total = items.reduce((s, it) => s + it.price * it.qty, 0)
      const billId = randomId()
      bills.push({
        id: billId,
        table_id: t.id,
        table_label: t.label,
        is_takeaway: false,
        status: 'paid',
        total,
        payment_method: seq % 3 ? 'cash' : 'transfer',
        created_at: at.toISOString(),
        updated_at: at.toISOString(),
        paid_at: new Date(at.getTime() + 40 * 60000).toISOString(),
      })
      orders.push({
        id: randomId(),
        bill_id: billId,
        round: 1,
        items,
        total,
        note: '',
        status: 'เสิร์ฟแล้ว',
        created_at: at.toISOString(),
      })
    }
  }
  return { bills, orders }
}

// ต้นทุนรายเดือน (ตัวอย่าง) — เครื่องทำความร้อน/น้ำ/ไฟฟ้า (หน่วย: ร้อยบาท)
export const MONTHLY_COSTS = [
  { month: 'ม.ค.', เครื่องทำความร้อน: 24, น้ำ: 16, ไฟฟ้า: 5 },
  { month: 'ก.พ.', เครื่องทำความร้อน: 16, น้ำ: 14, ไฟฟ้า: 9 },
  { month: 'มี.ค.', เครื่องทำความร้อน: 12, น้ำ: 11, ไฟฟ้า: 7 },
  { month: 'เม.ย.', เครื่องทำความร้อน: 8, น้ำ: 6, ไฟฟ้า: 5 },
  { month: 'พ.ค.', เครื่องทำความร้อน: 18, น้ำ: 12, ไฟฟ้า: 8 },
  { month: 'มิ.ย.', เครื่องทำความร้อน: 22, น้ำ: 15, ไฟฟ้า: 10 },
]

// สถิติคาดการณ์ (ตัวอย่าง)
export const FORECAST = [
  { year: '2021', ยอดขาย: 12, เดลิเวอรี: 9, หน้าร้าน: 8 },
  { year: '2022', ยอดขาย: 14, เดลิเวอรี: 12, หน้าร้าน: 11 },
  { year: '2023', ยอดขาย: 15, เดลิเวอรี: 15, หน้าร้าน: 14 },
  { year: '2024', ยอดขาย: 19, เดลิเวอรี: 18, หน้าร้าน: 15 },
  { year: '2025', ยอดขาย: 24, เดลิเวอรี: 20, หน้าร้าน: 16 },
]
