import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusSelect from './StatusSelect'

function summarize(items = []) {
  if (!items.length) return '-'
  const first = `${items[0].qty}.${items[0].name}`
  const rest = items.length > 1 ? ` +${items.length - 1} รายการ` : ''
  return first.length > 34 ? first.slice(0, 34) + '…' + rest : first + rest
}

export default function OrdersTable({ orders, onStatusChange }) {
  const [detail, setDetail] = useState(null)

  return (
    <>
      <div className="card overflow-hidden">
        <div className="max-h-[560px] overflow-y-auto nice-scroll p-4">
          {/* header */}
          <div className="sticky top-0 z-10 mb-3 grid grid-cols-[1.2fr_2.2fr_0.8fr_1.1fr_1fr] gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold shadow-soft md:text-base">
            <span>ลูกค้าโต๊ะที่</span>
            <span>เมนูที่เลือก</span>
            <span>รวมราคา</span>
            <span>สถานะ</span>
            <span className="text-center">จัดการ</span>
          </div>

          <div className="space-y-3">
            {orders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1.2fr_2.2fr_0.8fr_1.1fr_1fr] items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm shadow-soft transition hover:shadow-card"
              >
                <span className="font-semibold">
                  ลูกค้า{o.table_label}
                </span>
                <span className="truncate text-black/70" title={summarize(o.items)}>
                  {summarize(o.items)}
                </span>
                <span className="font-display text-lg">{o.total}฿</span>
                <StatusSelect
                  value={o.status}
                  onChange={(s) => onStatusChange(o.id, s)}
                />
                <button
                  onClick={() => setDetail(o)}
                  className="mx-auto rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold shadow-soft transition hover:bg-brand-yellowDark active:scale-95"
                >
                  ดูเพิ่มเติม
                </button>
              </motion.div>
            ))}
            {!orders.length && (
              <p className="py-10 text-center text-black/40">ยังไม่มีออเดอร์</p>
            )}
          </div>
        </div>
      </div>

      {/* modal รายละเอียด */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl">
                  ลูกค้า{detail.table_label}
                </h3>
                <button
                  onClick={() => setDetail(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-brand-sky"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-sm text-black/50">
                รหัสออเดอร์ {detail.id} ·{' '}
                {new Date(detail.created_at).toLocaleString('th-TH')}
              </p>
              <div className="mt-4 space-y-2">
                {detail.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-brand-sky/60 px-4 py-2"
                  >
                    <span>
                      {it.qty}× {it.name}
                    </span>
                    <span className="font-semibold">{it.price * it.qty}฿</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="font-bold">รวมทั้งหมด</span>
                <span className="font-display text-2xl">{detail.total}฿</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
