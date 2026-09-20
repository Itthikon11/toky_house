import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { useApp } from '../context/AppContext'
import { createOrder } from '../lib/data'

export default function Checkout() {
  const { cart, setQty, cartTotal, clearCart, tableLabel } = useApp()
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)
  const navigate = useNavigate()

  const handlePlace = async () => {
    if (!cart.length) return
    setPlacing(true)
    try {
      const order = await createOrder({
        table_label: tableLabel,
        is_takeaway: tableLabel === 'สั่งกลับบ้าน',
        items: cart.map((c) => ({
          menu_id: c.id,
          name: c.name,
          price: c.price,
          qty: c.qty,
        })),
        total: cartTotal,
      })
      setPlaced(order)
      clearCart()
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    } finally {
      setPlacing(false)
    }
  }

  // หน้าสำเร็จ + QR ชำระเงิน
  if (placed) {
    const payPayload = `TOKYOHOUSE|order=${placed.id}|amount=${placed.total}`
    return (
      <div className="bg-sky-gradient min-h-[80vh] grid place-items-center px-4 py-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card w-full max-w-md p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-400 text-3xl text-white"
          >
            ✓
          </motion.div>
          <h1 className="mt-4 font-display text-3xl">สั่งอาหารสำเร็จ!</h1>
          <p className="text-black/60">
            ออเดอร์ {placed.id} · ลูกค้า{placed.table_label}
          </p>

          <div className="mt-6 rounded-3xl bg-brand-sky/60 p-6">
            <p className="font-semibold">สแกนเพื่อชำระเงิน (PromptPay)</p>
            <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-4 shadow-soft">
              <QRCodeCanvas value={payPayload} size={180} fgColor="#111" />
            </div>
            <p className="mt-3 font-display text-3xl">{placed.total}฿</p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to="/order" className="btn-yellow flex-1 justify-center">
              สั่งเพิ่ม
            </Link>
            <button
              onClick={() => navigate('/')}
              className="flex-1 rounded-full bg-brand-ink px-6 py-3 font-bold text-white active:scale-95"
            >
              เสร็จสิ้น
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-sky-gradient min-h-[80vh] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl">ตะกร้าของฉัน</h1>
        <p className="text-black/60">ลูกค้า{tableLabel}</p>

        {!cart.length ? (
          <div className="card mt-6 p-12 text-center">
            <div className="text-5xl">🛒</div>
            <p className="mt-3 text-black/60">ยังไม่มีสินค้าในตะกร้า</p>
            <Link to="/order" className="btn-yellow mt-5">
              เลือกเมนู
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              <AnimatePresence>
                {cart.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="card flex items-center gap-4 p-3"
                  >
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-sm text-black/50">{c.price}฿</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(c.id, c.qty - 1)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-brand-sky font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold">{c.qty}</span>
                      <button
                        onClick={() => setQty(c.id, c.qty + 1)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-brand-yellow font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-16 text-right font-display text-lg">
                      {c.price * c.qty}฿
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="card mt-5 p-5">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">รวมทั้งหมด</span>
                <span className="font-display text-3xl">{cartTotal}฿</span>
              </div>
              <button
                onClick={handlePlace}
                disabled={placing}
                className="btn-yellow mt-4 w-full justify-center text-lg disabled:opacity-60"
              >
                {placing ? 'กำลังส่งออเดอร์…' : 'ยืนยันสั่งอาหาร'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
