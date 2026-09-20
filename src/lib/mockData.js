// ข้อมูลตัวอย่าง (ใช้เมื่อยังไม่ได้เชื่อม Supabase) — เก็บใน localStorage เพื่อให้แก้ไขแล้วอยู่คงที่
const PRODUCT_IMG = '/images/products'

export const MENU_SEED = [
  { id: 'A1', code: 'A1', name: 'สังขยาใบเตย + บัตเตอร์คุกกี้', filling: 'หวาน', category: 'ขนมโตเกียว', price: 100, available: true, image: `${PRODUCT_IMG}/S__11141155_0.jpg` },
  { id: 'A2', code: 'A2', name: 'ช็อกโกแลต + วิปครีม', filling: 'หวาน', category: 'ขนมโตเกียว', price: 100, available: true, image: `${PRODUCT_IMG}/S__11141156_0.jpg` },
  { id: 'A3', code: 'A3', name: 'ไส้กรอก + ชีสยืด', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: true, image: `${PRODUCT_IMG}/S__11141157_0.jpg` },
  { id: 'A4', code: 'A4', name: 'แฮม + ไข่ + พริกไทย', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: false, image: `${PRODUCT_IMG}/S__11141136_0.jpg` },
  { id: 'A5', code: 'A5', name: 'หมูหยอง + น้ำสลัด', filling: 'คาว', category: 'ขนมโตเกียว', price: 110, available: true, image: `${PRODUCT_IMG}/S__11141158_0.jpg` },
  { id: 'A6', code: 'A6', name: 'ครีมสด + สตรอว์เบอร์รี', filling: 'หวาน', category: 'ขนมโตเกียว', price: 110, available: true, image: `${PRODUCT_IMG}/S__11141160_0.jpg` },
  { id: 'A7', code: 'A7', name: 'ไข่เค็ม + ลาวา', filling: 'หวาน', category: 'ขนมโตเกียว', price: 130, available: false, image: `${PRODUCT_IMG}/S__11141161_0.jpg` },
  { id: 'A8', code: 'A8', name: 'นูเทลล่า + กล้วย', filling: 'หวาน', category: 'ขนมโตเกียว', price: 120, available: true, image: `${PRODUCT_IMG}/S__11141162_0.jpg` },
  { id: 'A9', code: 'A9', name: 'ทูน่า + มายองเนส', filling: 'คาว', category: 'ขนมโตเกียว', price: 120, available: true, image: `${PRODUCT_IMG}/S__11141165_0.jpg` },
  { id: 'A10', code: 'A10', name: 'มัทฉะ + ถั่วแดง', filling: 'หวาน', category: 'ขนมโตเกียว', price: 130, available: true, image: `${PRODUCT_IMG}/S__11141149_0.jpg` },
  { id: 'A11', code: 'A11', name: 'เบคอน + ชีส + ไข่', filling: 'คาว', category: 'ขนมโตเกียว', price: 130, available: true, image: `${PRODUCT_IMG}/S__11141150_0.jpg` },
  { id: 'A12', code: 'A12', name: 'ชาไทย + ไข่มุก', filling: 'หวาน', category: 'เครื่องดื่ม', price: 60, available: true, image: `${PRODUCT_IMG}/S__11141154_0.jpg` },
]

const STATUSES = ['รับออเดอร์', 'ยังไม่ชำระ', 'ชำระแล้ว']

function pick(arr, i) {
  return arr[i % arr.length]
}

// สร้างออเดอร์ตัวอย่าง
export function makeSeedOrders() {
  const orders = []
  const now = Date.now()
  for (let i = 0; i < 9; i++) {
    const table = i === 8 ? 'สั่งกลับบ้าน' : `โต๊ะที่ ${String(i + 1).padStart(2, '0')}`
    const m1 = pick(MENU_SEED, i)
    const m2 = pick(MENU_SEED, i + 3)
    const items = [
      { menu_id: m1.id, name: m1.name, price: m1.price, qty: 1 },
      { menu_id: m2.id, name: m2.name, price: m2.price, qty: 1 },
    ]
    const total = items.reduce((s, it) => s + it.price * it.qty, 0)
    orders.push({
      id: `SEED-${1000 + i}`,
      table_label: table,
      is_takeaway: i === 8,
      items,
      total,
      status: pick(STATUSES, i),
      created_at: new Date(now - i * 3600 * 1000).toISOString(),
    })
  }
  return orders
}

// ยอดขาย/ต้นทุนรายเดือน (stacked bar) — เครื่องทำความร้อน/น้ำ/ไฟฟ้า
export const MONTHLY_SALES = [
  { month: 'ม.ค.', เครื่องทำความร้อน: 24, น้ำ: 16, ไฟฟ้า: 5, ยอดขาย: 52000 },
  { month: 'ก.พ.', เครื่องทำความร้อน: 16, น้ำ: 14, ไฟฟ้า: 9, ยอดขาย: 43000 },
  { month: 'มี.ค.', เครื่องทำความร้อน: 12, น้ำ: 11, ไฟฟ้า: 7, ยอดขาย: 38000 },
  { month: 'เม.ย.', เครื่องทำความร้อน: 8, น้ำ: 6, ไฟฟ้า: 5, ยอดขาย: 26000 },
  { month: 'พ.ค.', เครื่องทำความร้อน: 18, น้ำ: 12, ไฟฟ้า: 8, ยอดขาย: 46000 },
  { month: 'มิ.ย.', เครื่องทำความร้อน: 22, น้ำ: 15, ไฟฟ้า: 10, ยอดขาย: 55000 },
]

// สถิติคาดการณ์ (line chart)
export const FORECAST = [
  { year: '2021', ยอดขาย: 12, เดลิเวอรี: 9, หน้าร้าน: 8 },
  { year: '2022', ยอดขาย: 14, เดลิเวอรี: 12, หน้าร้าน: 11 },
  { year: '2023', ยอดขาย: 15, เดลิเวอรี: 15, หน้าร้าน: 14 },
  { year: '2024', ยอดขาย: 19, เดลิเวอรี: 18, หน้าร้าน: 15 },
  { year: '2025', ยอดขาย: 24, เดลิเวอรี: 20, หน้าร้าน: 16 },
]
