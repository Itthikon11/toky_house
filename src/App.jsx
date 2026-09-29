import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import OfflineBanner from './components/layout/OfflineBanner'
import BottomNav from './components/customer/BottomNav'
import RequireAdmin from './components/admin/RequireAdmin'
import { PageLoader } from './components/ui/Spinner'
import { useAuth } from './context/AuthContext'
import { useTableSession } from './context/TableSessionContext'

// หน้าลูกค้า (โหลดทันที)
import Home from './pages/customer/Home'
import Menu from './pages/customer/Menu'
import Cart from './pages/customer/Cart'
import MyBill from './pages/customer/MyBill'
import Contact from './pages/customer/Contact'
import TableEntry from './pages/customer/TableEntry'
import NotFound from './pages/NotFound'

// หน้าพนักงาน (โหลดเมื่อเข้าใช้ — ลูกค้าไม่ต้องโหลดกราฟ/QR generator ให้ช้า)
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Sales = lazy(() => import('./pages/admin/Sales'))
const Finance = lazy(() => import('./pages/admin/Finance'))
const MenuManage = lazy(() => import('./pages/admin/MenuManage'))
const Tables = lazy(() => import('./pages/admin/Tables'))

const lazyPage = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>
const admin = (el) => <RequireAdmin>{lazyPage(el)}</RequireAdmin>

// เปลี่ยนหน้าแล้วเลื่อนขึ้นบนสุดเสมอ
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const { session } = useTableSession()
  const isStaffArea = location.pathname.startsWith('/admin') || location.pathname === '/login'
  const showBottomNav = !!session && !isAdmin && !isStaffArea

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <OfflineBanner />
      <Navbar />
      <main className={`flex-1 ${showBottomNav ? 'pb-nav md:pb-0' : ''}`}>
        {/* เฟดเข้าอย่างเดียว ไม่รอแอนิเมชันออก → เปลี่ยนหน้าได้ทันที */}
        <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/order" element={<Menu />} />
            <Route path="/checkout" element={<Cart />} />
            <Route path="/bill" element={<MyBill />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/t/:token" element={<TableEntry />} />
            <Route path="/login" element={lazyPage(<Login />)} />

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={admin(<Dashboard />)} />
            <Route path="/admin/sales" element={admin(<Sales />)} />
            <Route path="/admin/finance" element={admin(<Finance />)} />
            <Route path="/admin/menu" element={admin(<MenuManage />)} />
            <Route path="/admin/tables" element={admin(<Tables />)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </main>
      <Footer />
      {showBottomNav && <BottomNav />}
    </div>
  )
}
