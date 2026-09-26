import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

const STYLES = {
  info: { box: 'bg-brand-ink text-white', icon: 'info' },
  success: { box: 'bg-green-600 text-white', icon: 'success' },
  error: { box: 'bg-red-600 text-white', icon: 'warning' },
  alert: { box: 'bg-brand-yellow text-brand-ink ring-4 ring-brand-yellow/40', icon: 'bellRing' },
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const seq = useRef(0)

  const dismiss = useCallback((id) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (message, { type = 'info', duration = 3000 } = {}) => {
      const id = ++seq.current
      setItems((prev) => [...prev.slice(-2), { id, message, type }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((t) => {
            const s = STYLES[t.type] || STYLES.info
            return (
              <motion.button
                key={t.id}
                type="button"
                layout
                onClick={() => dismiss(t.id)}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16 }}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-left font-semibold shadow-card ${s.box}`}
              >
                <Icon name={s.icon} size={22} className="mt-px" />
                <span className="flex-1">{t.message}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
