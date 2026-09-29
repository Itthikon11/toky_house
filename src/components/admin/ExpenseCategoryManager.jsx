import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { useToast } from '../ui/Toast'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { cleanText } from '../../lib/security'

// จัดการหมวดรายจ่าย: เพิ่ม / เปลี่ยนชื่อ / ลบ (ลบได้เฉพาะหมวดที่ยังไม่มีรายจ่าย)
export default function ExpenseCategoryManager({ categories, onChanged, onClose }) {
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')
  const [newName, setNewName] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn, message) => {
    setBusy(true)
    try {
      await fn()
      await onChanged()
      toast(message, { type: 'success', duration: 2000 })
      return true
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const add = async (ev) => {
    ev.preventDefault()
    const name = cleanText(newName, 40)
    if (!name) return
    if (await run(() => api.saveExpenseCategory({ name }), `เพิ่มหมวด “${name}” แล้ว`)) setNewName('')
  }

  const rename = async (c) => {
    const name = cleanText(draft, 40)
    if (!name || name === c.name) return setEditingId(null)
    if (await run(() => api.saveExpenseCategory({ id: c.id, name }), `เปลี่ยนชื่อเป็น “${name}” แล้ว`)) setEditingId(null)
  }

  const remove = async (c) => {
    await run(() => api.deleteExpenseCategory(c.id), `ลบหมวด “${c.name}” แล้ว`)
    setConfirmId(null)
  }

  return (
    <Modal open onClose={onClose} title="หมวดรายจ่าย" subtitle="เปลี่ยนชื่อหมวดแล้ว รายจ่ายเดิมจะย้ายไปอยู่ชื่อใหม่ด้วย">
      <ul className="divide-y divide-black/5">
        {categories.map((c) => (
          <li key={c.id} className="flex min-h-[3.25rem] items-center gap-2 py-1.5">
            {editingId === c.id ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  maxLength={40}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') rename(c)
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setEditingId(null)
                    }
                  }}
                  aria-label={`ชื่อใหม่ของหมวด ${c.name}`}
                  className="input flex-1"
                />
                <Button size="sm" icon="check" loading={busy} onClick={() => rename(c)} aria-label="บันทึกชื่อ" />
                <Button size="sm" variant="ghost" icon="close" onClick={() => setEditingId(null)} aria-label="ยกเลิก" />
              </>
            ) : confirmId === c.id ? (
              <>
                <span className="flex-1 text-sm font-semibold text-red-700">ลบหมวด “{c.name}”?</span>
                <Button size="sm" variant="secondary" onClick={() => setConfirmId(null)}>
                  ไม่ลบ
                </Button>
                <Button size="sm" variant="danger" icon="trash" loading={busy} onClick={() => remove(c)}>
                  ลบ
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-semibold">{c.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="edit"
                  onClick={() => {
                    setDraft(c.name)
                    setEditingId(c.id)
                    setConfirmId(null)
                  }}
                  aria-label={`เปลี่ยนชื่อหมวด ${c.name}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  className="text-red-600"
                  onClick={() => {
                    setConfirmId(c.id)
                    setEditingId(null)
                  }}
                  aria-label={`ลบหมวด ${c.name}`}
                />
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <label className="flex-1">
          <span className="sr-only">ชื่อหมวดใหม่</span>
          <input
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ชื่อหมวดใหม่ เช่น ค่าซ่อม"
            className="input"
          />
        </label>
        <Button type="submit" icon="plus" loading={busy} disabled={!newName.trim()}>
          เพิ่มหมวด
        </Button>
      </form>
      <p className="mt-2 flex items-start gap-1.5 text-xs text-subtle">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        หมวดที่มีรายจ่ายบันทึกไว้แล้วลบไม่ได้ (กันตัวเลขย้อนหลังหาย) — เปลี่ยนชื่อได้ตามปกติ
      </p>
    </Modal>
  )
}
