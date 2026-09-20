import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMenu, saveMenu, deleteMenuItems } from '../../lib/data'

export default function MenuManage() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('ทั้งหมด')
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [removedIds, setRemovedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getMenu().then(setRows)
  }, [])

  const categories = useMemo(
    () => ['ทั้งหมด', ...new Set(rows.map((r) => r.category))],
    [rows],
  )

  const view = rows
    .filter((r) => (filter === 'ทั้งหมด' ? true : r.category === filter))
    .filter(
      (r) =>
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.code.toLowerCase().includes(q.toLowerCase()),
    )

  const patch = (id, key, val) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)))

  const addRow = () => {
    const nextNum = rows.length + 1
    const id = `A${nextNum}-${Date.now()}`
    setRows((prev) => [
      {
        id,
        code: `A${nextNum}`,
        name: 'เมนูใหม่',
        filling: 'หวาน',
        category: 'ขนมโตเกียว',
        price: 100,
        available: true,
        image: '/images/products/S__11141155_0.jpg',
      },
      ...prev,
    ])
  }

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const deleteSelected = () => {
    const ids = [...selected]
    setRemovedIds((prev) => [...prev, ...ids.filter((i) => !i.includes('-'))])
    setRows((prev) => prev.filter((r) => !selected.has(r.id)))
    setSelected(new Set())
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // ปรับ id ของแถวใหม่ให้เป็น code ก่อนบันทึก
      const toSave = rows.map((r) => ({
        id: r.id.includes('-') ? r.code : r.id,
        code: r.code,
        name: r.name,
        filling: r.filling,
        category: r.category,
        price: Number(r.price) || 0,
        available: r.available,
        image: r.image,
      }))
      if (removedIds.length) await deleteMenuItems(removedIds)
      await saveMenu(toSave)
      setRemovedIds([])
      setToast('บันทึกเรียบร้อย ✅')
    } catch (e) {
      setToast('ผิดพลาด: ' + e.message)
    } finally {
      setSaving(false)
      setTimeout(() => setToast(''), 2000)
    }
  }

  const exportCSV = () => {
    const header = ['รหัสสินค้า', 'ชื่อสินค้า', 'ใส้', 'ประเภท', 'ราคา', 'สถานะ']
    const lines = rows.map((r) =>
      [r.code, r.name, r.filling, r.category, r.price, r.available ? 'พร้อมขาย' : 'หมด'].join(','),
    )
    const csv = '﻿' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tokyo-house-menu.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const cols = editMode
    ? 'grid-cols-[40px_1fr_2.4fr_0.8fr_1.2fr_0.8fr_1.1fr]'
    : 'grid-cols-[1fr_2.4fr_0.8fr_1.2fr_0.8fr_1.1fr]'

  return (
    <div className="bg-sky-gradient min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl">เมนู</h1>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-full bg-white px-5 py-2.5 font-semibold shadow-soft outline-none"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา"
              className="w-52 rounded-full bg-white px-5 py-2.5 pr-10 shadow-soft outline-none focus:shadow-glow"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
              🔍
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={exportCSV} className="rounded-full bg-white px-5 py-2.5 font-semibold shadow-soft transition hover:shadow-card">
              EXPORT ⌃
            </button>
            <button
              onClick={() => {
                setEditMode((v) => !v)
                setSelected(new Set())
              }}
              className={`rounded-full px-5 py-2.5 font-semibold shadow-soft transition ${
                editMode ? 'bg-brand-ink text-white' : 'bg-white hover:shadow-card'
              }`}
            >
              เพิ่มลบเมนู
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-green-400 px-6 py-2.5 font-bold text-green-950 shadow-soft transition hover:bg-green-500 disabled:opacity-60"
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </div>

        {/* แถบเครื่องมือ edit */}
        <AnimatePresence>
          {editMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center gap-3 overflow-hidden"
            >
              <button onClick={addRow} className="btn-yellow py-2">
                + เพิ่มเมนูใหม่
              </button>
              <button
                onClick={deleteSelected}
                disabled={!selected.size}
                className="rounded-full bg-red-500 px-5 py-2 font-bold text-white shadow-soft transition hover:bg-red-600 disabled:opacity-40"
              >
                🗑 ลบที่เลือก ({selected.size})
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ตาราง */}
        <div className="card overflow-hidden">
          <div className="max-h-[62vh] overflow-y-auto nice-scroll p-4">
            <div className={`sticky top-0 z-10 mb-3 grid ${cols} items-center gap-2 rounded-2xl bg-white px-5 py-4 text-center font-bold shadow-soft`}>
              {editMode && <span></span>}
              <span>รหัสสินค้า</span>
              <span>ชื่อสินค้า</span>
              <span>ใส้</span>
              <span>ประเภท</span>
              <span>ราคา</span>
              <span>สถานะ</span>
            </div>

            <div className="space-y-3">
              {view.map((r, i) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`grid ${cols} items-center gap-2 rounded-2xl bg-white px-5 py-3 text-center shadow-soft transition hover:shadow-card`}
                >
                  {editMode && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="mx-auto h-5 w-5 accent-red-500"
                    />
                  )}
                  <Cell value={r.code} onChange={(v) => patch(r.id, 'code', v)} className="font-bold" />
                  <Cell value={r.name} onChange={(v) => patch(r.id, 'name', v)} className="text-left" />
                  <SelectCell
                    value={r.filling}
                    options={['หวาน', 'คาว']}
                    onChange={(v) => patch(r.id, 'filling', v)}
                  />
                  <Cell value={r.category} onChange={(v) => patch(r.id, 'category', v)} />
                  <Cell
                    value={r.price}
                    type="number"
                    onChange={(v) => patch(r.id, 'price', v)}
                    suffix="฿"
                    className="font-display"
                  />
                  {/* สถานะ: พร้อมขาย / หมด */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => patch(r.id, 'available', true)}
                      title="พร้อมขาย"
                      className={`grid h-8 w-8 place-items-center rounded-lg border-2 text-lg transition ${
                        r.available
                          ? 'border-green-400 bg-green-400 text-white'
                          : 'border-black/15 text-transparent hover:border-green-300'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => patch(r.id, 'available', false)}
                      title="หมด/ปิดขาย"
                      className={`grid h-8 w-8 place-items-center rounded-lg border-2 text-lg transition ${
                        !r.available
                          ? 'border-red-400 bg-red-400 text-white'
                          : 'border-black/15 text-transparent hover:border-red-300'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              ))}
              {!view.length && (
                <p className="py-10 text-center text-black/40">ไม่พบเมนู</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-brand-ink px-6 py-3 font-semibold text-white shadow-card"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Cell({ value, onChange, type = 'text', className = '', suffix }) {
  return (
    <div className="flex items-center justify-center">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg bg-transparent px-2 py-1 text-center outline-none transition focus:bg-brand-sky/60 ${className}`}
      />
      {suffix && <span className="-ml-4 text-black/50">{suffix}</span>}
    </div>
  )
}

function SelectCell({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mx-auto rounded-lg bg-transparent px-2 py-1 text-center outline-none focus:bg-brand-sky/60"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}
