// แปลงรหัสข้อผิดพลาดจากฐานข้อมูล/ระบบ เป็นข้อความภาษาไทยที่ลูกค้าเข้าใจได้
// รหัสเหล่านี้ถูก raise จากฟังก์ชันใน supabase/schema.sql และจาก mock backend

export class AppError extends Error {
  constructor(code, detail) {
    super(detail ? `${code}:${detail}` : code)
    this.code = code
    this.detail = detail
  }
}

const MESSAGES = {
  INVALID_TABLE: 'QR โต๊ะไม่ถูกต้องหรือหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง หรือเรียกพนักงาน',
  NO_TABLE: 'กรุณาสแกน QR ที่โต๊ะก่อนสั่งอาหาร',
  EMPTY_ORDER: 'ยังไม่มีรายการในตะกร้า',
  TOO_MANY_ITEMS: 'รายการในออเดอร์มากเกินไป กรุณาแบ่งสั่งเป็นหลายรอบ',
  INVALID_QTY: 'จำนวนสินค้าไม่ถูกต้อง (1–20 ชิ้นต่อรายการ)',
  NOTE_TOO_LONG: 'หมายเหตุยาวเกินไป',
  ITEM_UNAVAILABLE: 'มีเมนูที่หมดแล้ว',
  RATE_LIMIT: 'สั่งถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
  INVALID_REASON: 'ประเภทการเรียกพนักงานไม่ถูกต้อง',
  BILL_NOT_OPEN: 'บิลนี้ปิดไปแล้ว',
  ORDER_NOT_FOUND: 'ไม่พบรายการนี้ อาจถูกแก้ไขไปแล้ว — ลองรีเฟรช',
  CANCEL_TOO_LATE: 'ร้านเริ่มทำรอบนี้แล้ว ยกเลิกไม่ได้ — เรียกพนักงานได้เลย',
  CANCEL_REJECTED: 'ร้านไม่อนุมัติการยกเลิกรอบนี้ — สอบถามพนักงานได้',
  NOT_AUTHORIZED: 'ไม่มีสิทธิ์ทำรายการนี้ กรุณาเข้าสู่ระบบอีกครั้ง',
  LOCKED: 'ใส่รหัสผิดหลายครั้ง กรุณารอสักครู่',
  BAD_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  NOT_STAFF: 'บัญชีนี้ไม่ได้รับสิทธิ์พนักงาน',
  NETWORK: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  BAD_IMAGE: 'เปิดไฟล์รูปนี้ไม่ได้ กรุณาใช้ไฟล์ JPG, PNG หรือ WEBP',
  IMAGE_TOO_LARGE: 'รูปใหญ่เกิน 10 MB กรุณาเลือกรูปอื่น',
  IN_USE: 'หมวดนี้ยังมีรายจ่ายอยู่ — ย้ายรายจ่ายไปหมวดอื่นหรือลบรายจ่ายก่อน จึงจะลบหมวดได้',
  DUPLICATE: 'มีชื่อนี้อยู่แล้ว',
  DB_OUTDATED: 'ฐานข้อมูลยังไม่ได้อัปเดตสำหรับฟีเจอร์นี้ — ให้ผู้ดูแลรันไฟล์ใน supabase/migrations ที่ SQL Editor ของ Supabase',
  STORAGE_FULL: 'พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม (โหมดทดลอง) — ลบรูปที่ไม่ใช้ หรือเชื่อม Supabase',
}

export function errorCode(err) {
  if (!err) return 'UNKNOWN'
  if (err.code && MESSAGES[err.code]) return err.code
  const msg = String(err.message || err)
  const hit = Object.keys(MESSAGES).find((k) => msg.includes(k))
  if (hit) return hit
  // ตาราง/คอลัมน์ที่ฟีเจอร์ใหม่ต้องใช้ยังไม่ถูกสร้าง (ยังไม่ได้รัน migration)
  if (/schema cache|column .* does not exist|relation .* does not exist/i.test(msg)) return 'DB_OUTDATED'
  if (/foreign key/i.test(msg)) return 'IN_USE'
  if (/duplicate key|unique constraint/i.test(msg)) return 'DUPLICATE'
  if (/fetch|network|Failed to fetch/i.test(msg)) return 'NETWORK'
  if (/permission|row-level security|JWT/i.test(msg)) return 'NOT_AUTHORIZED'
  return 'UNKNOWN'
}

export function toThaiMessage(err) {
  const code = errorCode(err)
  if (code === 'ITEM_UNAVAILABLE') {
    const detail = err?.detail || String(err?.message || '').split('ITEM_UNAVAILABLE:')[1]
    return detail ? `เมนู “${detail.trim()}” หมดแล้ว กรุณานำออกจากตะกร้า` : MESSAGES.ITEM_UNAVAILABLE
  }
  return MESSAGES[code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่ หรือเรียกพนักงาน'
}
