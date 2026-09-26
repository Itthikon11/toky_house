import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTableSession } from '../../context/TableSessionContext'
import { useAdminLive } from '../admin/AdminLiveProvider'
import { useCallStaff } from '../customer/CallStaffProvider'

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="TOKYO HOUSE หน้าแรก">
      <img src="/images/LOGO.jpg" alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-yellow" />
      <span className="hidden font-display text-2xl tracking-wide sm:inline">TOKYO&nbsp;HOUSE</span>
    </Link>
  )
}

const CUSTOMER_LINKS = [
  { to: '/', label: 'หน้าแรก', icon: 'home', end: true },
  { to: '/order', label: 'เมนู', icon: 'food' },
  { to: '/bill', label: 'บิลของฉัน', icon: 'receipt', needsTable: true },
  { to: '/contact', label: 'ติดต่อร้าน', icon: 'phone' },
]
const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'แดชบอร์ด', icon: 'grid' },
  { to: '/admin/sales', label: 'ยอดขาย', icon: 'chart' },
  { to: '/admin/menu', label: 'จัดการเมนู', icon: 'food' },
  { to: '/admin/tables', label: 'โต๊ะ & QR', icon: 'qr' },
]

export default function Navbar() {
  const { isAdmin, logout } = useAuth()
  const { cartCount } = useCart()
  const { session } = useTableSession()
  const { calls } = useAdminLive()
  const { openSheet } = useCallStaff()
  const [drawer, setDrawer] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const userMenuRef = useRef(null)

  const links = isAdmin ? ADMIN_LINKS : CUSTOMER_LINKS.filter((l) => !l.needsTable || session)

  // ปิดเมนูเมื่อเปลี่ยนหน้า / คลิกนอกเมนู
  useEffect(() => {
    setDrawer(false)
    setUserMenu(false)
  }, [location.pathname])
  useEffect(() => {
    if (!userMenu) return undefined
    const onClick = (e) => !userMenuRef.current?.contains(e.target) && setUserMenu(false)
    document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [userMenu])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-header max-w-7xl items-center gap-3 px-4">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon name={l.icon} size={18} />
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <a href="/kitchen.html" target="_blank" rel="noopener" className="nav-link">
              <Icon name="chef" size={18} />
              จอครัว
              <Icon name="external" size={14} className="text-subtle" />
            </a>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="relative grid h-11 w-11 place-items-center rounded-full bg-brand-sky transition hover:bg-brand-skyDark"
                aria-label={`เรียกพนักงาน ${calls.length} รายการ`}
              >
                <Icon name={calls.length ? 'bellRing' : 'bell'} size={22} className={calls.length ? 'text-red-600' : ''} />
                {calls.length > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] animate-pulse place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {calls.length}
                  </span>
                )}
              </button>

              <div className="relative hidden lg:block" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenu((v) => !v)}
                  aria-expanded={userMenu}
                  className="flex min-h-[44px] items-center gap-2 rounded-full bg-white px-3 font-semibold ring-1 ring-black/10 transition hover:bg-gray-50"
                >
                  <Icon name="user" size={22} />
                  พนักงาน
                  <Icon name="chevronDown" size={16} />
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl bg-white py-1 shadow-card ring-1 ring-black/5"
                    >
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                        <Icon name="logout" size={18} /> ออกจากระบบ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              {session && (
                <Button variant="dark" size="sm" icon="hand" onClick={openSheet} className="hidden md:inline-flex">
                  เรียกพนักงาน
                </Button>
              )}
              {/* ตะกร้า: มือถือที่มีแถบล่างแล้วไม่ต้องแสดงซ้ำ */}
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className={`relative h-11 w-11 place-items-center rounded-full bg-brand-yellow transition hover:bg-brand-yellowDark ${session ? 'hidden md:grid' : 'grid'}`}
                aria-label={`ตะกร้า ${cartCount} ชิ้น`}
              >
                <Icon name="bag" size={22} />
                {cartCount > 0 && (
                  <span key={cartCount} className="absolute -right-1 -top-1 grid h-5 min-w-[20px] animate-pop place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
              {session && (
                <Link
                  to="/bill"
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-brand-yellow bg-white px-3 text-sm font-bold"
                  aria-label={`${session.label} — ดูบิล`}
                >
                  <Icon name="map" size={18} />
                  <span className="max-w-[110px] truncate">{session.label}</span>
                </Link>
              )}
            </>
          )}

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-gray-100 transition hover:bg-gray-200 lg:hidden"
            onClick={() => setDrawer((v) => !v)}
            aria-label={drawer ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={drawer}
          >
            <Icon name={drawer ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-black/5 bg-white lg:hidden"
            aria-label="เมนูหลัก"
          >
            <div className="flex flex-col gap-1 p-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center gap-3 rounded-2xl px-4 font-semibold ${isActive ? 'bg-brand-yellow' : 'hover:bg-gray-100'}`
                  }
                >
                  <Icon name={l.icon} size={20} />
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && (
                <>
                  <a href="/kitchen.html" className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 font-semibold hover:bg-gray-100">
                    <Icon name="chef" size={20} /> จอครัว
                  </a>
                  <button type="button" onClick={handleLogout} className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-left font-semibold text-red-600 hover:bg-red-50">
                    <Icon name="logout" size={20} /> ออกจากระบบ
                  </button>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
