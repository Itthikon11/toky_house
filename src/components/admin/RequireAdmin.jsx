import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../ui/Spinner'

export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader label="กำลังตรวจสอบสิทธิ์…" />
  }
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
