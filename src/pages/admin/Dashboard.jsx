import StaffCallsPanel from '../../components/admin/StaffCallsPanel'
import OpenBillsBoard from '../../components/admin/OpenBillsBoard'
import StatCard from '../../components/admin/StatCard'
import { useAdminLive } from '../../components/admin/AdminLiveProvider'
import { SalesBarChart, ForecastLineChart } from '../../components/charts/Charts'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api, isDemoMode, usingDefaultPassword } from '../../services/api'
import { ORDER_STATUS } from '../../config/constants'
import { baht, localDateKey } from '../../lib/format'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function Dashboard() {
  const { openBills, calls } = useAdminLive()
  const today = useLiveQuery(() => api.listClosedBills({ from: startOfToday() }), { live: true, interval: 60000 })
  const costs = useLiveQuery(api.getCosts)
  const forecast = useLiveQuery(api.getForecast)

  const todayKey = localDateKey(new Date())
  const paidTodayBills = (today.data || []).filter((b) => b.status === 'paid' && localDateKey(b.paid_at) === todayKey)
  const paidToday = paidTodayBills.reduce((s, b) => s + Number(b.total), 0)
  const waitingRounds = openBills.flatMap((b) => b.orders).filter((o) => o.status === ORDER_STATUS[0] || o.status === ORDER_STATUS[1]).length
  const openTotal = openBills.reduce((s, b) => s + Number(b.total), 0)

  return (
    <div className="page">
      <div className="container-app">
        <PageHeader
          title="แดชบอร์ด"
          subtitle="อัปเดตอัตโนมัติ — มีเสียงเตือนเมื่อมีออเดอร์ใหม่หรือโต๊ะเรียก"
          actions={
            <Button href="/kitchen.html" target="_blank" rel="noopener" variant="secondary" size="sm" icon="chef" iconRight="external">
              เปิดจอครัว
            </Button>
          }
        />

        {(isDemoMode || usingDefaultPassword) && (
          <div className="mb-5 space-y-2">
            {isDemoMode && (
              <div className="callout callout-warning">
                <Icon name="info" size={18} className="mt-0.5" />
                <span>
                  <b>โหมดทดลอง</b> — ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้น ลูกค้าที่สั่งจากมือถือเครื่องอื่นจะไม่ขึ้นในหน้านี้ (ดูวิธีเชื่อม Supabase ใน README)
                </span>
              </div>
            )}
            {usingDefaultPassword && (
              <div className="callout callout-danger">
                <Icon name="lock" size={18} className="mt-0.5" />
                <span>ยังใช้รหัสผ่านเริ่มต้นอยู่ — ตั้งค่า VITE_ADMIN_PASSWORD_HASH ในไฟล์ .env ก่อนใช้งานจริง</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard icon="bellRing" label="เรียกพนักงาน" value={calls.length} alert={calls.length > 0} />
          <StatCard icon="receipt" label="ยังไม่ชำระ" value={`${openBills.length} โต๊ะ`} sub={`รวม ${baht(openTotal)}`} />
          <StatCard icon="cooking" label="รอครัว" value={`${waitingRounds} รอบ`} />
          <StatCard icon="cash" label="รับชำระวันนี้" value={baht(paidToday)} sub={`${paidTodayBills.length} บิล`} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* มือถือ: เรียกพนักงานขึ้นก่อน (เรื่องด่วนที่สุด) */}
          <div className="order-2 lg:order-1">
            <h2 className="section-title mb-3">บิลที่ยังไม่ชำระ</h2>
            <OpenBillsBoard />
          </div>

          <div className="order-1 space-y-6 lg:order-2">
            <StaffCallsPanel />
            <div className="hidden lg:block">
              <h2 className="section-title mb-3">ต้นทุน (ตัวอย่าง)</h2>
              <div className="card p-4">
                <SalesBarChart data={costs.data || []} />
              </div>
            </div>
            <div className="hidden lg:block">
              <h2 className="section-title mb-3">สถิติคาดการณ์ (ตัวอย่าง)</h2>
              <div className="card p-4">
                <ForecastLineChart data={forecast.data || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
