import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import BillsTable from '../../components/admin/BillsTable'
import DateRangeFilter, { daysAgo, isoRange } from '../../components/admin/DateRangeFilter'
import { RevenueBarChart } from '../../components/charts/Charts'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { PageLoader } from '../../components/ui/Spinner'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api } from '../../services/api'
import { PAYMENT_METHOD_ICON, PAYMENT_METHODS } from '../../config/constants'
import { baht, localDateKey } from '../../lib/format'
import { downloadSalesCsv } from '../../lib/exports'

export default function Sales() {
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(daysAgo(0))

  const range = useMemo(() => isoRange(from, to), [from, to])
  const bills = useLiveQuery(() => api.listClosedBills(range), { live: true, deps: [range.from, range.to] })

  const all = bills.data || []
  const paid = all.filter((b) => b.status === 'paid')
  const totalMoney = paid.reduce((s, b) => s + Number(b.total), 0)
  const byMethod = Object.keys(PAYMENT_METHODS).map((m) => ({
    method: m,
    total: paid.filter((b) => b.payment_method === m).reduce((s, b) => s + Number(b.total), 0),
  }))

  // ยอดขายรายวันตามช่วงที่เลือก
  const daily = useMemo(() => {
    const map = new Map()
    if (from && to) {
      for (let d = new Date(`${from}T00:00:00`); localDateKey(d) <= to && map.size < 62; d.setDate(d.getDate() + 1)) {
        map.set(localDateKey(d), 0)
      }
    }
    paid.forEach((b) => {
      const k = localDateKey(b.paid_at)
      map.set(k, (map.get(k) || 0) + Number(b.total))
    })
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ label: k.slice(5).split('-').reverse().join('/'), ยอดขาย: v }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills.data, from, to])

  const exportCSV = () => downloadSalesCsv(all, from, to)


  return (
    <div className="page">
      <div className="container-app">
        <PageHeader
          title="ยอดขาย"
          subtitle="นับเฉพาะบิลที่พนักงานกด “รับชำระ” แล้ว"
          actions={
            <Button variant="secondary" size="sm" icon="download" onClick={exportCSV} disabled={!all.length}>
              CSV
            </Button>
          }
        />

        <DateRangeFilter
          from={from}
          to={to}
          onChange={(r) => {
            setFrom(r.from)
            setTo(r.to)
          }}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <motion.section key={totalMoney} initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="card p-5" aria-label="สรุปยอด">
              <div className="text-sm font-semibold text-subtle">รับชำระทั้งหมด</div>
              <div className="font-num text-5xl">{baht(totalMoney)}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/5 pt-4 text-sm">
                <div>
                  <div className="text-subtle">จำนวนบิล</div>
                  <div className="text-lg font-bold">{paid.length}</div>
                </div>
                {byMethod.map((m) => (
                  <div key={m.method}>
                    <div className="flex items-center gap-1 text-subtle">
                      <Icon name={PAYMENT_METHOD_ICON[m.method]} size={14} />
                      {m.method === 'cash' ? 'เงินสด' : 'โอน'}
                    </div>
                    <div className="text-lg font-bold">{baht(m.total)}</div>
                  </div>
                ))}
              </div>
            </motion.section>

            <section className="card p-4" aria-label="กราฟยอดขายรายวัน">
              <h2 className="mb-2 font-bold">ยอดขายรายวัน</h2>
              <RevenueBarChart data={daily} />
            </section>
          </div>

          <div>
            <h2 className="section-title mb-3">ประวัติบิล</h2>
            {bills.loading && !bills.data ? <PageLoader /> : <BillsTable bills={all} onChanged={bills.refresh} />}
          </div>
        </div>
      </div>
    </div>
  )
}
