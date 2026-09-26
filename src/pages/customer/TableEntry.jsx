import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTableSession } from '../../context/TableSessionContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../components/ui/Toast'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/Spinner'
import { usePageTitle } from '../../components/ui/PageHeader'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'
import { isValidTableToken } from '../../lib/security'

// ลูกค้าสแกน QR ที่โต๊ะ → /t/<token> → ตรวจ token กับฐานข้อมูล → เข้าหน้าเมนูในนามโต๊ะนั้น
export default function TableEntry() {
  usePageTitle('กำลังเข้าโต๊ะ')
  const { token } = useParams()
  const { session, startSession } = useTableSession()
  const { clearCart } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    if (!isValidTableToken(token)) {
      setError(toThaiMessage({ code: 'INVALID_TABLE' }))
      return undefined
    }
    api
      .resolveTable(token)
      .then((table) => {
        if (!alive) return
        if (session && session.token !== token) clearCart() // ย้ายโต๊ะ → ล้างตะกร้าเดิม
        startSession(token, table)
        toast(`ยินดีต้อนรับ! ${table.label} — เลือกเมนูได้เลย`, { type: 'success' })
        navigate('/order', { replace: true })
      })
      .catch((e) => alive && setError(toThaiMessage(e)))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="page grid place-items-center">
      <div className="w-full max-w-sm">
        {error ? (
          <EmptyState
            tone="danger"
            icon="qr"
            title="ใช้ QR นี้ไม่ได้"
            description={error}
            action={<Button to="/" variant="secondary" icon="home">กลับหน้าแรก</Button>}
          />
        ) : (
          <PageLoader label="กำลังตรวจสอบโต๊ะ…" />
        )}
      </div>
    </div>
  )
}
