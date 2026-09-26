// GitHub Pages ไม่รองรับ rewrite → คัดลอก index.html เป็น 404.html ให้ลิงก์ QR (/t/...) เปิดแอปได้
import { copyFileSync, existsSync } from 'node:fs'

if (existsSync('dist/index.html')) {
  copyFileSync('dist/index.html', 'dist/404.html')
  console.log('✓ dist/404.html (SPA fallback สำหรับ GitHub Pages)')
}
