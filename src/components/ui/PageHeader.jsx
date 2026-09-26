import { useEffect } from 'react'

// หัวข้อหน้า + ตั้งชื่อแท็บเบราว์เซอร์ให้ตรงกับหน้า
export default function PageHeader({ title, subtitle, actions, docTitle, className = '' }) {
  usePageTitle(docTitle || title)
  return (
    <div className={`mb-5 flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function usePageTitle(title) {
  useEffect(() => {
    if (typeof title === 'string' && title) document.title = `${title} | TOKYO HOUSE`
  }, [title])
}
