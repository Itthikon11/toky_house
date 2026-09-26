import Icon from './Icon'
import { LIMITS } from '../../config/constants'

// ปุ่ม − จำนวน + (ปุ่มใหญ่พอให้กดด้วยนิ้วโป้ง)
export default function QtyStepper({ value, onChange, max = LIMITS.MAX_QTY_PER_LINE, size = 'md', label = '' }) {
  const box = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-black/10">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={value <= 1 ? `นำ${label}ออก` : `ลดจำนวน${label}`}
        className={`grid ${box} place-items-center rounded-full bg-gray-100 transition hover:bg-gray-200 active:scale-90`}
      >
        <Icon name={value <= 1 ? 'trash' : 'minus'} size={18} />
      </button>
      <span className="min-w-[2ch] text-center text-base font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`เพิ่มจำนวน${label}`}
        className={`grid ${box} place-items-center rounded-full bg-brand-yellow transition hover:bg-brand-yellowDark active:scale-90 disabled:opacity-40`}
      >
        <Icon name="plus" size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}
