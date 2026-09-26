import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeLive } from '../services/api'

/**
 * ดึงข้อมูลแล้วอัปเดตอัตโนมัติ
 * - live: true → ฟัง Realtime (พนักงานเท่านั้น)
 * - interval → ดึงซ้ำเป็นระยะ (หยุดเมื่อแท็บไม่ได้เปิดดู เพื่อประหยัดโควต้า)
 */
export function useLiveQuery(fetcher, { enabled = true, live = false, interval = 0, deps = [] } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const reqId = useRef(0)

  const run = useCallback(async () => {
    const id = ++reqId.current
    try {
      const data = await fetcherRef.current()
      if (id === reqId.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === reqId.current) setState((s) => ({ ...s, error, loading: false }))
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false })
      return undefined
    }
    setState((s) => ({ ...s, loading: true }))
    run()

    const cleanups = []
    if (live) cleanups.push(subscribeLive(run))
    if (interval) {
      const t = setInterval(() => {
        if (document.visibilityState === 'visible') run()
      }, interval)
      cleanups.push(() => clearInterval(t))
    }
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisible))

    return () => {
      reqId.current++
      cleanups.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, live, interval, run, ...deps])

  return { ...state, refresh: run }
}
