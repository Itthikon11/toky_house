import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { api, isDemoMode } from '../../services/api'
import { CALL_REASONS } from '../../config/constants'
import { playChime, unlockAudio } from '../../lib/sound'

// ข้อมูลสดของฝั่งร้าน: การเรียกพนักงาน + บิลที่ยังไม่ชำระ
// เปิดอยู่ทุกหน้าของแอดมิน → มีเสียง/ป๊อปอัปเตือนแม้อยู่หน้าเมนูหรือยอดขาย
const AdminLiveContext = createContext(null)
export const useAdminLive = () => useContext(AdminLiveContext)

// Realtime ทำงานแล้ว → polling เป็นแค่ตัวสำรอง (ประหยัดโควต้า)
const FALLBACK_POLL_MS = isDemoMode ? 8000 : 30000

export function AdminLiveProvider({ children }) {
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const calls = useLiveQuery(api.listPendingCalls, { enabled: isAdmin, live: true, interval: FALLBACK_POLL_MS })
  const bills = useLiveQuery(api.listOpenBills, { enabled: isAdmin, live: true, interval: FALLBACK_POLL_MS })

  useEffect(() => unlockAudio(), [])

  // แจ้งเตือนการเรียกพนักงานใหม่ / เรียกซ้ำ
  const seenCalls = useRef(null)
  useEffect(() => {
    if (!isAdmin) {
      seenCalls.current = null
      return
    }
    if (!calls.data) return
    const prev = seenCalls.current
    if (prev) {
      const fresh = calls.data.filter((c) => prev.get(c.id) !== c.last_called_at)
      if (fresh.length) {
        playChime('call')
        fresh.forEach((c) =>
          toast(
            `${c.table_label} — ${CALL_REASONS[c.reason]?.label || 'เรียกพนักงาน'}${
              c.repeat_count > 1 ? ` (เรียกครั้งที่ ${c.repeat_count})` : ''
            }`,
            { type: 'alert', duration: 7000 },
          ),
        )
      }
    }
    seenCalls.current = new Map(calls.data.map((c) => [c.id, c.last_called_at]))
  }, [calls.data, isAdmin, toast])

  // แจ้งเตือนออเดอร์ใหม่ (รวมถึงการสั่งเพิ่มเข้าบิลเดิม)
  const seenOrders = useRef(null)
  useEffect(() => {
    if (!isAdmin) {
      seenOrders.current = null
      return
    }
    if (!bills.data) return
    const all = bills.data.flatMap((b) => b.orders.map((o) => ({ ...o, table_label: b.table_label })))
    const prev = seenOrders.current
    if (prev) {
      const fresh = all.filter((o) => !prev.has(o.id))
      if (fresh.length) {
        playChime('order')
        fresh.forEach((o) =>
          toast(
            o.round > 1
              ? `${o.table_label} สั่งเพิ่ม (รอบที่ ${o.round}) — รวมเข้าบิลเดิม`
              : `ออเดอร์ใหม่ ${o.table_label}`,
            { type: 'info', duration: 5000 },
          ),
        )
      }
    }
    seenOrders.current = new Set(all.map((o) => o.id))
  }, [bills.data, isAdmin, toast])

  const value = useMemo(
    () => ({
      calls: calls.data || [],
      openBills: bills.data || [],
      loading: calls.loading || bills.loading,
      error: calls.error || bills.error,
      refresh: () => {
        calls.refresh()
        bills.refresh()
      },
    }),
    [calls, bills],
  )

  return <AdminLiveContext.Provider value={value}>{children}</AdminLiveContext.Provider>
}
