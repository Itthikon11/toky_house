import { useState } from 'react'
import BillDetailModal from './BillDetailModal'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { StatusBadge } from '../ui/Badge'
import { PAYMENT_METHOD_ICON, PAYMENT_METHODS } from '../../config/constants'
import { baht, dateTimeOf, mergeBillItems, summarizeItems } from '../../lib/format'

// ประวัติบิล (ชำระแล้ว / ยกเลิก) — เป็นรายการที่อ่านง่ายทั้งมือถือและคอม
export default function BillsTable({ bills, onChanged }) {
  const [detailId, setDetailId] = useState(null)
  const detail = bills.find((b) => b.id === detailId) || null

  if (!bills.length) {
    return <EmptyState icon="receipt" title="ไม่มีบิลในช่วงนี้" description="ลองเลือกช่วงวันที่ให้กว้างขึ้น" />
  }

  return (
    <>
      <ul className="card nice-scroll max-h-[640px] divide-y divide-black/5 overflow-y-auto">
        {bills.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setDetailId(b.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{b.table_label}</b>
                  <StatusBadge kind="bill" status={b.status} />
                  {b.payment_method && (
                    <span className="inline-flex items-center gap-1 text-xs text-subtle">
                      <Icon name={PAYMENT_METHOD_ICON[b.payment_method]} size={14} />
                      {PAYMENT_METHODS[b.payment_method]}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-sm text-muted">
                  {summarizeItems(mergeBillItems(b.orders))}
                  {b.orders.length > 1 && <span className="text-subtle"> · {b.orders.length} รอบ</span>}
                </div>
                <div className="text-xs text-subtle">{dateTimeOf(b.paid_at || b.updated_at)}</div>
              </div>
              <span className={`font-display text-xl ${b.status === 'cancelled' ? 'text-gray-400 line-through' : ''}`}>{baht(b.total)}</span>
              <Icon name="chevronRight" size={18} className="text-gray-400" />
            </button>
          </li>
        ))}
      </ul>

      <BillDetailModal key={detailId} bill={detail} onClose={() => setDetailId(null)} onChanged={onChanged} />
    </>
  )
}
