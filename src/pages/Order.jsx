import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getMenu } from '../lib/data'
import { useApp } from '../context/AppContext'

export default function Order() {
  const [menu, setMenu] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('ทั้งหมด')
  const [flash, setFlash] = useState(null)
  const { addToCart, cartCount, cartTotal, tableLabel } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    getMenu().then((m) => setMenu(m))
  }, [])

  const categories = useMemo(
    () => ['ทั้งหมด', ...new Set(menu.map((m) => m.filling))],
    [menu],
  )

  const list = menu
    .filter((m) => m.available)
    .filter((m) => (filter === 'ทั้งหมด' ? true : m.filling === filter))
    .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))

  const handleAdd = (m) => {
    addToCart(m)
    setFlash(m.id)
    setTimeout(() => setFlash(null), 700)
  }

  return (
    <div className="bg-sky-gradient min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">สั่งอาหาร</h1>
            <p className="text-black/60">
              กำลังสั่งในนาม <b>ลูกค้า{tableLabel}</b> ·{' '}
              <button
                onClick={() => navigate('/table')}
                className="underline hover:text-black"
              >
                เปลี่ยนโต๊ะ
              </button>
            </p>
          </div>

          {/* ค้นหา + กรอง */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเมนู…"
                className="w-56 rounded-full bg-white px-5 py-2.5 pr-10 shadow-soft outline-none focus:shadow-glow"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
                🔍
              </span>
            </div>
            <div className="flex gap-1 rounded-full bg-white p-1 shadow-soft">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    filter === c
                      ? 'bg-brand-yellow'
                      : 'text-black/60 hover:bg-brand-sky'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* การ์ดเมนู */}
        <div className="mt-6 grid grid-cols-2 gap-4 pb-28 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((m, i) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card group relative overflow-hidden"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={m.image}
                  alt={m.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="absolute left-3 top-3 pill bg-white/90 text-xs">
                  {m.code}
                </span>
              </div>
              <div className="p-4">
                <div className="line-clamp-1 font-bold">{m.name}</div>
                <div className="text-sm text-black/50">{m.category}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-2xl">{m.price}฿</span>
                  <button
                    onClick={() => handleAdd(m)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-brand-yellow text-xl font-bold shadow-soft transition hover:bg-brand-yellowDark active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {flash === m.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 grid place-items-center bg-brand-yellow/85 font-display text-2xl"
                  >
                    เพิ่มแล้ว! 🛒
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* แถบตะกร้าลอยด้านล่าง */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            onClick={() => navigate('/checkout')}
            className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-brand-ink px-6 py-4 text-white shadow-card"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-yellow font-bold text-black">
              {cartCount}
            </span>
            <span className="font-semibold">ดูตะกร้า</span>
            <span className="font-display text-xl">{cartTotal}฿</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
