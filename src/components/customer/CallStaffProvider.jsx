import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import Spinner from '../ui/Spinner'
import { useToast } from '../ui/Toast'
import { useTableSession } from '../../context/TableSessionContext'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { CALL_REASONS, LIMITS } from '../../config/constants'

// การเรียกพนักงานของลูกค้า — เปิดได้จากแถบล่าง, หัวเว็บ, หรือปุ่ม "ขอชำระเงิน" ในหน้าบิล
const CallStaffContext = createContext(null)
export const useCallStaff = () => useContext(CallStaffContext)

export function CallStaffProvider({ children }) {
  const { session } = useTableSession()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(null)
  const [readyAt, setReadyAt] = useState({}) // reason -> เวลาที่กดซ้ำได้
  const [, setTick] = useState(0)

  // นับถอยหลังเวลาที่กดซ้ำได้
  useEffect(() => {
    if (!Object.values(readyAt).some((t) => t > Date.now())) return undefined
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [readyAt])

  const secondsLeft = useCallback(
    (reason) => Math.max(0, Math.ceil(((readyAt[reason] || 0) - Date.now()) / 1000)),
    [readyAt],
  )

  const call = useCallback(
    async (reason) => {
      if (!session) return false
      setSending(reason)
      try {
        const res = await api.callStaff({ token: session.token, reason })
        setReadyAt((c) => ({ ...c, [reason]: Date.now() + (res.retry_after || LIMITS.CALL_COOLDOWN_SEC) * 1000 }))
        if (res.status === 'cooldown') {
          toast('แจ้งพนักงานไปแล้ว พนักงานกำลังมา', { type: 'info' })
        } else {
          toast(`แจ้งแล้ว! พนักงานกำลังไปที่${session.label}`, { type: 'success', duration: 4000 })
        }
        setOpen(false)
        return true
      } catch (e) {
        toast(toThaiMessage(e), { type: 'error' })
        return false
      } finally {
        setSending(null)
      }
    },
    [session, toast],
  )

  const value = useMemo(
    () => ({ available: !!session, openSheet: () => setOpen(true), call, sending, secondsLeft }),
    [session, call, sending, secondsLeft],
  )

  return (
    <CallStaffContext.Provider value={value}>
      {children}
      {session && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="เรียกพนักงาน"
          subtitle="ร้านไม่มีการชำระเงินออนไลน์ — ชำระกับพนักงานที่โต๊ะ"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-brand-yellow px-4 py-3">
            <Icon name="map" size={24} />
            <div>
              <div className="text-sm font-semibold">พนักงานจะมาที่</div>
              <div className="font-display text-3xl leading-none">{session.label}</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {Object.entries(CALL_REASONS).map(([key, r]) => {
              const wait = secondsLeft(key)
              const isSending = sending === key
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!!sending || wait > 0}
                  onClick={() => call(key)}
                  className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-left transition hover:border-brand-yellowDark hover:bg-brand-yellowSoft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-sky">
                    <Icon name={r.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{r.label}</span>
                    <span className="block text-sm text-subtle">{r.hint}</span>
                  </span>
                  {isSending && <Spinner size={20} />}
                  {wait > 0 && (
                    <span className="badge badge-success">
                      <Icon name="check" size={14} /> แจ้งแล้ว · {wait}s
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Modal>
      )}
    </CallStaffContext.Provider>
  )
}
