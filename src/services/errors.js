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
  NOT_AUTHORIZED: 'ไม่มีสิทธิ์ทำรายการนี้ กรุณาเข้าสู่ระบบอีกครั้ง',
  LOCKED: 'ใส่รหัสผิดหลายครั้ง กรุณารอสักครู่',
  BAD_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  NOT_STAFF: 'บัญชีนี้ไม่ได้รับสิทธิ์พนักงาน',
  NETWORK: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  BAD_IMAGE: 'เปิดไฟล์รูปนี้ไม่ได้ กรุณาใช้ไฟล์ JPG, PNG หรือ WEBP',
  IMAGE_TOO_LARGE: 'รูปใหญ่เกิน 10 MB กรุณาเลือกรูปอื่น',
  STORAGE_FULL: 'พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม (โหมดทดลอง) — ลบรูปที่ไม่ใช้ หรือเชื่อม Supabase',
}

export function errorCode(err) {
  if (!err) return 'UNKNOWN'
  if (err.code && MESSAGES[err.code]) return err.code
  const msg = String(err.message || err)
  const hit = Object.keys(MESSAGES).find((k) => msg.includes(k))
  if (hit) return hit
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
