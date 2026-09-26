import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'

// แสดงเมื่อลูกค้ายังไม่ได้สแกน QR ที่โต๊ะ
export default function ScanNotice({ compact = false }) {
  if (compact) {
    return (
      <div className="callout callout-info">
        <Icon name="scan" size={20} className="mt-0.5" />
        <span>
          <b>สแกน QR Code ที่โต๊ะ</b> เพื่อเริ่มสั่งอาหาร — ตอนนี้ดูเมนูและใส่ตะกร้าไว้ก่อนได้
        </span>
      </div>
    )
  }
  return (
    <EmptyState
      icon="scan"
      title="สแกน QR ที่โต๊ะก่อนนะ"
      description="ใช้กล้องมือถือสแกน QR Code ที่ติดอยู่บนโต๊ะ ระบบจะรู้ว่าคุณนั่งโต๊ะไหน หากไม่พบ QR กรุณาแจ้งพนักงาน"
    />
  )
}
