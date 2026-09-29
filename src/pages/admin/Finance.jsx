import { useMemo, useState } from 'react'
import DateRangeFilter, { daysAgo, isoRange, monthStart } from '../../components/admin/DateRangeFilter'
import ExpenseForm from '../../components/admin/ExpenseForm'
import ExpenseCategoryManager from '../../components/admin/ExpenseCategoryManager'
import StatCard from '../../components/admin/StatCard'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { baht } from '../../lib/format'
import { downloadFinanceCsv } from '../../lib/exports'

const dayLabel = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

// หน้าการเงิน: รายรับ (จากบิลที่รับชำระแล้ว) − รายจ่าย (พนักงานบันทึกเอง แยกตามหมวด) = กำไรสุทธิ
export default function Finance() {
  const { toast } = useToast()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(daysAgo(0))
  const [editing, setEditing] = useState(null) // null | {} (ใหม่) | expense
  const [managing, setManaging] = useState(false)

  const range = useMemo(() => isoRange(from, to), [from, to])
  const bills = useLiveQuery(() => api.listClosedBills(range), { live: true, deps: [range.from, range.to] })
  const expenses = useLiveQuery(() => api.listExpenses({ from, to }), { deps: [from, to] })
  const categories = useLiveQuery(api.listExpenseCategories)

  const cats = categories.data || []
  const catName = (id) => cats.find((c) => c.id === id)?.name || 'ไม่มีหมวด'
  const paid = (bills.data || []).filter((b) => b.status === 'paid')
  const rows = expenses.data || []

  const income = paid.reduce((s, b) => s + Number(b.total), 0)
  const expense = rows.reduce((s, e) => s + Number(e.amount), 0)
  const profit = income - expense

  // รายจ่ายรวมต่อหมวด เรียงจากมากไปน้อย
  const byCategory = useMemo(() => {
    const map = new Map()
    rows.forEach((e) => map.set(e.category_id, (map.get(e.category_id) || 0) + Number(e.amount)))
    return [...map.entries()].map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total)
  }, [rows])

  // รายการรายจ่ายจัดกลุ่มตามวัน
  const byDay = useMemo(() => {
    const map = new Map()
    rows.forEach((e) => map.set(e.spent_on, [...(map.get(e.spent_on) || []), e]))
    return [...map.entries()]
  }, [rows])

  const saveExpense = async ({ categoryName, ...rest }) => {
    try {
      let cat = cats.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
      if (!cat) {
        cat = await api.saveExpenseCategory({ name: categoryName })
        await categories.refresh()
      }
      await api.saveExpense({ ...rest, category_id: cat.id })
      await expenses.refresh()
      toast(`บันทึกรายจ่าย ${baht(rest.amount)} (${cat.name}) แล้ว`, { type: 'success' })
      return true
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
      return false
    }
  }

  const deleteExpense = async (e) => {
    try {
      await api.deleteExpense(e.id)
      await expenses.refresh()
      setEditing(null)
      toast(`ลบรายจ่าย ${baht(e.amount)} แล้ว`, { type: 'success' })
    } catch (err) {
      toast(toThaiMessage(err), { type: 'error' })
    }
  }

  const exportCSV = () => downloadFinanceCsv({ expenses: rows, categories: cats, income, from, to })


  const loading = (bills.loading && !bills.data) || (expenses.loading && !expenses.data) || (categories.loading && !categories.data)
  const loadError = bills.error || expenses.error || categories.error

  return (
    <div className="page">
      <div className="container-app">
        <PageHeader
          title="การเงิน & บัญชี"
          subtitle="รายรับนับจากบิลที่พนักงานกด “รับชำระ” แล้ว · รายจ่ายบันทึกเองแยกตามหมวด"
          actions={
            <>
              <Button variant="secondary" size="sm" icon="download" onClick={exportCSV} disabled={!rows.length && !paid.length}>
                CSV
              </Button>
              <Button variant="secondary" size="sm" icon="grid" onClick={() => setManaging(true)} disabled={!categories.data}>
                หมวดรายจ่าย
              </Button>
              <Button size="sm" icon="plus" onClick={() => setEditing({})} disabled={!categories.data}>
                เพิ่มรายจ่าย
              </Button>
            </>
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

        {loadError ? (
          <EmptyState
            tone="danger"
            icon="warning"
            title="โหลดข้อมูลการเงินไม่สำเร็จ"
            description={toThaiMessage(loadError)}
            action={
              <Button
                icon="refresh"
                onClick={() => {
                  bills.refresh()
                  expenses.refresh()
                  categories.refresh()
                }}
              >
                ลองใหม่
              </Button>
            }
          />
        ) : loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard icon="cash" label="รายรับ" value={baht(income)} sub={`${paid.length} บิล`} />
              <StatCard icon="wallet" label="รายจ่าย" value={baht(expense)} sub={`${rows.length} รายการ`} />
              <StatCard
                icon={profit < 0 ? 'warning' : 'chart'}
                label={profit < 0 ? 'ขาดทุนสุทธิ' : 'กำไรสุทธิ'}
                value={baht(profit)}
                sub={income > 0 ? `คิดเป็น ${Math.round((profit / income) * 100)}% ของรายรับ` : 'ยังไม่มีรายรับในช่วงนี้'}
                alert={profit < 0}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
              <section className="card h-fit p-5" aria-label="รายจ่ายตามหมวด">
                <h2 className="mb-4 font-bold">รายจ่ายตามหมวด</h2>
                {byCategory.length ? (
                  <ul className="space-y-3">
                    {byCategory.map((c) => {
                      const pct = expense ? (c.total / expense) * 100 : 0
                      return (
                        <li key={c.id}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-semibold">{catName(c.id)}</span>
                            <span>
                              <span className="font-num">{baht(c.total)}</span>
                              <span className="ml-2 inline-block w-10 text-right text-subtle">{Math.round(pct)}%</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded bg-gray-100" aria-hidden="true">
                            <div className="h-full rounded bg-brand-yellowDark" style={{ width: `${Math.max(pct, 1)}%` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-subtle">ยังไม่มีรายจ่ายในช่วงนี้</p>
                )}
              </section>

              <section aria-label="รายการรายจ่าย">
                <h2 className="section-title mb-3">รายการรายจ่าย</h2>
                {!rows.length ? (
                  <EmptyState
                    icon="wallet"
                    title="ยังไม่มีรายจ่ายในช่วงนี้"
                    description="บันทึกค่าวัตถุดิบ ค่าไฟ ค่าแก๊ส ฯลฯ เพื่อให้ระบบคำนวณกำไรให้"
                    action={
                      <Button icon="plus" onClick={() => setEditing({})}>
                        เพิ่มรายจ่าย
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {byDay.map(([day, items]) => (
                      <div key={day}>
                        <div className="mb-1.5 flex items-baseline justify-between px-1 text-sm">
                          <span className="font-semibold text-gray-700">{dayLabel(day)}</span>
                          <span className="text-subtle">รวม {baht(items.reduce((s, e) => s + Number(e.amount), 0))}</span>
                        </div>
                        <ul className="space-y-2">
                          {items.map((e) => (
                            <li key={e.id}>
                              <button
                                type="button"
                                onClick={() => setEditing(e)}
                                className="card-flat flex w-full items-center gap-3 p-3 text-left transition hover:bg-black/[0.02]"
                                aria-label={`แก้ไขรายจ่าย ${catName(e.category_id)} ${baht(e.amount)}`}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="badge badge-neutral">{catName(e.category_id)}</span>
                                  {e.note && <span className="mt-1 block truncate text-sm text-gray-700">{e.note}</span>}
                                </span>
                                <span className="font-num text-lg">{baht(e.amount)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {editing && (
        <ExpenseForm
          key={editing.id || 'new'}
          expense={editing.id ? editing : null}
          categories={cats}
          onSave={saveExpense}
          onDelete={deleteExpense}
          onClose={() => setEditing(null)}
        />
      )}
      {managing && (
        <ExpenseCategoryManager
          categories={cats}
          onChanged={async () => {
            await categories.refresh()
            await expenses.refresh()
          }}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  )
}
