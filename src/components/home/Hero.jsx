import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useTableSession } from '../../context/TableSessionContext'

const COMPOSITE = '/images/Gemini_Generated_Image_zijwixzijwixzijw.jpg'

export default function Hero() {
  const { isAdmin } = useAuth()
  const { session } = useTableSession()
  return (
    // พื้นหลังตั้งเป็นสีเดียวกับพื้นของรูป (#f6f6f6) เพื่อให้รูปกลืนเป็นเนื้อเดียว ไม่เห็นขอบกล่อง
    <section className="relative overflow-hidden bg-[#f6f6f6]">
      {/* รูป composite เต็มด้านขวา (เดสก์ท็อป) */}
      <motion.img
        src={COMPOSITE}
        alt="ขนมโตเกียว TOKYO HOUSE"
        draggable={false}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-auto max-w-none select-none object-cover object-left lg:block"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-4 lg:gap-8 lg:py-20">
        {/* ซ้าย: ข้อความ */}
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl md:text-5xl lg:text-8xl">
            SWEET & <span className="text-brand-yellow">CRISPY</span>
          </h1>
          <h2 className="mt-2 font-display text-3xl lg:text-5xl">
            <span className="text-brand-yellow">OUR FAVORITE</span> TOKYO TREATS
          </h2>
          <p className="mt-5 font-bold uppercase tracking-wide text-gray-700 md:text-sm lg:text-base">
            Crispy outside, soft inside. Perfect for any time of the day!
          </p>
          <p className="mt-2 text-lg font-semibold md:text-base lg:text-lg">
            รับจัดเบรก จัดบูธ งานแต่ง งานเลี้ยง
          </p>

          <Link
            to={isAdmin ? '/admin/dashboard' : '/order'}
            className="btn btn-primary btn-lg mt-7"
          >
            {isAdmin ? 'ไปแดชบอร์ด' : session ? `สั่งอาหาร · ${session.label}` : 'ดูเมนู'}
            <Icon name="chevronRight" size={22} />
          </Link>

          <div className="mt-8 flex items-center gap-4 text-gray-600">
            <span className="h-[0.125rem] w-16 bg-black/40" />
            <span className="text-xl tracking-[0.3em]">東京ハウス</span>
            <span className="h-[0.125rem] w-16 bg-black/40" />
          </div>
        </motion.div>

        {/* คอลัมน์ขวา: เดสก์ท็อปเว้นไว้ให้รูปเต็มด้านขวา / แท็บเล็ตแนวตั้งครอปเฉพาะส่วนขนมมาไว้ข้างข้อความ / มือถือไม่แสดงรูป */}
        <div className="relative -mr-4 hidden self-stretch md:block lg:hidden">
          <motion.img
            src={COMPOSITE}
            alt="ขนมโตเกียว TOKYO HOUSE"
            draggable={false}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-right"
          />
        </div>
      </div>
    </section>
  )
}
