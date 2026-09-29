import { useState } from 'react'
import Icon from '../ui/Icon'
import QtyStepper from '../ui/QtyStepper'
import { useCart } from '../../context/CartContext'
import { baht } from '../../lib/format'

// การ์ดเมนู: กด + ครั้งแรกแล้วเปลี่ยนเป็นตัวปรับจำนวนบนการ์ดเลย (ไม่ต้องเข้าไปแก้ในตะกร้า)
export default function MenuCard({ item }) {
  const { cart, addToCart, setQty } = useCart()
  const [imgFailed, setImgFailed] = useState(false)
  const inCart = cart.find((c) => c.id === item.id)
  const soldOut = !item.available

  return (
    <article
      className={`card flex flex-col overflow-hidden transition ${inCart ? 'ring-2 ring-brand-yellowDark' : ''} ${
        soldOut ? 'opacity-60' : ''
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {imgFailed || !item.image ? (
          <div className="grid h-full w-full place-items-center text-gray-400">
            <Icon name="noImage" size={36} />
          </div>
        ) : (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className={`h-full w-full object-cover ${soldOut ? 'grayscale' : ''}`}
          />
        )}
        <span className="badge absolute left-2 top-2 bg-white/90 text-gray-700">{item.code}</span>
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-white/40">
            <span className="badge badge-neutral px-3 py-1.5 text-sm">หมดแล้ว</span>
          </span>
        )}
        {inCart && (
          <span className="badge badge-brand absolute right-2 top-2 shadow-soft">
            <Icon name="bag" size={14} /> {inCart.qty}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-bold leading-snug">{item.name}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {item.filling && <span className="badge badge-neutral">{item.filling}</span>}
          {item.category && item.category !== 'ขนมโตเกียว' && <span className="badge badge-info">{item.category}</span>}
        </div>

        <div className="mt-auto flex min-h-[3rem] flex-wrap items-center justify-between gap-2 pt-3">
          <span className="font-num text-xl sm:text-2xl">{baht(item.price)}</span>
          {soldOut ? null : inCart ? (
            <QtyStepper value={inCart.qty} onChange={(q) => setQty(item.id, q)} size="sm" label={item.name} />
          ) : (
            <button
              type="button"
              onClick={() => addToCart(item)}
              aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
              className="grid h-11 w-11 place-items-center rounded-full bg-brand-yellow shadow-soft transition hover:bg-brand-yellowDark active:scale-90"
            >
              <Icon name="plus" size={22} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function MenuCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton mt-4 h-8 w-1/3" />
      </div>
    </div>
  )
}
