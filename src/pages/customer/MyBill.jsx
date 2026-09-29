import { useState } from 'react'
import { useTableSession } from '../../context/TableSessionContext'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useCallStaff } from '../../components/customer/CallStaffProvider'
import ScanNotice from '../../components/customer/ScanNotice'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { StatusBadge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/Spinner'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { BILL_STATUS, ORDER_STATUS, ORDER_STATUS_CANCELLED, POLL_MS } from '../../config/constants'
import { baht, mergeBillItems, timeOf } from '../../lib/format'

// บิลของโต๊ะ: ทุกรอบที่สั่งรวมเป็นบิลเดียว + สถานะจากครัว (อัปเดตอัตโนมัติ)
export default function MyBill() {
  const { session } = useTableSession()
  const { call, sending, secondsLeft } = useCallStaff()
  const { toast } = useToast()
  const [cancelTarget, setCancelTarget] = useState(null) // รอบที่กำลังจะขอยกเลิก
  const [requesting, setRequesting] = useState(false)
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

  const requestCancel = async () => {
    setRequesting(true)
    try {
      await api.requestCancelOrder({ token: session.token, orderId: cancelTarget.id, billId: session.billId })
      toast(`ส่งคำขอยกเลิกรอบที่ ${cancelTarget.round} แล้ว — รอพนักงานยืนยัน`, { type: 'success', duration: 4000 })
      await refresh()
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error', duration: 5000 })
      refresh()
    } finally {
      setRequesting(false)
      setCancelTarget(null)
    }
  }
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
              <div className="mt-1 font-num text-5xl">{baht(bill.total)}</div>
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
                  <p className="whitespace-nowrap text-center text-[0.6875rem] text-subtle sm:text-xs">
                    ชำระกับพนักงานที่โต๊ะเท่านั้น · เงินสด / โอน
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
                  {/* ขอยกเลิกได้เฉพาะรอบที่ร้านยังไม่เริ่มทำ — ยกเลิกจริงเมื่อพนักงานอนุมัติ */}
                  {o.status !== ORDER_STATUS_CANCELLED && o.cancel_request === 'pending' && (
                    <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                      <Icon name="clock" size={16} /> ส่งคำขอยกเลิกแล้ว · รอพนักงานยืนยัน
                    </p>
                  )}
                  {o.cancel_request === 'rejected' && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-subtle">
                      <Icon name="info" size={16} /> ร้านไม่อนุมัติการยกเลิกรอบนี้
                    </p>
                  )}
                  {isOpen && o.status === ORDER_STATUS[0] && !o.cancel_request && (
                    <Button variant="ghost" size="sm" icon="ban" className="mt-2 text-red-600" onClick={() => setCancelTarget(o)}>
                      ขอยกเลิกรอบนี้
                    </Button>
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

      <Modal
        open={!!cancelTarget}
        onClose={() => !requesting && setCancelTarget(null)}
        title={cancelTarget ? `ขอยกเลิกรอบที่ ${cancelTarget.round}?` : ''}
        subtitle="พนักงานจะเป็นคนยืนยันการยกเลิก — ถ้าร้านเริ่มทำไปแล้วอาจยกเลิกไม่ได้"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" disabled={requesting} onClick={() => setCancelTarget(null)}>
              ไม่ยกเลิก
            </Button>
            <Button variant="danger" size="lg" loading={requesting} onClick={requestCancel}>
              ส่งคำขอ
            </Button>
          </div>
        }
      >
        {cancelTarget && (
          <ul className="space-y-1 text-sm">
            {cancelTarget.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {it.qty}× {it.name}
                </span>
                <span className="tabular-nums">{baht(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  )
}
