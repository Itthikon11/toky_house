import { useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Switch from '../../components/ui/Switch'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import MenuItemForm from '../../components/admin/MenuItemForm'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { csvCell } from '../../lib/security'
import { baht } from '../../lib/format'

const ALL = 'ทั้งหมด'
const SOLD_OUT = 'หมดอยู่'

export default function MenuManage() {
  const { data, loading, error, refresh } = useLiveQuery(api.getMenu)
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(ALL)
  const [editing, setEditing] = useState(null) // null | {} (ใหม่) | item
  const [busyId, setBusyId] = useState(null)
  const [optimistic, setOptimistic] = useState({}) // id -> available (แสดงผลทันทีระหว่างบันทึก)

  const rows = (data || []).map((m) => (m.id in optimistic ? { ...m, available: optimistic[m.id] } : m))
  const categories = useMemo(() => [...new Set((data || []).map((r) => r.category).filter(Boolean))], [data])
  const soldOutCount = rows.filter((r) => !r.available).length

  const keyword = q.trim().toLowerCase()
  const view = rows
    .filter((r) => (filter === ALL ? true : filter === SOLD_OUT ? !r.available : r.category === filter))
    .filter((r) => !keyword || r.name.toLowerCase().includes(keyword) || String(r.code).toLowerCase().includes(keyword))

  // เปิด/ปิดการขาย: เปลี่ยนบนจอทันที แล้วบันทึกเบื้องหลัง (ผิดพลาดจะย้อนกลับ)
  const toggleAvailable = async (item, available) => {
    setOptimistic((o) => ({ ...o, [item.id]: available }))
    setBusyId(item.id)
    try {
      await api.setMenuAvailability(item.id, available)
      await refresh()
      toast(`${item.name} — ${available ? 'เปิดขายแล้ว' : 'ปิดเป็น “หมด” แล้ว'}`, { type: 'success', duration: 2000 })
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
    } finally {
      setOptimistic((o) => {
        const next = { ...o }
        delete next[item.id]
        return next
      })
      setBusyId(null)
    }
  }

  const save = async (item) => {
    try {
      await api.saveMenu([item])
      await refresh()
      toast(`บันทึก “${item.name}” แล้ว`, { type: 'success' })
      return true
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
      return false
    }
  }

  const remove = async (item) => {
    try {
      await api.deleteMenuItems([item.id])
      await refresh()
      setEditing(null)
      toast(`ลบ “${item.name}” แล้ว`, { type: 'success' })
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
    }
  }

  const exportCSV = () => {
    const header = ['รหัสสินค้า', 'ชื่อสินค้า', 'ไส้', 'หมวด', 'ราคา', 'สถานะ']
    const lines = rows.map((r) =>
      [r.code, r.name, r.filling, r.category, r.price, r.available ? 'พร้อมขาย' : 'หมด'].map(csvCell).join(','),
    )
    const csv = '﻿' + [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'tokyo-house-menu.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="container-app max-w-5xl">
        <PageHeader
          title="จัดการเมนู"
          subtitle={data ? `${rows.length} เมนู · หมดอยู่ ${soldOutCount} เมนู` : null}
          actions={
            <>
              <Button variant="secondary" size="sm" icon="download" onClick={exportCSV} disabled={!rows.length}>
                CSV
              </Button>
              <Button size="sm" icon="plus" onClick={() => setEditing({})}>
                เพิ่มเมนู
              </Button>
            </>
          }
        />

        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
          <label className="relative block md:w-72">
            <span className="sr-only">ค้นหาเมนู</span>
            <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อหรือรหัส" className="input rounded-full pl-11" />
          </label>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {[ALL, ...categories, SOLD_OUT].map((c) => (
              <button key={c} type="button" onClick={() => setFilter(c)} className={`chip ${filter === c ? 'chip-active' : ''}`}>
                {c === SOLD_OUT && <Icon name="ban" size={16} />}
                {c}
                {c === SOLD_OUT && soldOutCount > 0 && <span className="badge badge-danger ml-0.5">{soldOutCount}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="callout callout-info mb-4">
          <Icon name="info" size={18} className="mt-0.5" />
          <span>กดสวิตช์เพื่อเปิด/ปิดการขายได้ทันที (ลูกค้าจะเห็นว่า “หมดแล้ว”) · กดที่เมนูเพื่อแก้ชื่อ ราคา หรือรูป</span>
        </div>

        {error ? (
          <EmptyState tone="danger" icon="warning" title="โหลดเมนูไม่สำเร็จ" description={toThaiMessage(error)} action={<Button icon="refresh" onClick={refresh}>ลองใหม่</Button>} />
        ) : loading && !data ? (
          <PageLoader />
        ) : !view.length ? (
          <EmptyState icon="search" title="ไม่พบเมนู" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
        ) : (
          <ul className="space-y-2">
            {view.map((r) => (
              <li key={r.id} className={`card-flat flex items-center gap-3 p-2 pr-3 sm:p-3 ${r.available ? '' : 'bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-black/[0.03]"
                  aria-label={`แก้ไข ${r.name}`}
                >
                  <img src={r.image} alt="" loading="lazy" className={`h-14 w-14 shrink-0 rounded-xl object-cover ${r.available ? '' : 'grayscale'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-bold leading-snug">
                      <span className="badge badge-neutral mr-1.5 align-middle">{r.code}</span>
                      {r.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-subtle">
                      <span className="font-num text-base text-brand-ink">{baht(r.price)}</span>
                      {!r.available && <span className="badge badge-danger">หมด</span>}
                      <span>{r.category}</span>
                      {r.filling && <span>ไส้{r.filling}</span>}
                    </span>
                  </span>
                  <Icon name="edit" size={18} className="hidden text-gray-400 sm:block" />
                </button>
                <Switch
                  checked={r.available}
                  disabled={busyId === r.id}
                  onChange={(v) => toggleAvailable(r, v)}
                  label={`${r.name} พร้อมขาย`}
                  onLabel="พร้อมขาย"
                  offLabel="หมด"
                  hideLabelOnMobile
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <MenuItemForm
          key={editing.id || 'new'}
          item={editing.id ? editing : null}
          existing={rows}
          categories={categories}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
