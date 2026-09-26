import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import BillsTable from '../../components/admin/BillsTable'
import { RevenueBarChart, SalesBarChart } from '../../components/charts/Charts'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { PageLoader } from '../../components/ui/Spinner'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api } from '../../services/api'
import { BILL_STATUS_LABEL, PAYMENT_METHOD_ICON, PAYMENT_METHODS } from '../../config/constants'
import { baht, dateTimeOf, localDateKey, mergeBillItems } from '../../lib/format'
import { csvCell } from '../../lib/security'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDateKey(d)
}

export default function Sales() {
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(daysAgo(0))

  const range = useMemo(
    () => ({
      from: from ? new Date(`${from}T00:00:00`).toISOString() : null,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : null,
    }),
    [from, to],
  )
  const bills = useLiveQuery(() => api.listClosedBills(range), { live: true, deps: [range.from, range.to] })
  const costs = useLiveQuery(api.getCosts)

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

  const exportCSV = () => {
    const header = ['วันเวลา', 'โต๊ะ', 'รายการ', 'จำนวนรอบ', 'ยอด', 'สถานะ', 'วิธีชำระ']
    const lines = all.map((b) =>
      [
        dateTimeOf(b.paid_at || b.updated_at),
        b.table_label,
        mergeBillItems(b.orders).map((i) => `${i.qty}x ${i.name}`).join(' | '),
        b.orders.length,
        b.total,
        BILL_STATUS_LABEL[b.status],
        PAYMENT_METHODS[b.payment_method] || '',
      ]
        .map(csvCell)
        .join(','),
    )
    const csv = '﻿' + [header.join(','), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `tokyo-house-sales-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const presets = [
    { label: 'วันนี้', from: daysAgo(0) },
    { label: '7 วัน', from: daysAgo(6) },
    { label: '30 วัน', from: daysAgo(29) },
  ]

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

        {/* ช่วงวันที่ */}
        <div className="card mb-5 flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setFrom(p.from)
                  setTo(daysAgo(0))
                }}
                className={`chip ${from === p.from && to === daysAgo(0) ? 'chip-active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 md:max-w-md">
            <label>
              <span className="field-label">ตั้งแต่</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="input" />
            </label>
            <label>
              <span className="field-label">ถึง</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="input" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <motion.section key={totalMoney} initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="card p-5" aria-label="สรุปยอด">
              <div className="text-sm font-semibold text-subtle">รับชำระทั้งหมด</div>
              <div className="font-display text-5xl">{baht(totalMoney)}</div>
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

            <section className="card p-4">
              <h2 className="mb-2 font-bold">ต้นทุน (ตัวอย่าง)</h2>
              <SalesBarChart data={costs.data || []} height={220} />
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
