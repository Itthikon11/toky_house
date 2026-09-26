import { motion } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import Icon from '../../components/ui/Icon'

const CHANNELS = [
  { glyph: 'f', label: 'Facebook', value: 'TOKYO HOUSE', href: 'https://facebook.com', color: 'bg-blue-600', external: true },
  { icon: 'music', label: 'TikTok', value: '@tokyohouse', href: 'https://tiktok.com', color: 'bg-black', external: true },
  { icon: 'phone', label: 'โทรศัพท์', value: '098-532-9350', href: 'tel:0985329350', color: 'bg-green-600' },
  { icon: 'mail', label: 'อีเมล', value: 'hello@tokyohouse.co', href: 'mailto:hello@tokyohouse.co', color: 'bg-brand-ink' },
]

export default function Contact() {
  return (
    <div className="page">
      <div className="container-app max-w-4xl">
        <PageHeader title="ช่องทางติดต่อ" subtitle="รับจัดเบรก จัดบูธ งานแต่ง งานเลี้ยง — ทักมาได้เลย!" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {CHANNELS.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card flex min-h-[80px] items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-glow sm:p-5"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl font-bold text-white ${c.color}`}>
                {c.icon ? <Icon name={c.icon} size={24} /> : c.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-subtle">{c.label}</div>
                <div className="truncate text-lg font-bold">{c.value}</div>
              </div>
              <Icon name={c.external ? 'external' : 'chevronRight'} size={20} className="text-gray-400" />
            </motion.a>
          ))}
        </div>

        <div className="card mt-5 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 font-bold">
            <Icon name="map" size={20} /> แผนที่ร้าน
          </div>
          <iframe title="แผนที่ร้าน TOKYO HOUSE" className="h-72 w-full" loading="lazy" src="https://www.google.com/maps?q=Bangkok&output=embed" />
        </div>
      </div>
    </div>
  )
}
