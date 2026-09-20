import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useApp } from './context/AppContext'

import Home from './pages/Home'
import Order from './pages/Order'
import Contact from './pages/Contact'
import Checkout from './pages/Checkout'
import TableSelect from './pages/TableSelect'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Sales from './pages/admin/Sales'
import MenuManage from './pages/admin/MenuManage'

function RequireAdmin({ children }) {
  const { isAdmin } = useApp()
  if (!isAdmin) return <Navigate to="/login" replace />
  return children
}

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/order" element={<Page><Order /></Page>} />
            <Route path="/contact" element={<Page><Contact /></Page>} />
            <Route path="/checkout" element={<Page><Checkout /></Page>} />
            <Route path="/table" element={<Page><TableSelect /></Page>} />
            <Route path="/table/:id" element={<Page><TableSelect /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route
              path="/admin/dashboard"
              element={<RequireAdmin><Page><Dashboard /></Page></RequireAdmin>}
            />
            <Route
              path="/admin/sales"
              element={<RequireAdmin><Page><Sales /></Page></RequireAdmin>}
            />
            <Route
              path="/admin/menu"
              element={<RequireAdmin><Page><MenuManage /></Page></RequireAdmin>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
