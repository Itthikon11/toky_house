import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { useApp } from '../context/AppContext'

export default function TableSelect() {
  const { id } = useParams()
  const { setTableLabel, isAdmin } = useApp()
  const navigate = useNavigate()
  const [showQR, setShowQR] = useState(false)

  // ถ้าเข้าจากลิงก์ QR /table/5 -> ตั้งโต๊ะแล้วไปหน้าสั่งอาหาร
  useEffect(() => {
    if (id) {
      const label =
        id === 'takeaway'
          ? 'สั่งกลับบ้าน'
          : `โต๊ะที่ ${String(id).padStart(2, '0')}`
      setTableLabel(label)
      navigate('/order', { replace: true })
    }
  }, [id])

  const tables = Array.from({ length: 12 }, (_, i) => i + 1)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const choose = (n) => {
    setTableLabel(
      n === 'takeaway' ? 'สั่งกลับบ้าน' : `โต๊ะที่ ${String(n).padStart(2, '0')}`,
    )
    navigate('/order')
  }

  return (
    <div className="bg-sky-gradient min-h-[80vh] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl">เลือกโต๊ะของคุณ</h1>
          <p className="text-black/60">แตะหมายเลขโต๊ะเพื่อเริ่มสั่งอาหาร</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {tables.map((n) => (
            <motion.button
              key={n}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => choose(n)}
              className="card grid aspect-square place-items-center font-display text-3xl hover:bg-brand-yellow"
            >
              {String(n).padStart(2, '0')}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => choose('takeaway')}
            className="card col-span-3 grid place-items-center gap-1 py-4 font-bold hover:bg-brand-yellow sm:col-span-4 md:col-span-6"
          >
            <span className="text-3xl">🥡</span>
            สั่งกลับบ้าน
          </motion.button>
        </div>

        {/* แอดมิน: สร้าง QR สำหรับติดโต๊ะ */}
        {isAdmin && (
          <div className="mt-10">
            <button
              onClick={() => setShowQR((v) => !v)}
              className="btn-yellow"
            >
              {showQR ? 'ซ่อน' : 'สร้าง'} QR Code ติดโต๊ะ
            </button>
            {showQR && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {tables.map((n) => (
                  <div key={n} className="card p-4 text-center">
                    <div className="mx-auto w-fit rounded-xl bg-white p-2">
                      <QRCodeCanvas
                        value={`${origin}/table/${n}`}
                        size={120}
                      />
                    </div>
                    <p className="mt-2 font-bold">
                      โต๊ะที่ {String(n).padStart(2, '0')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
