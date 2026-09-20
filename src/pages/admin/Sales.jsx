import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import OrdersTable from '../../components/OrdersTable'
import { SalesBarChart } from '../../components/Charts'
import { getOrders, updateOrderStatus, getMonthlySales } from '../../lib/data'

export default function Sales() {
  const [orders, setOrders] = useState([])
  const [sales, setSales] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    getOrders().then(setOrders)
    getMonthlySales().then(setSales)
  }, [])

  const handleStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    await updateOrderStatus(id, status)
  }

  // ยอดเงินทั้งหมดจากออเดอร์ที่ชำระแล้ว (กรองตามช่วงวันที่ได้)
  const totalMoney = useMemo(() => {
    const f = from ? new Date(from) : null
    const t = to ? new Date(to + 'T23:59:59') : null
    return orders
      .filter((o) => o.status === 'ชำระแล้ว')
      .filter((o) => {
        const d = new Date(o.created_at)
        if (f && d < f) return false
        if (t && d > t) return false
        return true
      })
      .reduce((s, o) => s + o.total, 0)
  }, [orders, from, to])

  // ยอดขายรวมสะสม (ตัวอย่าง) — บวกฐานเดโมให้เหมือนภาพ
  const grandTotal = 19000 + totalMoney

  return (
    <div className="bg-sky-gradient min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* ซ้าย: ออเดอร์ล่าสุด */}
          <div>
            <h2 className="mb-3 font-display text-3xl">ออเดอร์ล่าสุด</h2>
            <OrdersTable orders={orders} onStatusChange={handleStatus} />
          </div>

          {/* ขวา: ยอดขายทั้งหมด */}
          <div>
            <h2 className="mb-3 font-display text-3xl">ยอดขายทั้งหมด</h2>

            {/* ช่วงวันที่ */}
            <div className="card mb-4 flex flex-wrap items-center gap-2 p-4">
              <span className="font-semibold">วันที่</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-brand-yellow"
              />
              <span>ถึง</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-brand-yellow"
              />
              {(from || to) && (
                <button
                  onClick={() => {
                    setFrom('')
                    setTo('')
                  }}
                  className="ml-auto text-sm text-black/50 underline"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="card p-4">
              <SalesBarChart data={sales} height={280} />
            </div>

            <motion.div
              key={grandTotal}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="card mt-4 flex items-center justify-between p-6"
            >
              <span className="text-lg font-semibold">จำนวนเงินทั้งหมด</span>
              <span className="font-display text-4xl">
                {grandTotal.toLocaleString()}฿
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
