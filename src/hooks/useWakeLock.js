import { useEffect } from 'react'

// กันหน้าจอดับขณะเปิดหน้านี้ทิ้งไว้ (แท็บเล็ต/คอมที่เคาน์เตอร์) — เบราว์เซอร์ที่ไม่รองรับจะข้ามไปเฉย ๆ
export function useWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return undefined
    let lock = null
    let alive = true
    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (!alive) lock.release().catch(() => {})
      } catch {
        /* เช่น แบตเตอรี่ต่ำ หรือไม่ได้รับอนุญาต */
      }
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}
