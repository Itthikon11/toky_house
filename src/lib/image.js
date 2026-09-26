// ย่อรูปในเบราว์เซอร์ก่อนอัปโหลด
// - รูปจากมือถือ 3–10 MB → เหลือ ~100 KB โหลดเร็ว ประหยัดพื้นที่ Supabase Free Tier
// - วาดใหม่ผ่าน canvas = ลบข้อมูล EXIF (เช่น พิกัด GPS ที่ถ่าย) ออกไปด้วย
import { AppError } from '../services/errors'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ACCEPTED = /^image\/(jpeg|png|webp|gif|heic|heif)$/i

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* ลองวิธีสำรองด้านล่าง */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function compressImage(file, { maxSize = 800, quality = 0.82 } = {}) {
  if (!file || !ACCEPTED.test(file.type)) throw new AppError('BAD_IMAGE')
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError('IMAGE_TOO_LARGE')

  let source
  try {
    source = await decode(file)
  } catch {
    throw new AppError('BAD_IMAGE') // เช่น ไฟล์ HEIC บนเบราว์เซอร์ที่เปิดไม่ได้
  }

  // ตัดเป็นสี่เหลี่ยมจัตุรัสตรงกลาง (การ์ดเมนูแสดงแบบ 1:1)
  const w = source.width
  const h = source.height
  const side = Math.min(w, h)
  const out = Math.min(maxSize, side)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, (w - side) / 2, (h - side) / 2, side, side, 0, 0, out, out)
  source.close?.()

  // webp เล็กกว่า ถ้าเบราว์เซอร์ไม่รองรับจะได้ png กลับมา → ใช้ jpeg แทน
  let blob = await toBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
  if (!blob) throw new AppError('BAD_IMAGE')
  return blob
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new AppError('BAD_IMAGE'))
    reader.readAsDataURL(blob)
  })
}
