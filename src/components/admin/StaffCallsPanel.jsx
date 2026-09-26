import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdminLive } from './AdminLiveProvider'
import { useToast } from '../ui/Toast'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { CALL_REASONS } from '../../config/constants'
import { timeAgo } from '../../lib/format'

export default function StaffCallsPanel() {
  const { calls, refresh } = useAdminLive()
  const { toast } = useToast()
  const [busy, setBusy] = useState(null)

  const resolve = async (c) => {
    setBusy(c.id)
    try {
      await api.resolveCall(c.id)
      refresh()
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className={`card p-4 ${calls.length ? 'ring-4 ring-red-400/60' : ''}`} aria-label="การเรียกพนักงาน">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Icon name={calls.length ? 'bellRing' : 'bell'} size={24} className={calls.length ? 'text-red-600' : ''} />
          เรียกพนักงาน
        </h2>
        <span className={`badge ${calls.length ? 'badge-danger' : 'badge-neutral'}`}>{calls.length} รายการ</span>
      </div>

      {!calls.length && (
        <p className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-subtle">
          <Icon name="check" size={18} /> ยังไม่มีโต๊ะเรียก
        </p>
      )}

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {calls.map((c) => {
            const r = CALL_REASONS[c.reason] || CALL_REASONS.call
            const isBill = c.reason === 'bill'
            return (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${isBill ? 'bg-green-50 ring-1 ring-green-200' : 'bg-brand-yellowSoft ring-1 ring-brand-yellow'}`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${isBill ? 'bg-green-600 text-white' : 'bg-brand-yellow'}`}>
                  <Icon name={r.icon} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-tight">{c.table_label}</div>
                  <div className="text-sm text-muted">
                    {r.label}
                    {c.repeat_count > 1 && <b className="ml-1 text-red-600">· เรียก {c.repeat_count} ครั้ง</b>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-subtle">
                    <Icon name="clock" size={12} /> {timeAgo(c.last_called_at)}
                  </div>
                </div>
                <Button size="sm" variant="dark" icon="check" loading={busy === c.id} onClick={() => resolve(c)}>
                  รับทราบ
                </Button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}
