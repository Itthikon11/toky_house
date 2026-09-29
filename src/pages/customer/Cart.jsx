import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useTableSession } from '../../context/TableSessionContext'
import { useToast } from '../../components/ui/Toast'
import { useCallStaff } from '../../components/customer/CallStaffProvider'
import ScanNotice from '../../components/customer/ScanNotice'
import PageHeader, { usePageTitle } from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import QtyStepper from '../../components/ui/QtyStepper'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { randomToken } from '../../lib/security'
import { baht } from '../../lib/format'
import { LIMITS } from '../../config/constants'

export default function Cart() {
  const { cart, setQty, removeItem, cartTotal, cartCount, clearCart } = useCart()
  const { session, setBillId } = useTableSession()
  const { toast } = useToast()
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)
  // key เดียวต่อการกดยืนยัน 1 ครั้ง → กดซ้ำ/เน็ตหลุดแล้วส่งใหม่ จะไม่เกิดออเดอร์ซ้ำ
  const clientKey = useRef(randomToken(16))

  const handlePlace = async () => {
    if (!cart.length || !session || placing) return
    setPlacing(true)
    try {
      const result = await api.placeOrder({
        token: session.token,
        items: cart.map((c) => ({ menu_id: c.id, qty: c.qty })),
        note,
        billId: session.isTakeaway ? session.billId : null,
        clientKey: clientKey.current,
      })
      if (session.isTakeaway) setBillId(result.bill_id)
      clientKey.current = randomToken(16)
      setPlaced(result)
      setNote('')
      clearCart()
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error', duration: 5000 })
    } finally {
      setPlacing(false)
    }
  }

  if (placed) return <OrderPlaced result={placed} />

  return (
    <div className="page">
      <div className="container-app max-w-5xl">
        <PageHeader
          title="ตะกร้าของฉัน"
          subtitle={session ? `${session.label} · ${cartCount} ชิ้น` : `${cartCount} ชิ้น`}
        />

        {!cart.length ? (
          <EmptyState
            icon="bag"
            title="ยังไม่มีสินค้าในตะกร้า"
            description="เลือกเมนูที่ชอบ แล้วกด + เพื่อใส่ตะกร้า"
            action={<Button to="/order" icon="food">เลือกเมนู</Button>}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_23.75rem] lg:items-start">
            {/* รายการ */}
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {cart.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="card flex items-center gap-3 p-3"
                  >
                    <img src={c.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover sm:h-20 sm:w-20" />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 font-bold leading-snug">{c.name}</div>
                      <div className="text-sm text-subtle">{baht(c.price)} / ชิ้น</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QtyStepper value={c.qty} onChange={(q) => setQty(c.id, q)} size="sm" label={c.name} />
                        <span className="font-num text-lg">{baht(c.price * c.qty)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(c.id)}
                      aria-label={`ลบ ${c.name}`}
                      className="hidden h-10 w-10 shrink-0 place-items-center self-start rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600 sm:grid"
                    >
                      <Icon name="close" size={20} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button to="/order" variant="ghost" icon="plus" size="sm">
                เลือกเมนูเพิ่ม
              </Button>
            </div>

            {/* สรุป + ยืนยัน */}
            <div className="card space-y-4 p-5 lg:sticky lg:top-[calc(theme(spacing.header)+16px)]">
              <div>
                <label className="field-label" htmlFor="order-note">
                  หมายเหตุถึงร้าน <span className="font-normal text-subtle">(ถ้ามี)</span>
                </label>
                <textarea
                  id="order-note"
                  value={note}
                  maxLength={LIMITS.MAX_NOTE_LENGTH}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="เช่น ไม่ใส่ผัก, แยกจาน"
                  className="input resize-none"
                />
                <div className="mt-1 text-right text-xs text-subtle">
                  {note.length}/{LIMITS.MAX_NOTE_LENGTH}
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-black/5 pt-4">
                <span className="font-semibold">รวมรอบนี้</span>
                <span className="font-num text-3xl">{baht(cartTotal)}</span>
              </div>

              {session ? (
                <>
                  <Button block size="lg" loading={placing} onClick={handlePlace} icon="check">
                    {placing ? 'กำลังส่งออเดอร์…' : `ยืนยันสั่ง ${baht(cartTotal)}`}
                  </Button>
                  <div className="callout callout-info">
                    <Icon name="info" size={18} className="mt-0.5" />
                    <span>
                      ยังไม่ต้องจ่ายตอนนี้ — ออเดอร์จะรวมเข้าบิลของ <b>{session.label}</b> แล้วชำระกับพนักงานเมื่ออิ่มแล้ว
                    </span>
                  </div>
                </>
              ) : (
                <ScanNotice compact />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// หน้าสั่งสำเร็จ
function OrderPlaced({ result }) {
  const { openSheet } = useCallStaff()
  usePageTitle('ส่งออเดอร์แล้ว')
  const merged = result.round > 1

  return (
    <div className="page grid place-items-center">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-md p-6 text-center sm:p-8">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white"
        >
          <Icon name="check" size={34} strokeWidth={3} />
        </motion.span>
        <h1 className="mt-4 font-display text-3xl">ส่งออเดอร์แล้ว!</h1>
        <p className="text-muted">
          {result.table_label} · รอบที่ {result.round} · {baht(result.order_total)}
        </p>
        <p className="mt-1 text-sm text-subtle">ครัวได้รับออเดอร์แล้ว กำลังเตรียมให้</p>

        <div className="mt-6 rounded-3xl bg-brand-sky/70 p-5">
          <span className={`badge ${merged ? 'badge-brand' : 'badge-info'}`}>
            <Icon name="receipt" size={14} />
            {merged ? 'รวมเข้าบิลเดิมของโต๊ะแล้ว' : 'เปิดบิลของโต๊ะแล้ว'}
          </span>
          <p className="mt-3 text-sm text-muted">ยอดรวมทั้งบิล (ยังไม่ชำระ)</p>
          <p className="font-num text-4xl">{baht(result.bill_total)}</p>
          <p className="mt-2 text-sm text-muted">สั่งเพิ่มกี่รอบก็รวมเป็นบิลเดียว</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button to="/order" variant="primary" icon="plus">
            สั่งเพิ่ม
          </Button>
          <Button to="/bill" variant="secondary" icon="receipt">
            ดูบิล
          </Button>
          <Button variant="dark" icon="hand" className="col-span-2" onClick={openSheet}>
            เรียกพนักงาน / ขอชำระเงิน
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
