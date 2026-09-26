import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { usePageTitle } from '../components/ui/PageHeader'

export default function NotFound() {
  usePageTitle('ไม่พบหน้า')
  return (
    <div className="page grid place-items-center">
      <EmptyState
        className="w-full max-w-sm"
        icon="search"
        title="ไม่พบหน้านี้ (404)"
        description="ถ้าสแกน QR มา กรุณาสแกนใหม่อีกครั้ง หรือแจ้งพนักงาน"
        action={<Button to="/" icon="home">กลับหน้าแรก</Button>}
      />
    </div>
  )
}
