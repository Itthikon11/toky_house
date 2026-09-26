import { NavLink } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useCart } from '../../context/CartContext'
import { useCallStaff } from './CallStaffProvider'

// แถบเมนูล่างสำหรับลูกค้าบนมือถือ (แสดงเมื่อสแกน QR แล้ว) — กดถึงได้ด้วยนิ้วโป้ง
export default function BottomNav() {
  const { cartCount } = useCart()
  const { openSheet } = useCallStaff()

  const item = ({ isActive }) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition ${
      isActive ? 'text-brand-ink' : 'text-gray-500'
    }`

  return (
    <nav
      aria-label="เมนูลูกค้า"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 shadow-bar backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-nav max-w-md items-stretch px-2">
        <NavLink to="/order" className={item}>
          {({ isActive }) => (
            <>
              <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-brand-yellow' : ''}`}>
                <Icon name="food" size={22} />
              </span>
              เมนู
            </>
          )}
        </NavLink>
        <NavLink to="/checkout" className={item}>
          {({ isActive }) => (
            <>
              <span className={`relative grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-brand-yellow' : ''}`}>
                <Icon name="bag" size={22} />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -right-0.5 -top-1 grid h-5 min-w-[1.25rem] animate-pop place-items-center rounded-full bg-red-600 px-1 text-[0.6875rem] font-bold text-white"
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              ตะกร้า
            </>
          )}
        </NavLink>
        <NavLink to="/bill" className={item}>
          {({ isActive }) => (
            <>
              <span className={`grid h-8 w-12 place-items-center rounded-full ${isActive ? 'bg-brand-yellow' : ''}`}>
                <Icon name="receipt" size={22} />
              </span>
              บิลของฉัน
            </>
          )}
        </NavLink>
        <button type="button" onClick={openSheet} className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-bold">
          <span className="grid h-9 w-14 place-items-center rounded-full bg-brand-ink text-white shadow-soft">
            <Icon name="hand" size={20} />
          </span>
          เรียกพนักงาน
        </button>
      </div>
    </nav>
  )
}
