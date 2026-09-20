import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

const floaters = [
  { src: '/images/products/S__11141136_0.jpg', cls: 'top-2 right-40 h-28 w-28 md:h-40 md:w-40', delay: 0 },
  { src: '/images/products/S__11141155_0.jpg', cls: 'top-24 right-2 h-32 w-32 md:h-52 md:w-52', delay: 0.4 },
  { src: '/images/products/S__11141156_0.jpg', cls: 'bottom-6 right-48 h-36 w-36 md:h-56 md:w-56', delay: 0.8 },
  { src: '/images/products/S__11141154_0.jpg', cls: 'bottom-2 right-4 h-20 w-20 md:h-28 md:w-28', delay: 1.2 },
]

export default function Hero() {
  const { isAdmin } = useApp()
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-16">
        {/* ซ้าย: ข้อความ */}
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl lg:text-8xl">
            SWEET & <span className="text-brand-yellow">CRISPY</span>
          </h1>
          <h2 className="mt-2 font-display text-3xl md:text-5xl">
            <span className="text-brand-yellow">OUR FAVORITE</span> TOKYO TREATS
          </h2>
          <p className="mt-5 font-bold uppercase tracking-wide text-black/70">
            Crispy outside, soft inside. Perfect for any time of the day!
          </p>
          <p className="mt-2 text-lg font-semibold">
            รับจัดเบรก จัดบูธ งานแต่ง งานเลี้ยง
          </p>

          <Link
            to={isAdmin ? '/admin/dashboard' : '/order'}
            className="btn-yellow mt-7 text-lg"
          >
            {isAdmin ? 'ไปแดชบอร์ด' : 'สั่งอาหาร'}
            <span>›</span>
          </Link>

          <div className="mt-8 flex items-center gap-4 text-black/60">
            <span className="h-[2px] w-16 bg-black/40" />
            <span className="text-xl tracking-[0.3em]">東京ハウス</span>
            <span className="h-[2px] w-16 bg-black/40" />
          </div>
        </motion.div>

        {/* ขวา: รูปลอย */}
        <div className="relative h-[320px] md:h-[460px]">
          {floaters.map((f, i) => (
            <motion.img
              key={i}
              src={f.src}
              alt=""
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
              className={`absolute rounded-full object-cover shadow-card ring-4 ring-white ${f.cls} animate-float`}
              style={{ animationDelay: `${f.delay}s` }}
            />
          ))}
          {/* วงกลมตกแต่งเบลอ */}
          <div className="absolute right-24 top-16 -z-10 h-64 w-64 rounded-full bg-brand-yellow/30 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
