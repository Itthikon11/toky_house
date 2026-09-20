import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/Hero'
import { getMenu } from '../lib/data'
import { useApp } from '../context/AppContext'

export default function Home() {
  const [menu, setMenu] = useState([])
  const { isAdmin } = useApp()

  useEffect(() => {
    getMenu().then((m) => setMenu(m.filter((x) => x.available).slice(0, 4)))
  }, [])

  return (
    <>
      <Hero />

      {/* แถบจุดเด่น */}
      <section className="bg-sky-gradient py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 md:grid-cols-4">
          {[
            { icon: '🥞', t: 'สดใหม่ทุกออเดอร์', s: 'ทำสด ๆ หน้าร้าน' },
            { icon: '⚡', t: 'สแกน QR สั่งได้เลย', s: 'ไม่ต้องรอพนักงาน' },
            { icon: '🎉', t: 'รับจัดงาน', s: 'เบรก บูธ งานเลี้ยง' },
            { icon: '💛', t: 'อร่อยทุกคำ', s: 'กรอบนอก นุ่มใน' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card p-5 text-center"
            >
              <div className="text-4xl">{c.icon}</div>
              <div className="mt-2 font-bold">{c.t}</div>
              <div className="text-sm text-black/50">{c.s}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* เมนูแนะนำ */}
      {!isAdmin && (
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-4xl md:text-5xl">เมนูแนะนำ</h2>
              <Link to="/order" className="font-semibold text-black/60 hover:text-black">
                ดูทั้งหมด ›
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {menu.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6 }}
                  className="card overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-1 font-bold">{m.name}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-display text-xl">{m.price}฿</span>
                      <span className="pill bg-brand-sky text-xs">{m.filling}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
