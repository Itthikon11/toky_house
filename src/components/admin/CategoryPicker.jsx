import { useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { cleanText } from '../../lib/security'

// เลือกหมวดแบบกดชิป + เพิ่มหมวดใหม่ได้ในที่เดียว (แทน dropdown ของเบราว์เซอร์)
// หมวดใหม่จะถูกบันทึกจริงเมื่อกด "บันทึก" ของฟอร์ม (ใช้ทั้งหมวดเมนูและหมวดรายจ่าย)
export default function CategoryPicker({ value, options, onChange, error, label = 'หมวดเมนู', placeholder = 'ชื่อหมวด เช่น ของทานเล่น' }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const all = [...new Set([...options, value].filter(Boolean))]
  const isNew = (c) => !options.includes(c)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const confirm = () => {
    const name = cleanText(draft, 40)
    if (!name) return
    // พิมพ์ซ้ำกับหมวดที่มีอยู่ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) → เลือกหมวดเดิมแทน
    const existing = all.find((c) => c.toLowerCase() === name.toLowerCase())
    onChange(existing || name)
    setDraft('')
    setAdding(false)
  }

  const cancel = () => {
    setDraft('')
    setAdding(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label} aria-invalid={!!error}>
        {all.map((c) => {
          const active = value === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c)}
              className={`chip ${active ? 'chip-active' : ''}`}
            >
              {active && <Icon name="check" size={16} strokeWidth={2.5} />}
              {c}
              {isNew(c) && <span className={`badge ${active ? 'bg-brand-yellow text-brand-ink' : 'badge-brand'}`}>ใหม่</span>}
            </button>
          )
        })}

        {adding ? (
          <div className="flex min-h-[2.5rem] items-center gap-1 rounded-full bg-white pl-4 pr-1 shadow-soft ring-2 ring-brand-yellowDark">
            <input
              ref={inputRef}
              value={draft}
              maxLength={40}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter = เพิ่มหมวด (ไม่ให้ฟอร์มเมนูถูกส่ง), Esc = ยกเลิก
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirm()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  cancel()
                }
              }}
              placeholder={placeholder}
              aria-label="ชื่อหมวดใหม่"
              className="w-44 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={confirm}
              disabled={!draft.trim()}
              aria-label="เพิ่มหมวด"
              className="grid h-8 w-8 place-items-center rounded-full bg-brand-yellow transition hover:bg-brand-yellowDark disabled:opacity-40"
            >
              <Icon name="check" size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={cancel}
              aria-label="ยกเลิก"
              className="grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border-2 border-dashed border-black/20 px-4 text-sm font-semibold text-gray-600 transition hover:border-brand-yellowDark hover:bg-brand-yellowSoft hover:text-brand-ink"
          >
            <Icon name="plus" size={16} strokeWidth={2.5} />
            เพิ่มหมวด
          </button>
        )}
      </div>
    </div>
  )
}
