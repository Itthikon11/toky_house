import { useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Switch from '../ui/Switch'
import CategoryPicker from './CategoryPicker'
import Icon from '../ui/Icon'
import Spinner from '../ui/Spinner'
import { useToast } from '../ui/Toast'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { compressImage } from '../../lib/image'
import { cleanText } from '../../lib/security'
import { PRODUCT_IMAGES } from '../../config/constants'

const FILLINGS = ['หวาน', 'คาว', '']

// ฟอร์มเพิ่ม/แก้ไขเมนู 1 รายการ — ตรวจข้อมูลก่อนบันทึกและบอกจุดที่ผิดตรงช่องนั้น
export default function MenuItemForm({ item, existing, categories, onSave, onDelete, onClose }) {
  const isNew = !item?.id
  const [form, setForm] = useState(() => ({
    code: item?.code || '',
    name: item?.name || '',
    category: item?.category || 'ขนมโตเกียว',
    filling: item?.filling ?? 'หวาน',
    price: item?.price ?? '',
    image: item?.image || PRODUCT_IMAGES[0],
    available: item?.available ?? true,
  }))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState([]) // รูปที่อัปโหลดในรอบนี้
  const fileRef = useRef(null)
  const { toast } = useToast()

  // รูปทั้งหมดให้เลือก: รูปที่เพิ่งอัปโหลด + รูปเดิมของเมนูนี้ (ถ้าไม่ใช่รูปในเครื่อง) + รูปตัวอย่าง
  const gallery = [...new Set([...uploaded, item?.image, ...PRODUCT_IMAGES].filter(Boolean))]

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return
    setUploading(true)
    try {
      const blob = await compressImage(file)
      const url = await api.uploadMenuImage(blob)
      setUploaded((u) => [url, ...u])
      setForm((f) => ({ ...f, image: url }))
      toast(`อัปโหลดรูปแล้ว (${Math.round(blob.size / 1024)} KB) — กด “บันทึก” เพื่อใช้รูปนี้`, { type: 'success' })
    } catch (err) {
      toast(toThaiMessage(err), { type: 'error', duration: 5000 })
    } finally {
      setUploading(false)
    }
  }

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e = {}
    const code = cleanText(form.code, 10)
    if (!code) e.code = 'ใส่รหัสสินค้า เช่น A13'
    else if (existing.some((m) => m.code === code && m.id !== item?.id)) e.code = `รหัส ${code} มีอยู่แล้ว`
    if (!cleanText(form.name, 80)) e.name = 'ใส่ชื่อเมนู'
    const price = Number(form.price)
    if (form.price === '' || !Number.isFinite(price) || price < 0 || price > 100000) e.price = 'ราคา 0–100,000 บาท'
    if (!cleanText(form.category, 40)) e.category = 'เลือกหมวด หรือกด “เพิ่มหมวด”'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    const code = cleanText(form.code, 10)
    const ok = await onSave({
      id: item?.id || code,
      code,
      name: cleanText(form.name, 80),
      category: cleanText(form.category, 40),
      filling: form.filling,
      price: Number(form.price),
      image: form.image,
      available: form.available,
    })
    setSaving(false)
    if (ok) onClose()
  }

  const field = (key, label, input) => (
    <div>
      <label className="field-label" htmlFor={`menu-${key}`}>
        {label}
      </label>
      {input}
      {errors[key] && (
        <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
          <Icon name="warning" size={14} /> {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'เพิ่มเมนูใหม่' : `แก้ไข ${item.code}`}
      maxWidth="max-w-lg"
      footer={
        confirmDelete ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="flex-1 text-sm font-semibold text-red-700">ลบ “{item.name}” ถาวร?</span>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              ไม่ลบ
            </Button>
            <Button variant="danger" icon="trash" onClick={() => onDelete(item)}>
              ยืนยันลบ
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button variant="ghost" icon="trash" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                ลบ
              </Button>
            )}
            <span className="flex-1" />
            <Button variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" form="menu-item-form" loading={saving} disabled={uploading} icon="check">
              บันทึก
            </Button>
          </div>
        )
      }
    >
      <form id="menu-item-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          {field(
            'code',
            'รหัส',
            <input id="menu-code" className={`input ${errors.code ? 'input-error' : ''}`} value={form.code} maxLength={10} onChange={(e) => set('code')(e.target.value.toUpperCase())} placeholder="A13" />,
          )}
          {field(
            'name',
            'ชื่อเมนู',
            <input id="menu-name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} maxLength={80} onChange={(e) => set('name')(e.target.value)} placeholder="เช่น ไข่เค็ม + ลาวา" />,
          )}
        </div>

        <div className="sm:w-1/2 sm:pr-1.5">
          {field(
            'price',
            'ราคา (บาท)',
            <input id="menu-price" type="number" inputMode="numeric" min="0" className={`input ${errors.price ? 'input-error' : ''}`} value={form.price} onChange={(e) => set('price')(e.target.value)} placeholder="100" />,
          )}
        </div>

        {field('category', 'หมวด', <CategoryPicker value={form.category} options={categories} onChange={set('category')} error={errors.category} />)}

        <div>
          <span className="field-label">ไส้</span>
          <div className="flex gap-2" role="radiogroup" aria-label="ไส้">
            {FILLINGS.map((f) => (
              <button
                key={f || 'none'}
                type="button"
                role="radio"
                aria-checked={form.filling === f}
                onClick={() => set('filling')(f)}
                className={`chip ${form.filling === f ? 'chip-active' : ''}`}
              >
                {f || 'ไม่ระบุ'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">รูปเมนู</span>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/10">
              {form.image ? (
                <img src={form.image} alt="รูปที่เลือก" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-gray-400">
                  <Icon name="noImage" size={28} />
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <Spinner size={28} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <Button variant="dark" size="sm" icon="imageAdd" loading={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลดรูปใหม่'}
              </Button>
              <p className="mt-1.5 text-xs text-subtle">ถ่ายรูปหรือเลือกจากเครื่อง (JPG, PNG, WEBP ไม่เกิน 10 MB) ระบบย่อและตัดเป็นสี่เหลี่ยมให้อัตโนมัติ</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                tabIndex={-1}
                onChange={handleFile}
                aria-label="เลือกไฟล์รูปเมนู"
              />
            </div>
          </div>

          <p className="mb-1.5 mt-4 text-sm font-semibold text-gray-700">หรือเลือกจากรูปที่มี</p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="เลือกรูปเมนู">
            {gallery.map((src) => (
              <button
                key={src}
                type="button"
                role="radio"
                aria-checked={form.image === src}
                onClick={() => set('image')(src)}
                className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                  form.image === src ? 'ring-brand-yellowDark' : 'ring-transparent hover:ring-black/20'
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                {form.image === src && (
                  <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                    <Icon name="check" size={20} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-2">
          <span className="font-semibold">สถานะการขาย</span>
          <Switch checked={form.available} onChange={set('available')} label="พร้อมขาย" onLabel="พร้อมขาย" offLabel="หมด" />
        </div>
      </form>
    </Modal>
  )
}
