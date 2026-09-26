import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../services/api'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useCart } from '../../context/CartContext'
import { useTableSession } from '../../context/TableSessionContext'
import MenuCard, { MenuCardSkeleton } from '../../components/customer/MenuCard'
import ScanNotice from '../../components/customer/ScanNotice'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { baht } from '../../lib/format'

const ALL = 'ทั้งหมด'

export default function Menu() {
  const { data: menu, loading, error, refresh } = useLiveQuery(api.getMenu)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState(ALL)
  const { cartCount, cartTotal } = useCart()
  const { session } = useTableSession()

  const items = menu || []
  // ตัวกรอง: ไส้ (หวาน/คาว) + หมวดอื่น ๆ เช่น เครื่องดื่ม
  const filters = useMemo(() => {
    const fillings = [...new Set(items.filter((m) => m.category === 'ขนมโตเกียว').map((m) => m.filling).filter(Boolean))]
    const others = [...new Set(items.map((m) => m.category).filter((c) => c && c !== 'ขนมโตเกียว'))]
    return [ALL, ...fillings.map((f) => `ไส้${f}`), ...others]
  }, [items])

  const keyword = q.trim().toLowerCase()
  const list = items
    .filter((m) => {
      if (filter === ALL) return true
      if (filter.startsWith('ไส้')) return m.category === 'ขนมโตเกียว' && `ไส้${m.filling}` === filter
      return m.category === filter
    })
    .filter((m) => !keyword || m.name.toLowerCase().includes(keyword) || String(m.code).toLowerCase().includes(keyword))
    .sort((a, b) => Number(b.available) - Number(a.available)) // เมนูหมดไว้ท้ายสุด

  return (
    <div className="page">
      <div className="container-app">
        <PageHeader
          title="เมนู"
          subtitle={
            session ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="map" size={16} /> กำลังสั่งในนาม <b className="text-brand-ink">{session.label}</b>
              </span>
            ) : null
          }
        />

        {!session && (
          <div className="mb-4">
            <ScanNotice compact />
          </div>
        )}

        {/* ค้นหา + ตัวกรอง (ติดขอบบนเมื่อเลื่อน) */}
        <div className="sticky top-header z-20 -mx-4 mb-4 bg-[#eef9fd]/95 px-4 py-2 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="relative block md:w-72">
              <span className="sr-only">ค้นหาเมนู</span>
              <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value.slice(0, 50))}
                placeholder="ค้นหาเมนู หรือรหัส เช่น A3"
                className="input rounded-full pl-11"
              />
            </label>
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="หมวดเมนู">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`chip ${filter === f ? 'chip-active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <EmptyState
            tone="danger"
            icon="offline"
            title="โหลดเมนูไม่สำเร็จ"
            description="ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง"
            action={<Button icon="refresh" onClick={refresh}>ลองใหม่</Button>}
          />
        ) : loading && !items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        ) : !list.length ? (
          <EmptyState
            icon="search"
            title="ไม่พบเมนูที่ค้นหา"
            description="ลองพิมพ์คำอื่น หรือเลือกหมวด “ทั้งหมด”"
            action={
              <Button variant="secondary" onClick={() => { setQ(''); setFilter(ALL) }}>
                ล้างการค้นหา
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-24 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {list.map((m) => (
              <MenuCard key={m.id} item={m} />
            ))}
          </div>
        )}
      </div>

      {/* แถบสรุปตะกร้า (อยู่เหนือแถบเมนูล่างบนมือถือ) */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`fixed inset-x-0 z-30 px-4 ${session ? 'bottom-[calc(theme(spacing.nav)+env(safe-area-inset-bottom)+8px)] md:bottom-5' : 'bottom-5'}`}
          >
            <Link
              to="/checkout"
              className="mx-auto flex max-w-md items-center gap-3 rounded-full bg-brand-ink py-2 pl-2 pr-5 text-white shadow-card transition active:scale-[0.98]"
            >
              <span key={cartCount} className="grid h-10 min-w-[40px] animate-pop place-items-center rounded-full bg-brand-yellow px-2 font-bold text-brand-ink">
                {cartCount}
              </span>
              <span className="flex-1 font-semibold">ดูตะกร้า / ยืนยันสั่ง</span>
              <span className="font-display text-xl">{baht(cartTotal)}</span>
              <Icon name="chevronRight" size={20} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
