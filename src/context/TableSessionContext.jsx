import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LIMITS, STORAGE_KEYS } from '../config/constants'
import { readJSON, remove, writeJSON } from '../lib/storage'
import { isValidTableToken } from '../lib/security'

// โต๊ะที่ลูกค้ากำลังนั่ง ได้มาจากการสแกน QR เท่านั้น (/t/:token)
const TableSessionContext = createContext(null)
export const useTableSession = () => useContext(TableSessionContext)

const MAX_AGE_MS = LIMITS.TABLE_SESSION_HOURS * 3600 * 1000

function loadSession() {
  const s = readJSON(STORAGE_KEYS.TABLE_SESSION)
  if (!s || !isValidTableToken(s.token) || Date.now() - s.startedAt > MAX_AGE_MS) return null
  return s
}

export function TableSessionProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  useEffect(() => {
    if (session) writeJSON(STORAGE_KEYS.TABLE_SESSION, session)
    else remove(STORAGE_KEYS.TABLE_SESSION)
  }, [session])

  // หมดอายุระหว่างเปิดหน้าค้างไว้
  useEffect(() => {
    if (!session) return
    const left = session.startedAt + MAX_AGE_MS - Date.now()
    const id = setTimeout(() => setSession(null), Math.max(0, left))
    return () => clearTimeout(id)
  }, [session])

  const startSession = useCallback((token, table) => {
    setSession((prev) => ({
      token,
      tableId: table.id,
      label: table.label,
      isTakeaway: !!table.is_takeaway,
      startedAt: Date.now(),
      // สั่งกลับบ้าน: จำบิลเดิมไว้ ถ้ายังสแกน QR เดิม
      billId: prev?.token === token ? prev.billId || null : null,
    }))
  }, [])

  const setBillId = useCallback(
    (billId) => setSession((prev) => (prev ? { ...prev, billId } : prev)),
    [],
  )
  const endSession = useCallback(() => setSession(null), [])

  const value = useMemo(
    () => ({ session, hasTable: !!session, startSession, setBillId, endSession }),
    [session, startSession, setBillId, endSession],
  )

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>
}
