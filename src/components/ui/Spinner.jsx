export default function Spinner({ size = 20, className = '' }) {
  return (
    <span
      role="status"
      aria-label="กำลังโหลด"
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      className={`inline-block shrink-0 animate-spin rounded-full border-[0.1875rem] border-current border-t-transparent opacity-70 ${className}`}
    />
  )
}

export function PageLoader({ label = 'กำลังโหลด…' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-subtle">
        <Spinner size={32} className="text-brand-yellowDark" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}
