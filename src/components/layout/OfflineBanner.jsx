import { useEffect, useState } from 'react'
import Icon from '../ui/Icon'

// แจ้งเมื่ออินเทอร์เน็ตหลุด (เช่น Wi-Fi ร้านไม่เสถียร) — ลูกค้าจะได้ไม่กดสั่งซ้ำ
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (online) return null
  return (
    <div role="alert" className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white">
      <Icon name="offline" size={18} />
      ไม่มีอินเทอร์เน็ต — ออเดอร์จะยังไม่ถูกส่งจนกว่าจะเชื่อมต่อได้
    </div>
  )
}
