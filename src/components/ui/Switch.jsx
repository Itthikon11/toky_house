// สวิตช์เปิด/ปิด (เข้าถึงได้ด้วยคีย์บอร์ดและ screen reader)
export default function Switch({ checked, onChange, label, onLabel, offLabel, disabled, hideLabelOnMobile = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[44px] items-center gap-2 disabled:opacity-50"
    >
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-green-600' : 'bg-gray-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </span>
      {(onLabel || offLabel) && (
        <span className={`w-16 text-left text-sm font-semibold ${hideLabelOnMobile ? 'hidden sm:inline' : ''} ${checked ? 'text-green-700' : 'text-gray-500'}`}>
          {checked ? onLabel : offLabel}
        </span>
      )}
    </button>
  )
}
