import { createElement } from 'react'
import { ICONS } from '../../lib/icons'

// <Icon name="bell" size={20} /> — ดูรายชื่อไอคอนทั้งหมดที่ src/lib/icons.js
// size เป็นพิกเซลที่ขนาดตัวอักษรปกติ (16px) — แปลงเป็น rem เพื่อขยายตามขนาดจอพร้อมทั้งหน้า
export default function Icon({ name, size = 20, strokeWidth = 2, className = '', label }) {
  const node = ICONS[name]
  if (!node) return null
  return (
    <svg
      width={`${size / 16}rem`}
      height={`${size / 16}rem`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {node.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  )
}
