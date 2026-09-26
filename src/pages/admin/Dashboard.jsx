import { useState } from 'react'
import StaffCallsPanel from '../../components/admin/StaffCallsPanel'
import OpenBillsBoard from '../../components/admin/OpenBillsBoard'
import OrderQueue, { useKitchenOrders } from '../../components/admin/OrderQueue'
import StatCard from '../../components/admin/StatCard'
import { useAdminLive } from '../../components/admin/AdminLiveProvider'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useWakeLock } from '../../hooks/useWakeLock'
import { api, isDemoMode, usingDefaultPassword } from '../../services/api'
import { baht, localDateKey } from '../../lib/format'
import { isSoundOn, playChime, setSoundOn } from '../../lib/sound'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// หน้าทำงานหลักของร้าน (รวมจอครัวไว้ด้วย): คิวออเดอร์ · เรียกพนักงาน · บิลที่ยังไม่ชำระ
// เปิดทิ้งไว้บนแท็บเล็ต/คอมที่เคาน์เตอร์ได้ — จอไม่ดับ มีเสียงเตือน
export default function Dashboard() {
  const { openBills, calls } = useAdminLive()
  const today = useLiveQuery(() => api.listClosedBills({ from: startOfToday() }), { live: true, interval: 60000 })
  const kitchen = useKitchenOrders()
  const [sound, setSound] = useState(isSoundOn)
  useWakeLock()

  const todayKey = localDateKey(new Date())
  const paidTodayBills = (today.data || []).filter((b) => b.status === 'paid' && localDateKey(b.paid_at) === todayKey)
  const paidToday = paidTodayBills.reduce((s, b) => s + Number(b.total), 0)
  const openTotal = openBills.reduce((s, b) => s + Number(b.total), 0)

  const toggleSound = () => {
    const next = !sound
    setSoundOn(next)
    setSound(next)
    if (next) playChime('order', { force: true }) // ทดสอบเสียงให้ได้ยิน
  }

  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()

  return (
    <div className="page">
      <div className="container-app">
        <PageHeader
          title="แดชบอร์ด"
          subtitle="อัปเดตอัตโนมัติ — ออเดอร์ใหม่และโต๊ะที่เรียกจะเด้งพร้อมเสียง"
          actions={
            <>
              <Button variant={sound ? 'secondary' : 'ghost'} size="sm" icon={sound ? 'soundOn' : 'soundOff'} onClick={toggleSound} aria-pressed={sound}>
                {sound ? 'เสียงเปิด' : 'เสียงปิด'}
              </Button>
              <Button variant="secondary" size="sm" icon="fullscreen" onClick={toggleFullscreen} className="hidden sm:inline-flex">
                เต็มจอ
              </Button>
            </>
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
          <StatCard icon="cooking" label="รอทำ / รอเสิร์ฟ" value={`${kitchen.pending.length} รอบ`} />
          <StatCard icon="receipt" label="ยังไม่ชำระ" value={`${openBills.length} โต๊ะ`} sub={`รวม ${baht(openTotal)}`} />
          <StatCard icon="cash" label="รับชำระวันนี้" value={baht(paidToday)} sub={`${paidTodayBills.length} บิล`} />
        </div>

        {/* มือถือ: เรียกพนักงาน → คิวออเดอร์ → บิล / จอใหญ่: คิวซ้าย, เรียกพนักงาน + บิลขวา */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr] lg:grid-rows-[auto_1fr] lg:items-start">
          <div className="lg:col-start-2 lg:row-start-1">
            <StaffCallsPanel />
          </div>
          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <OrderQueue kitchen={kitchen} />
          </div>
          <div className="lg:col-start-2 lg:row-start-2">
            <h2 className="section-title mb-3">บิลที่ยังไม่ชำระ</h2>
            <OpenBillsBoard />
          </div>
        </div>
      </div>
    </div>
  )
}
