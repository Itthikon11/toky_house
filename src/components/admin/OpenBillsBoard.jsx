import { useState } from 'react'
import { motion } from 'framer-motion'
import BillDetailModal from './BillDetailModal'
import { useAdminLive } from './AdminLiveProvider'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { ORDER_STATUS } from '../../config/constants'
import { baht, mergeBillItems, summarizeItems, timeAgo } from '../../lib/format'

// บิลที่ยังไม่ชำระ แยกตามโต๊ะ (1 การ์ด = 1 โต๊ะ = 1 บิล ไม่ว่าจะสั่งกี่รอบ)
// โต๊ะที่ขอชำระเงินขึ้นก่อน และมีกรอบสีเขียว
export default function OpenBillsBoard() {
  const { openBills, calls, refresh, loading } = useAdminLive()
  const [selectedId, setSelectedId] = useState(null)
  const selected = openBills.find((b) => b.id === selectedId) || null

  const wantsToPay = new Set(calls.filter((c) => c.reason === 'bill').map((c) => c.table_id))
  const sorted = [...openBills].sort((a, b) => Number(wantsToPay.has(b.table_id)) - Number(wantsToPay.has(a.table_id)))

  if (loading && !openBills.length) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    )
  }

  return (
    <>
      {!openBills.length && <EmptyState icon="receipt" title="ยังไม่มีบิลที่เปิดอยู่" description="เมื่อลูกค้าสแกน QR และสั่งอาหาร บิลจะขึ้นที่นี่ทันที" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((b) => {
          const waiting = b.orders.filter((o) => o.status === ORDER_STATUS[0] || o.status === ORDER_STATUS[1]).length
          const paying = wantsToPay.has(b.table_id)
          return (
            <motion.button
              key={b.id}
              type="button"
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedId(b.id)}
              className={`card flex flex-col p-4 text-left transition hover:-translate-y-0.5 hover:shadow-glow ${paying ? 'ring-4 ring-green-500' : ''}`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-2xl leading-tight">{b.table_label}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
                    <Icon name="clock" size={12} /> {b.orders.length} รอบ · อัปเดต {timeAgo(b.updated_at)}
                  </div>
                </div>
                <div className="font-display text-2xl">{baht(b.total)}</div>
              </div>
              <p className="mt-2 w-full truncate text-sm text-muted">{summarizeItems(mergeBillItems(b.orders))}</p>
              <div className="mt-3 flex w-full flex-wrap items-center gap-1.5">
                {paying && (
                  <span className="badge bg-green-600 text-white">
                    <Icon name="receipt" size={14} /> ขอชำระเงิน
                  </span>
                )}
                {waiting > 0 && (
                  <span className="badge badge-warning">
                    <Icon name="cooking" size={14} /> รอครัว {waiting} รอบ
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-ink">
                  {paying ? 'รับชำระ' : 'ดูบิล'} <Icon name="chevronRight" size={16} />
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <BillDetailModal key={selectedId} bill={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
    </>
  )
}
