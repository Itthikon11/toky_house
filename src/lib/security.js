// เครื่องมือด้านความปลอดภัยฝั่งเบราว์เซอร์
// หมายเหตุ: การป้องกันจริงอยู่ที่ฐานข้อมูล (RLS + ฟังก์ชันใน supabase/schema.sql)
// โค้ดส่วนนี้เป็นด่านแรกเพื่อกันการกดซ้ำ/ข้อมูลผิดรูปแบบ

// ---------- SHA-256 (ทำงานได้แม้เปิดผ่าน http บน LAN ที่ไม่มี crypto.subtle) ----------
const rotr = (x, n) => (x >>> n) | (x << (32 - n))

function firstPrimes(n) {
  const out = []
  for (let c = 2; out.length < n; c++) {
    if (out.every((p) => c % p !== 0)) out.push(c)
  }
  return out
}
const frac32 = (x) => ((x - Math.floor(x)) * 2 ** 32) >>> 0
const PRIMES = firstPrimes(64)
const K = PRIMES.map((p) => frac32(Math.cbrt(p)))
const H0 = PRIMES.slice(0, 8).map((p) => frac32(Math.sqrt(p)))

export function sha256Hex(message) {
  const bytes = new TextEncoder().encode(message)
  const len = bytes.length
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6)
  padded.set(bytes)
  padded[len] = 0x80
  const view = new DataView(padded.buffer)
  const bitLen = len * 8
  view.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32))
  view.setUint32(padded.length - 4, bitLen >>> 0)

  const H = H0.slice()
  const W = new Uint32Array(64)
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) W[t] = view.getUint32(i + t * 4)
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, h] = H
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[t] + W[t]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    const r = [a, b, c, d, e, f, g, h]
    for (let k = 0; k < 8; k++) H[k] = (H[k] + r[k]) >>> 0
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('')
}

// ต้องตรงกับ scripts/hash-password.mjs
export const hashAdminPassword = (password) =>
  sha256Hex(`tokyo-house:${password}`)

// เปรียบเทียบสตริงแบบใช้เวลาคงที่ (กันการเดารหัสจากเวลาตอบสนอง)
export function safeEqual(a = '', b = '') {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ---------- สุ่มค่าแบบปลอดภัย ----------
export function randomToken(bytes = 12) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomId() {
  const h = randomToken(16)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

// token ใน QR ต้องเป็นตัวอักษร hex เท่านั้น — กันการยัดค่าแปลก ๆ ลงใน URL
export const isValidTableToken = (t) =>
  typeof t === 'string' && /^[a-f0-9]{16,64}$/.test(t)

// ---------- ทำความสะอาดข้อความ ----------
export function cleanText(value, maxLength = 200) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // ตัดอักขระควบคุม
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

// กัน CSV/Formula injection ตอน export เปิดใน Excel
export function csvCell(value) {
  let s = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
