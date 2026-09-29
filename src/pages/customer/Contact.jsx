import { motion } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import Icon from '../../components/ui/Icon'
import { SHOP } from '../../config/constants'

const CHANNELS = [
  { glyph: 'f', label: 'Facebook', value: 'TOKYO HOUSE', href: SHOP.facebook, color: 'bg-blue-600', external: true },
  { icon: 'music', label: 'TikTok', value: SHOP.tiktokHandle, href: SHOP.tiktok, color: 'bg-black', external: true },
  { icon: 'chat', label: 'LINE', value: SHOP.lineId, href: SHOP.line, color: 'bg-[#06C755]', external: true },
  { icon: 'phone', label: 'โทรศัพท์', value: SHOP.phone, href: `tel:${SHOP.phone.replace(/-/g, '')}`, color: 'bg-green-600' },
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
              className="card flex min-h-[5rem] items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-glow sm:p-5"
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
            <a href={SHOP.mapUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex min-h-[2.75rem] items-center gap-1.5 text-sm font-semibold text-subtle transition hover:text-brand-ink">
              เปิดใน Google Maps <Icon name="external" size={16} />
            </a>
          </div>
          <iframe
            title="แผนที่ร้าน TOKYO HOUSE"
            className="h-72 w-full"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(SHOP.mapQuery)}&output=embed`}
          />
        </div>
      </div>
    </div>
  )
}
