import { MotionConfig } from 'framer-motion'
import { ToastProvider } from '../components/ui/Toast'
import { AuthProvider } from './AuthContext'
import { TableSessionProvider } from './TableSessionContext'
import { CartProvider } from './CartContext'
import { AdminLiveProvider } from '../components/admin/AdminLiveProvider'
import { CallStaffProvider } from '../components/customer/CallStaffProvider'

// ลำดับสำคัญ: AdminLive ต้องอยู่ใน Auth + Toast, CallStaff ต้องอยู่ใน TableSession + Toast
export default function AppProviders({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <TableSessionProvider>
            <CartProvider>
              <CallStaffProvider>
                <AdminLiveProvider>{children}</AdminLiveProvider>
              </CallStaffProvider>
            </CartProvider>
          </TableSessionProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  )
}
