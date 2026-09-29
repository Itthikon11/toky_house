import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import CategoryPicker from './CategoryPicker'
import { cleanText } from '../../lib/security'
import { baht, localDateKey } from '../../lib/format'

// เพิ่ม/แก้รายจ่าย 1 รายการ — เลือกหมวดเดิมหรือพิมพ์หมวดใหม่ได้ในฟอร์มเดียว
export default function ExpenseForm({ expense, categories, onSave, onDelete, onClose }) {
  const isNew = !expense
  const categoryName = categories.find((c) => c.id === expense?.category_id)?.name || ''
  const [form, setForm] = useState({
    amount: expense ? String(expense.amount) : '',
    spent_on: expense?.spent_on || localDateKey(new Date()),
    category: categoryName,
    note: expense?.note || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = () => {
    const e = {}
    const amount = Number(form.amount)
    if (form.amount === '' || !Number.isFinite(amount) || amount <= 0 || amount > 10000000) e.amount = 'ใส่จำนวนเงินมากกว่า 0 บาท'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.spent_on)) e.spent_on = 'เลือกวันที่จ่าย'
    if (!cleanText(form.category, 40)) e.category = 'เลือกหมวด หรือกด “เพิ่มหมวด”'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await onSave({
      id: expense?.id,
      amount: Math.round(Number(form.amount) * 100) / 100,
      spent_on: form.spent_on,
      categoryName: cleanText(form.category, 40),
      note: cleanText(form.note, 200),
    })
    setSaving(false)
    if (ok) onClose()
  }

  const field = (key, label, input) => (
    <div>
      <label className="field-label" htmlFor={`expense-${key}`}>
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
      title={isNew ? 'เพิ่มรายจ่าย' : 'แก้ไขรายจ่าย'}
      maxWidth="max-w-lg"
      footer={
        confirmDelete ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="flex-1 text-sm font-semibold text-red-700">ลบรายจ่าย {baht(expense.amount)} นี้ถาวร?</span>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              ไม่ลบ
            </Button>
            <Button variant="danger" icon="trash" onClick={() => onDelete(expense)}>
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
            <Button type="submit" form="expense-form" loading={saving} icon="check">
              บันทึก
            </Button>
          </div>
        )
      }
    >
      <form id="expense-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {field(
            'amount',
            'จำนวนเงิน (บาท)',
            <input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`input ${errors.amount ? 'input-error' : ''}`}
              value={form.amount}
              onChange={(e) => set('amount')(e.target.value)}
              placeholder="เช่น 350"
            />,
          )}
          {field(
            'spent_on',
            'วันที่จ่าย',
            <input
              id="expense-spent_on"
              type="date"
              className={`input ${errors.spent_on ? 'input-error' : ''}`}
              value={form.spent_on}
              onChange={(e) => set('spent_on')(e.target.value)}
            />,
          )}
        </div>

        {field(
          'category',
          'หมวด',
          <CategoryPicker
            value={form.category}
            options={categories.map((c) => c.name)}
            onChange={set('category')}
            error={errors.category}
            label="หมวดรายจ่าย"
            placeholder="ชื่อหมวด เช่น ค่าซ่อม"
          />,
        )}

        {field(
          'note',
          'รายละเอียด (ไม่บังคับ)',
          <input
            id="expense-note"
            className="input"
            value={form.note}
            maxLength={200}
            onChange={(e) => set('note')(e.target.value)}
            placeholder="เช่น แป้ง 5 กก., บิลค่าไฟเดือน ก.ย."
          />,
        )}
      </form>
    </Modal>
  )
}
