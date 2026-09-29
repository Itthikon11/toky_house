import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'

// มือถือ = แผ่นเลื่อนขึ้นจากด้านล่าง (bottom sheet), จอใหญ่ = กล่องกลางจอ
export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-md' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // กันหน้าหลังเลื่อนตาม
    const t = setTimeout(() => panelRef.current?.focus(), 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      clearTimeout(t)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-card outline-none sm:rounded-3xl ${maxWidth}`}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-black/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
              <div className="min-w-0">
                <h2 className="font-display text-2xl leading-tight">{title}</h2>
                {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 transition hover:bg-gray-200"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className={`nice-scroll flex-1 overflow-y-auto px-5 sm:px-6 ${footer ? 'pb-5' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6'}`}>
              {children}
            </div>
            {footer && (
              // ระยะล่างอย่างน้อย 1rem — ถ้ามือถือมีแถบ Home (safe-area) ใหญ่กว่า ใช้ค่านั้นแทน
              <div className="border-t border-black/5 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:rounded-b-3xl sm:px-6 sm:pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
