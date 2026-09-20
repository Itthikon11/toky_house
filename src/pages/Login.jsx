import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { loginAdmin, isAdmin } = useApp()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    if (loginAdmin(pw)) {
      navigate('/admin/dashboard')
    } else {
      setErr(true)
      setTimeout(() => setErr(false), 1200)
    }
  }

  return (
    <div className="bg-sky-gradient grid min-h-[80vh] place-items-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-sm p-8 text-center"
      >
        <img
          src="/images/LOGO.jpg"
          alt="logo"
          className="mx-auto h-16 w-16 rounded-full ring-4 ring-brand-yellow"
        />
        <h1 className="mt-4 font-display text-3xl">เข้าสู่ระบบแอดมิน</h1>
        <p className="text-sm text-black/50">
          {isAdmin ? 'คุณเข้าสู่ระบบอยู่แล้ว' : 'สำหรับผู้ดูแลร้านเท่านั้น'}
        </p>

        <motion.input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="รหัสผ่าน"
          animate={err ? { x: [-8, 8, -6, 6, 0] } : {}}
          className={`mt-6 w-full rounded-2xl border-2 px-4 py-3 outline-none transition ${
            err ? 'border-red-400' : 'border-black/10 focus:border-brand-yellow'
          }`}
        />
        {err && <p className="mt-2 text-sm text-red-500">รหัสผ่านไม่ถูกต้อง</p>}

        <button type="submit" className="btn-yellow mt-5 w-full justify-center">
          เข้าสู่ระบบ
        </button>
        <p className="mt-4 text-xs text-black/40">
          (ค่าเริ่มต้น: admin1234 — เปลี่ยนได้ที่ไฟล์ .env)
        </p>
      </motion.form>
    </div>
  )
}
