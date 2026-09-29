import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { StatusBadge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { useAdminLive } from './AdminLiveProvider'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api, isDemoMode } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { ORDER_STATUS } from '../../config/constants'
import { timeOf } from '../../lib/format'

const [NEW, COOKING, SERVED] = ORDER_STATUS
const LATE_MINUTES = 15
const FALLBACK_POLL_MS = isDemoMode ? 8000 : 30000

const minutesSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
const waitLabel = (m) => (m < 1 ? 'เพิ่งสั่ง' : m < 60 ? `รอ ${m} นาที` : `รอ ${Math.floor(m / 60)} ชม. ${m % 60} น.`)

// คิวออเดอร์ (แทนจอครัวแยก — คนทำกับคนเสิร์ฟเป็นคนเดียวกัน)
// เรียงจากออเดอร์ที่รอนานสุด · กด "เสิร์ฟแล้ว" ครั้งเดียวจบ · กดผิดย้อนกลับได้จาก "เพิ่งเสิร์ฟ"
// ใช้ร่วมกันระหว่างคิวกับการ์ดสรุปบนแดชบอร์ด
export function useKitchenOrders() {
  const q = useLiveQuery(api.listKitchenOrders, { live: true, interval: FALLBACK_POLL_MS })
  const orders = q.data || []
  return { ...q, orders, pending: orders.filter((o) => o.status === NEW || o.status === COOKING) }
}

export default function OrderQueue({ kitchen }) {
  const { toast } = useToast()
  const { refresh: refreshLive } = useAdminLive()
  const { data, loading, refresh, orders, pending: queue } = kitchen
  const [busy, setBusy] = useState(() => new Set())
  const [, setTick] = useState(0)

  // อัปเดตเวลารอทุก 30 วินาที
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const served = orders
    .filter((o) => o.status === SERVED && minutesSince(o.created_at) < 120)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)

  // ทำงานกับรอบนั้น (กันกดซ้ำระหว่างรอเซิร์ฟเวอร์) แล้วรีเฟรชคิว + ข้อมูลสด
  const run = async (order, action, message) => {
    setBusy((s) => new Set(s).add(order.id))
    try {
      await action()
      await refresh()
      refreshLive()
      if (message) toast(message, { type: 'success', duration: 2000 })
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
    } finally {
      setBusy((s) => {
        const next = new Set(s)
        next.delete(order.id)
        return next
      })
    }
  }
  const setStatus = (order, status, message) => run(order, () => api.updateOrderStatus(order.id, status), message)

  return (
    <section aria-label="คิวออเดอร์">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="section-title flex items-center gap-2">
          <Icon name="cooking" size={24} /> ออเดอร์ที่ต้องทำ
        </h2>
        <span className={`badge ${queue.length ? 'badge-warning' : 'badge-neutral'}`}>{queue.length} รายการ</span>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      ) : !queue.length ? (
        <EmptyState icon="check" title="ไม่มีออเดอร์ค้าง" description="ออเดอร์ใหม่จะเด้งขึ้นที่นี่ทันที พร้อมเสียงเตือน" />
      ) : (
        // คิวยาว → เลื่อนในกรอบของตัวเอง (หน้าแดชบอร์ดไม่ยืดยาวจนหาส่วนอื่นไม่เจอ)
        <ol className="nice-scroll -mx-1 max-h-[75vh] space-y-3 overflow-y-auto overscroll-contain px-1 py-1">
          <AnimatePresence initial={false}>
            {queue.map((o, i) => {
              const mins = minutesSince(o.created_at)
              const late = mins >= LATE_MINUTES
              const isBusy = busy.has(o.id)
              return (
                <motion.li
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  className={`card overflow-hidden ${
                    o.cancel_request === 'pending' || late ? 'ring-4 ring-red-400/70' : i === 0 ? 'ring-2 ring-brand-yellowDark' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-black/5 px-4 pb-3 pt-4">
                    <div className="min-w-0">
                      <div className="font-num text-3xl leading-none">{o.table_label}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`badge ${o.round > 1 ? 'badge-brand' : 'badge-neutral'}`}>
                          {o.round > 1 ? `สั่งเพิ่ม · รอบ ${o.round}` : 'รอบแรก'}
                        </span>
                        {o.status === COOKING && <StatusBadge status={COOKING} />}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 text-base font-bold ${late ? 'text-red-600' : ''}`}>
                        <Icon name={late ? 'warning' : 'clock'} size={18} />
                        {waitLabel(mins)}
                      </div>
                      <div className="text-xs text-subtle">สั่งเมื่อ {timeOf(o.created_at)}</div>
                    </div>
                  </div>

                  <ul className="divide-y divide-dashed divide-black/10 px-4">
                    {o.items.map((it, idx) => (
                      <li key={idx} className="flex items-baseline gap-3 py-2 text-lg">
                        <span className="min-w-[2.5ch] font-num text-2xl text-brand-yellowDark">{it.qty}×</span>
                        <span className="font-semibold">{it.name}</span>
                      </li>
                    ))}
                  </ul>

                  {o.note && (
                    <div className="mx-4 mb-1 mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-700">
                      <Icon name="note" size={18} className="mt-0.5" /> {o.note}
                    </div>
                  )}

                  {o.cancel_request === 'pending' && (
                    <div className="mx-4 mt-3 rounded-2xl bg-red-50 p-3 ring-1 ring-red-200" role="alert">
                      <p className="flex items-center gap-2 font-bold text-red-700">
                        <Icon name="ban" size={18} /> ลูกค้าขอยกเลิกรอบนี้
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => run(o, () => api.rejectCancel(o.id), `ไม่อนุมัติการยกเลิก ${o.table_label} รอบ ${o.round}`)}
                        >
                          ไม่อนุมัติ
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={isBusy}
                          onClick={() => run(o, () => api.approveCancel(o.id), `ยกเลิก ${o.table_label} รอบ ${o.round} แล้ว`)}
                        >
                          อนุมัติยกเลิก
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 p-4 pt-3">
                    {o.status === NEW && (
                      <Button variant="secondary" icon="flame" disabled={isBusy} onClick={() => setStatus(o, COOKING)}>
                        เริ่มทำ
                      </Button>
                    )}
                    <Button
                      variant="success"
                      size="lg"
                      className="flex-1"
                      loading={isBusy}
                      onClick={() => setStatus(o, SERVED, `เสิร์ฟ ${o.table_label} รอบ ${o.round} แล้ว`)}
                    >
                      เสิร์ฟแล้ว
                    </Button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      )}

      {served.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold text-subtle">เพิ่งเสิร์ฟ (กดผิด? ย้อนกลับได้)</h3>
          <ul className="card-flat divide-y divide-black/5">
            {served.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-2">
                <Icon name="success" size={18} className="text-green-600" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  <b>{o.table_label}</b> · รอบ {o.round} · {o.items.map((it) => `${it.qty}× ${it.name}`).join(', ')}
                </span>
                <Button variant="ghost" size="sm" icon="undo" disabled={busy.has(o.id)} onClick={() => setStatus(o, NEW, `ย้ายกลับเข้าคิว: ${o.table_label}`)}>
                  ย้อนกลับ
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
