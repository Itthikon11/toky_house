import { useTableSession } from '../../context/TableSessionContext'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useCallStaff } from '../../components/customer/CallStaffProvider'
import ScanNotice from '../../components/customer/ScanNotice'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { StatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/Spinner'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { BILL_STATUS, ORDER_STATUS_CANCELLED, POLL_MS } from '../../config/constants'
import { baht, mergeBillItems, timeOf } from '../../lib/format'

// บิลของโต๊ะ: ทุกรอบที่สั่งรวมเป็นบิลเดียว + สถานะจากครัว (อัปเดตอัตโนมัติ)
export default function MyBill() {
  const { session } = useTableSession()
  const { call, sending, secondsLeft } = useCallStaff()
  const { data, error, loading, refresh } = useLiveQuery(
    () => api.getTableBill({ token: session.token, billId: session.billId }),
    { enabled: !!session, interval: POLL_MS.CUSTOMER, deps: [session?.token, session?.billId] },
  )

  if (!session) {
    return (
      <div className="page">
        <div className="container-app max-w-xl">
          <PageHeader title="บิลของฉัน" />
          <ScanNotice />
        </div>
      </div>
    )
  }

  const bill = data?.bill
  const merged = bill ? mergeBillItems(bill.orders) : []
  const isOpen = bill?.status === BILL_STATUS.OPEN
  const payWait = secondsLeft('bill')

  return (
    <div className="page">
      <div className="container-app max-w-xl">
        <PageHeader
          title="บิลของฉัน"
          subtitle={session.label}
          actions={bill && <Button variant="ghost" size="sm" icon="refresh" onClick={refresh} aria-label="รีเฟรช" />}
        />

        {error ? (
          <EmptyState
            tone="danger"
            icon="warning"
            title="โหลดบิลไม่สำเร็จ"
            description={toThaiMessage(error)}
            action={<Button icon="refresh" onClick={refresh}>ลองใหม่</Button>}
          />
        ) : loading && !data ? (
          <PageLoader />
        ) : !bill ? (
          <EmptyState
            icon="receipt"
            title="ยังไม่มีบิลที่ค้างชำระ"
            description="เมื่อสั่งอาหาร รายการทั้งหมดของโต๊ะจะแสดงที่นี่"
            action={<Button to="/order" icon="food">เริ่มสั่งอาหาร</Button>}
          />
        ) : (
          <>
            {/* สรุปยอด + ชำระเงิน */}
            <section className="card p-5" aria-label="สรุปบิล">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">ยอดรวมทั้งบิล</span>
                <StatusBadge kind="bill" status={bill.status} />
              </div>
              <div className="mt-1 font-display text-5xl">{baht(bill.total)}</div>
              <div className="text-sm text-subtle">
                {bill.orders.length} รอบ · {merged.reduce((s, it) => s + it.qty, 0)} ชิ้น
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-black/5 pt-3 text-sm">
                {merged.map((it) => (
                  <li key={`${it.menu_id}|${it.price}`} className="flex justify-between gap-3">
                    <span>
                      <b className="tabular-nums">{it.qty}×</b> {it.name}
                    </span>
                    <span className="tabular-nums">{baht(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>

              {isOpen && (
                <div className="mt-5 space-y-2">
                  <Button block size="lg" variant="dark" icon={payWait ? 'check' : 'receipt'} loading={sending === 'bill'} disabled={payWait > 0} onClick={() => call('bill')}>
                    {payWait ? `แจ้งพนักงานแล้ว · รอสักครู่ (${payWait}s)` : 'ขอชำระเงิน / เช็คบิล'}
                  </Button>
                  <p className="text-center text-xs text-subtle">
                    ร้านไม่มีการชำระออนไลน์ — พนักงานจะมาคิดเงินที่โต๊ะ (เงินสด / โอน)
                  </p>
                </div>
              )}
            </section>

            {/* รายการแต่ละรอบ */}
            <h2 className="section-title mb-3 mt-8">รายการที่สั่ง</h2>
            <ol className="space-y-3">
              {bill.orders.map((o) => (
                <li key={o.id} className={`card-flat p-4 ${o.status === ORDER_STATUS_CANCELLED ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      รอบที่ {o.round}
                      <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-subtle">
                        <Icon name="clock" size={14} /> {timeOf(o.created_at)}
                      </span>
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          {it.qty}× {it.name}
                        </span>
                        <span className="tabular-nums">{baht(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.note && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-subtle">
                      <Icon name="note" size={16} className="mt-0.5" /> {o.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            {isOpen && (
              <Button to="/order" variant="primary" icon="plus" block className="mt-6">
                สั่งเพิ่ม (รวมบิลเดิม)
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
