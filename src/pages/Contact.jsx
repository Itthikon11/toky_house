import { motion } from 'framer-motion'

export default function Contact() {
  const items = [
    { icon: 'f', label: 'Facebook', value: 'TOKYO HOUSE', href: 'https://facebook.com', color: 'bg-blue-600' },
    { icon: '♪', label: 'TikTok', value: '@tokyohouse', href: 'https://tiktok.com', color: 'bg-black' },
    { icon: '☎', label: 'โทรศัพท์', value: '098-5329-350', href: 'tel:0985329350', color: 'bg-green-500' },
    { icon: '✉', label: 'อีเมล', value: 'hello@tokyohouse.co', href: 'mailto:hello@tokyohouse.co', color: 'bg-brand-yellowDark' },
  ]
  return (
    <div className="bg-sky-gradient min-h-[80vh] px-4 py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-5xl">ช่องทางติดต่อ</h1>
        <p className="mt-2 text-black/60">
          รับจัดเบรก จัดบูธ งานแต่ง งานเลี้ยง — ทักมาได้เลย!
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((c, i) => (
            <motion.a
              key={i}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="card flex items-center gap-4 p-6 text-left"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl text-white ${c.color}`}
              >
                {c.icon}
              </span>
              <div>
                <div className="text-sm text-black/50">{c.label}</div>
                <div className="text-lg font-bold">{c.value}</div>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="card mt-6 overflow-hidden">
          <iframe
            title="แผนที่ร้าน"
            className="h-72 w-full"
            loading="lazy"
            src="https://www.google.com/maps?q=Bangkok&output=embed"
          />
        </div>
      </div>
    </div>
  )
}
