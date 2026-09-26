// สร้างค่า VITE_ADMIN_PASSWORD_HASH สำหรับโหมดทดลอง (ไม่ได้เชื่อม Supabase)
// วิธีใช้:  node scripts/hash-password.mjs "รหัสผ่านใหม่"
import { createHash } from 'node:crypto'

const password = process.argv[2]
if (!password || password.length < 8) {
  console.error('ใส่รหัสผ่านอย่างน้อย 8 ตัวอักษร เช่น: node scripts/hash-password.mjs "MyStr0ngPass"')
  process.exit(1)
}

const hash = createHash('sha256').update(`tokyo-house:${password}`).digest('hex')
console.log(`VITE_ADMIN_PASSWORD_HASH=${hash}`)
