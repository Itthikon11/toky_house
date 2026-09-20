import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <img
        src="/images/LOGO.jpg"
        alt="TOKYO HOUSE"
        className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-yellow"
      />
      <span className="font-display text-2xl md:text-3xl tracking-wide">
        TOKYO&nbsp;HOUSE
      </span>
    </Link>
  )
}

export default function Navbar() {
  const { isAdmin, logoutAdmin, tableLabel, cartCount } = useApp()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const customerLinks = [
    { to: '/', label: 'หน้าแรก', end: true },
    { to: '/order', label: 'สั่งอาหาร' },
    { to: '/contact', label: 'ช่องทางติดต่อ' },
  ]
  const adminLinks = [
    { to: '/', label: 'หน้าแรก', end: true },
    { to: '/admin/dashboard', label: 'แดชบอร์ด' },
    { to: '/admin/sales', label: 'ยอดขาย' },
    { to: '/admin/menu', label: 'เมนู' },
  ]
  const links = isAdmin ? adminLinks : customerLinks

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-black/5">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-4 px-4">
        <Logo />

        {/* เมนูกลาง (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* ขวา: badge ผู้ใช้ + ตะกร้า */}
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <button
              onClick={() => navigate('/checkout')}
              className="relative grid h-11 w-11 place-items-center rounded-full bg-brand-yellow shadow-soft transition hover:bg-brand-yellowDark active:scale-95"
              aria-label="ตะกร้า"
            >
              🛒
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* User pill */}
          <div className="relative">
            <button
              onClick={() => (isAdmin ? setOpen((v) => !v) : navigate('/table'))}
              className="flex items-center gap-2 rounded-full border-2 border-brand-yellow bg-white px-2 py-1 pr-3 font-semibold shadow-soft transition hover:shadow-card"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-sky text-lg">
                {isAdmin ? '🧑‍🍳' : '🧑'}
              </span>
              <span className="max-w-[160px] truncate text-sm">
                {isAdmin ? 'ADMIN' : `ลูกค้า${tableLabel}`}
              </span>
              <span className="text-xs text-black/50">▾</span>
            </button>

            <AnimatePresence>
              {open && isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl bg-white shadow-card"
                >
                  <button
                    className="block w-full px-4 py-3 text-left text-sm hover:bg-brand-sky"
                    onClick={() => {
                      setOpen(false)
                      navigate('/admin/menu')
                    }}
                  >
                    จัดการเมนู
                  </button>
                  <button
                    className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={() => {
                      logoutAdmin()
                      setOpen(false)
                      navigate('/')
                    }}
                  >
                    ออกจากระบบ
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* hamburger (mobile) */}
          <button
            className="md:hidden grid h-11 w-11 place-items-center rounded-full bg-brand-sky"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="เมนู"
          >
            ☰
          </button>
        </div>
      </div>

      {/* เมนู mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-black/5 bg-white"
          >
            <div className="flex flex-col p-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 font-semibold ${
                      isActive ? 'bg-brand-yellow' : 'hover:bg-brand-sky'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
