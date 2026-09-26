import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { lockRemainingSec, useAuth } from '../../context/AuthContext'
import { usingDefaultPassword } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { usePageTitle } from '../../components/ui/PageHeader'

export default function Login() {
  usePageTitle('เข้าสู่ระบบพนักงาน')
  const { login, isAdmin, mode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/dashboard'

  if (isAdmin) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      const locked = lockRemainingSec()
      setError(locked ? `ใส่รหัสผิดหลายครั้ง กรุณารอ ${Math.ceil(locked / 60)} นาที` : toThaiMessage(err))
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page grid place-items-center">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-sm p-6 sm:p-8"
        autoComplete="on"
        noValidate
      >
        <div className="text-center">
          <img src="/images/LOGO.jpg" alt="" className="mx-auto h-16 w-16 rounded-full ring-4 ring-brand-yellow" />
          <h1 className="mt-4 font-display text-3xl">เข้าสู่ระบบพนักงาน</h1>
          <p className="text-sm text-subtle">สำหรับเจ้าของร้านและพนักงานเท่านั้น</p>
        </div>

        <div className="mt-6 space-y-3">
          {mode === 'supabase' && (
            <div>
              <label className="field-label" htmlFor="login-email">
                อีเมล
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className={`input ${error ? 'input-error' : ''}`}
              />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="login-password">
              รหัสผ่าน
            </label>
            <motion.input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              animate={error ? { x: [-8, 8, -6, 6, 0] } : {}}
              className={`input ${error ? 'input-error' : ''}`}
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
              <Icon name="warning" size={16} /> {error}
            </p>
          )}
        </div>

        <Button type="submit" block size="lg" loading={busy} icon="lock" className="mt-5">
          {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
        </Button>

        {import.meta.env.DEV && usingDefaultPassword && (
          <p className="mt-4 text-center text-xs text-subtle">(โหมดทดลอง: รหัสเริ่มต้น admin1234 — เปลี่ยนด้วย VITE_ADMIN_PASSWORD_HASH)</p>
        )}
      </motion.form>
    </div>
  )
}
