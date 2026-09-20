import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import OrdersTable from '../../components/OrdersTable'
import { SalesBarChart, ForecastLineChart } from '../../components/Charts'
import {
  getOrders,
  updateOrderStatus,
  getMonthlySales,
  getForecast,
  isSupabaseConfigured,
} from '../../lib/data'

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [sales, setSales] = useState([])
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    getOrders().then(setOrders)
    getMonthlySales().then(setSales)
    getForecast().then(setForecast)
  }, [])

  const handleStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    await updateOrderStatus(id, status)
  }

  const paidToday = orders
    .filter((o) => o.status === 'ชำระแล้ว')
    .reduce((s, o) => s + o.total, 0)

  return (
    <div className="bg-sky-gradient min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl bg-brand-yellow/70 px-4 py-2 text-sm font-semibold">
            🧪 โหมดตัวอย่าง (ยังไม่ได้เชื่อม Supabase) — ข้อมูลถูกเก็บชั่วคราวในเบราว์เซอร์
          </div>
        )}

        {/* การ์ดสรุปด้านบน */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { t: 'ออเดอร์ทั้งหมด', v: orders.length, s: 'รายการ', icon: '🧾' },
            {
              t: 'ยังไม่ชำระ',
              v: orders.filter((o) => o.status === 'ยังไม่ชำระ').length,
              s: 'ออเดอร์',
              icon: '⏳',
            },
            {
              t: 'ชำระแล้ว',
              v: orders.filter((o) => o.status === 'ชำระแล้ว').length,
              s: 'ออเดอร์',
              icon: '✅',
            },
            { t: 'ยอดรับวันนี้', v: `${paidToday}฿`, s: 'บาท', icon: '💰' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card flex items-center gap-3 p-4"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-sky text-2xl">
                {c.icon}
              </span>
              <div>
                <div className="text-sm text-black/50">{c.t}</div>
                <div className="font-display text-2xl">{c.v}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* ซ้าย: ออเดอร์ล่าสุด */}
          <div>
            <h2 className="mb-3 font-display text-3xl">ออเดอร์ล่าสุด</h2>
            <OrdersTable orders={orders} onStatusChange={handleStatus} />
          </div>

          {/* ขวา: กราฟ */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 font-display text-3xl">ยอดขาย</h2>
              <div className="card p-4">
                <SalesBarChart data={sales} />
              </div>
            </div>
            <div>
              <h2 className="mb-3 font-display text-3xl">สถิติคาดการณ์</h2>
              <div className="card p-4">
                <ForecastLineChart data={forecast} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
