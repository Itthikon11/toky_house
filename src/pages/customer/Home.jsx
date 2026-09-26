import { motion } from 'framer-motion'
import Hero from '../../components/home/Hero'
import MenuCard, { MenuCardSkeleton } from '../../components/customer/MenuCard'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { usePageTitle } from '../../components/ui/PageHeader'
import { api } from '../../services/api'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useAuth } from '../../context/AuthContext'

const HIGHLIGHTS = [
  { icon: 'flame', t: 'สดใหม่ทุกออเดอร์', s: 'ทำสด ๆ หน้าร้าน' },
  { icon: 'scan', t: 'สแกน QR สั่งได้เลย', s: 'สั่งเพิ่มกี่รอบก็รวมบิลเดียว' },
  { icon: 'hand', t: 'กดเรียกพนักงานได้', s: 'ชำระเงินกับพนักงานที่โต๊ะ' },
  { icon: 'sparkles', t: 'รับจัดงาน', s: 'เบรก บูธ งานเลี้ยง' },
]

// 3 ขั้นตอนการสั่ง — ให้ลูกค้าใหม่เข้าใจทันที
const STEPS = [
  { icon: 'scan', t: 'สแกน QR ที่โต๊ะ', s: 'ใช้กล้องมือถือได้เลย ไม่ต้องลงแอป' },
  { icon: 'bag', t: 'เลือกเมนู แล้วกดยืนยัน', s: 'สั่งเพิ่มได้ทุกเมื่อ รวมเป็นบิลเดียว' },
  { icon: 'receipt', t: 'กด “ขอชำระเงิน”', s: 'พนักงานมาคิดเงินที่โต๊ะ' },
]

export default function Home() {
  usePageTitle('ขนมโตเกียว')
  const { data, loading } = useLiveQuery(api.getMenu)
  const menu = (data || []).filter((x) => x.available).slice(0, 4)
  const { isAdmin } = useAuth()

  return (
    <>
      <Hero />

      <section className="bg-sky-gradient py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-4">
          {HIGHLIGHTS.map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card p-4 text-center sm:p-5"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-yellow">
                <Icon name={c.icon} size={24} />
              </span>
              <div className="mt-3 font-bold leading-snug">{c.t}</div>
              <div className="mt-0.5 text-sm text-subtle">{c.s}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {!isAdmin && (
        <>
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4">
              <h2 className="font-display text-3xl md:text-4xl">สั่งง่าย ๆ 3 ขั้นตอน</h2>
              <ol className="mt-5 grid gap-3 md:grid-cols-3">
                {STEPS.map((s, i) => (
                  <li key={s.t} className="card-flat flex items-center gap-4 p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-ink font-display text-xl text-white">
                      {i + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <Icon name={s.icon} size={18} /> {s.t}
                      </div>
                      <div className="text-sm text-subtle">{s.s}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="pb-14">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-3xl md:text-4xl">เมนูแนะนำ</h2>
                <Button to="/order" variant="ghost" size="sm" iconRight="chevronRight">
                  ดูทั้งหมด
                </Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {loading && !data
                  ? Array.from({ length: 4 }, (_, i) => <MenuCardSkeleton key={i} />)
                  : menu.map((m) => <MenuCard key={m.id} item={m} />)}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
