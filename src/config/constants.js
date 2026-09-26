// ค่าคงที่ที่ใช้ร่วมกันทั้งระบบ — แก้ที่นี่ที่เดียว

// สถานะบิล (1 โต๊ะ มีบิลที่เปิดอยู่ได้ 1 ใบ จนกว่าพนักงานจะรับชำระ)
export const BILL_STATUS = {
  OPEN: 'open',
  PAID: 'paid',
  CANCELLED: 'cancelled',
}
export const BILL_STATUS_LABEL = {
  open: 'ยังไม่ชำระ',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}
// หน้าตาของสถานะ (tone = สีของ .badge-*) — ทุกหน้าใช้ชุดนี้ชุดเดียว
export const BILL_STATUS_META = {
  open: { label: 'ยังไม่ชำระ', tone: 'danger', icon: 'receipt' },
  paid: { label: 'ชำระแล้ว', tone: 'success', icon: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'neutral', icon: 'ban' },
}

// สถานะของแต่ละรอบที่สั่ง (ฝั่งครัว)
export const ORDER_STATUS = ['รับออเดอร์', 'กำลังทำ', 'เสิร์ฟแล้ว', 'ยกเลิก']
export const ORDER_STATUS_CANCELLED = 'ยกเลิก'
export const ORDER_STATUS_META = {
  รับออเดอร์: { label: 'รับออเดอร์แล้ว', short: 'รอทำ', tone: 'info', icon: 'orders' },
  กำลังทำ: { label: 'กำลังทำ', short: 'กำลังทำ', tone: 'warning', icon: 'cooking' },
  เสิร์ฟแล้ว: { label: 'เสิร์ฟแล้ว', short: 'เสิร์ฟแล้ว', tone: 'success', icon: 'check' },
  ยกเลิก: { label: 'ยกเลิก', short: 'ยกเลิก', tone: 'danger', icon: 'ban' },
}

// วิธีชำระเงิน — ชำระกับพนักงานเท่านั้น (ไม่มีการชำระออนไลน์)
export const PAYMENT_METHODS = {
  cash: 'เงินสด',
  transfer: 'โอน/สแกนจ่ายที่เคาน์เตอร์',
}
export const PAYMENT_METHOD_ICON = { cash: 'cash', transfer: 'transfer' }

// เหตุผลการเรียกพนักงาน
export const CALL_REASONS = {
  bill: { label: 'ขอชำระเงิน / เช็คบิล', hint: 'พนักงานจะนำบิลมาคิดเงินที่โต๊ะ', icon: 'receipt' },
  call: { label: 'เรียกพนักงาน', hint: 'สอบถาม / สั่งเพิ่มกับพนักงาน', icon: 'hand' },
  help: { label: 'ขอช้อน น้ำ ทิชชู่', hint: 'ของใช้บนโต๊ะ', icon: 'drink' },
}

// ขีดจำกัดเพื่อป้องกันการใช้งานผิดปกติ (ต้องตรงกับ supabase/schema.sql)
export const LIMITS = {
  MAX_LINES_PER_ORDER: 30,
  MAX_QTY_PER_LINE: 20,
  MAX_NOTE_LENGTH: 200,
  ORDER_RATE_WINDOW_SEC: 30, // ภายใน 30 วินาที
  ORDER_RATE_MAX: 3, //        สั่งได้ไม่เกิน 3 ครั้งต่อโต๊ะ
  CALL_COOLDOWN_SEC: 60, // เรียกพนักงานซ้ำได้ทุก 60 วินาที
  TABLE_SESSION_HOURS: 4, // สแกน QR แล้วใช้ได้ 4 ชม.
  ADMIN_SESSION_HOURS: 8,
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCK_MINUTES: 5,
}

// รูปเมนูที่มีในโฟลเดอร์ public/images/products (ใช้เลือกรูปตอนเพิ่ม/แก้เมนู)
export const PRODUCT_IMAGES = [
  'S__11141130_0.jpg', 'S__11141136_0.jpg', 'S__11141139_0.jpg', 'S__11141149_0.jpg',
  'S__11141150_0.jpg', 'S__11141154_0.jpg', 'S__11141155_0.jpg', 'S__11141156_0.jpg',
  'S__11141157_0.jpg', 'S__11141158_0.jpg', 'S__11141160_0.jpg', 'S__11141161_0.jpg',
  'S__11141162_0.jpg', 'S__11141165_0.jpg', '1789906358805.jpg', 'messageImage_1789906582811.jpg',
].map((f) => `/images/products/${f}`)

// คีย์ localStorage ทั้งหมดของแอป
export const STORAGE_KEYS = {
  TABLE_SESSION: 'th_table_session',
  CART: 'th_cart',
  ADMIN_SESSION: 'th_admin_session',
  LOGIN_GUARD: 'th_login_guard',
  MOCK_DB: 'th_mock_db_v2',
}

// ช่วงเวลา refresh ข้อมูล (มิลลิวินาที)
export const POLL_MS = {
  ADMIN: 8000,
  CUSTOMER: 10000,
}
