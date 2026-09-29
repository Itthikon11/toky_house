import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { StatusBadge } from '../ui/Badge'
import { useToast } from '../ui/Toast'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import {
  BILL_STATUS,
  ORDER_STATUS,
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_META,
  PAYMENT_METHOD_ICON,
  PAYMENT_METHODS,
} from '../../config/constants'
import { baht, dateTimeOf, mergeBillItems, timeOf } from '../../lib/format'

// รายละเอียดบิล: ทุกรอบที่โต๊ะสั่ง + เปลี่ยนสถานะครัว + รับชำระเงิน (เฉพาะพนักงาน)
export default function BillDetailModal({ bill, onClose, onChanged }) {
  const { toast } = useToast()
  const [method, setMethod] = useState('cash')
  const [busy, setBusy] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (!bill) return null

  const isOpen = bill.status === BILL_STATUS.OPEN
  const merged = mergeBillItems(bill.orders)

  const run = async (key, fn, successMsg) => {
    setBusy(key)
    try {
      await fn()
      if (successMsg) toast(successMsg, { type: 'success' })
      onChanged?.()
      return true
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
      return false
    } finally {
      setBusy(null)
    }
  }

  const pay = async () => {
    const ok = await run('pay', () => api.markBillPaid(bill.id, method), `รับชำระ ${bill.table_label} ${baht(bill.total)} (${PAYMENT_METHODS[method]}) เรียบร้อย`)
    if (ok) onClose()
  }
  const cancel = async () => {
    const ok = await run('cancel', () => api.cancelBill(bill.id), `ยกเลิกบิล ${bill.table_label} แล้ว`)
    if (ok) onClose()
  }

  const footer = isOpen ? (
    confirmCancel ? (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-red-700">ยกเลิกบิลทั้งใบ? ยอดนี้จะไม่นับเป็นยอดขาย</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
            ไม่ยกเลิก
          </Button>
          <Button variant="danger" icon="ban" loading={busy === 'cancel'} onClick={cancel}>
            ยืนยันยกเลิก
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="วิธีชำระเงิน">
          {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={method === key}
              onClick={() => setMethod(key)}
              className={`flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl border-2 px-3 text-sm font-bold transition ${
                method === key ? 'border-green-600 bg-green-50 text-green-800' : 'border-black/10 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon name={PAYMENT_METHOD_ICON[key]} size={20} />
              {label}
            </button>
          ))}
        </div>
        <Button variant="success" size="lg" block icon="check" loading={busy === 'pay'} onClick={pay}>
          รับชำระ {baht(bill.total)}
        </Button>
        <button type="button" onClick={() => setConfirmCancel(true)} className="mx-auto block min-h-[2.25rem] text-sm font-semibold text-red-600 underline-offset-4 hover:underline">
          ยกเลิกทั้งบิล
        </button>
      </div>
    )
  ) : null

  return (
    <Modal
      open
      onClose={onClose}
      title={bill.table_label}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="bill" status={bill.status} />
          {bill.payment_method && <span>{PAYMENT_METHODS[bill.payment_method]}</span>}
          <span>เปิดบิล {dateTimeOf(bill.created_at)} · {bill.orders.length} รอบ</span>
        </span>
      }
      maxWidth="max-w-lg"
      footer={footer}
    >
      <div className="space-y-3">
        {bill.orders.map((o) => (
          <div key={o.id} className={`rounded-2xl p-3 ring-1 ring-black/5 ${o.status === ORDER_STATUS_CANCELLED ? 'bg-red-50/60' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">
                รอบที่ {o.round}
                <span className="ml-2 text-sm font-normal text-subtle">{timeOf(o.created_at)}</span>
              </span>
              <StatusBadge status={o.status} />
            </div>
            <ul className={`mt-2 space-y-1 text-sm ${o.status === ORDER_STATUS_CANCELLED ? 'line-through opacity-60' : ''}`}>
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    <b className="tabular-nums">{it.qty}×</b> {it.name}
                  </span>
                  <span className="tabular-nums">{baht(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            {o.note && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-white px-3 py-2 text-sm">
                <Icon name="note" size={16} className="mt-0.5 text-amber-600" /> {o.note}
              </p>
            )}
            {/* เปลี่ยนสถานะรอบนี้ — ปุ่มแบ่งส่วน กดครั้งเดียวไม่ต้องเปิด dropdown */}
            <div className="mt-3 grid grid-cols-4 gap-1 rounded-full bg-white p-1 ring-1 ring-black/5" role="radiogroup" aria-label={`สถานะรอบที่ ${o.round}`}>
              {ORDER_STATUS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={o.status === s}
                  // บิลที่ปิดแล้ว: ยกเลิก/เลิกยกเลิกรอบไม่ได้ ยอดที่รับเงินไปแล้วจะได้ไม่เปลี่ยน
                  disabled={!!busy || (!isOpen && (s === ORDER_STATUS_CANCELLED) !== (o.status === ORDER_STATUS_CANCELLED))}
                  onClick={() => o.status !== s && run(`o-${o.id}`, () => api.updateOrderStatus(o.id, s))}
                  className={`min-h-[2.25rem] rounded-full px-1 text-xs font-bold transition disabled:opacity-60 ${
                    o.status === s ? (s === ORDER_STATUS_CANCELLED ? 'bg-red-600 text-white' : 'bg-brand-ink text-white') : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {ORDER_STATUS_META[s].short}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <p className="mb-2 text-sm font-bold text-subtle">สรุปรวมทั้งบิล</p>
          <ul className="space-y-1 text-sm">
            {merged.map((it) => (
              <li key={`${it.menu_id}|${it.price}`} className="flex justify-between gap-3">
                <span>
                  <b className="tabular-nums">{it.qty}×</b> {it.name}
                </span>
                <span className="tabular-nums">{baht(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-black/5 pt-3">
            <span className="font-bold">ยอดชำระ</span>
            <span className="font-num text-3xl">{baht(bill.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
