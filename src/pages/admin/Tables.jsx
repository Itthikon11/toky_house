import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useLiveQuery } from '../../hooks/useLiveQuery'
import { useToast } from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import { api } from '../../services/api'
import { toThaiMessage } from '../../services/errors'

// URL ที่ใส่ใน QR — ตั้ง VITE_PUBLIC_URL เป็นโดเมนจริง เพื่อพิมพ์ QR จากเครื่องไหนก็ได้
const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '')
const isLocalUrl = /localhost|127\.0\.0\.1/.test(PUBLIC_URL)

export default function Tables() {
  const { data, loading, error, refresh } = useLiveQuery(api.listTables)
  const { toast } = useToast()
  const [busy, setBusy] = useState(null)
  const [confirmRotate, setConfirmRotate] = useState(null)
  const tables = data || []

  const run = async (key, fn, msg) => {
    setBusy(key)
    try {
      await fn()
      if (msg) toast(msg, { type: 'success' })
      refresh()
    } catch (e) {
      toast(toThaiMessage(e), { type: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page print:bg-white print:p-0">
      <div className="container-app max-w-6xl">
        <div className="print:hidden">
          <PageHeader
            title="โต๊ะ & QR Code"
            subtitle={data ? `${tables.filter((t) => t.active).length} โต๊ะที่เปิดใช้งาน` : null}
            actions={
              <>
                <Button variant="secondary" size="sm" icon="plus" loading={busy === 'add'} onClick={() => run('add', () => api.createTable(''), 'เพิ่มโต๊ะแล้ว')}>
                  เพิ่มโต๊ะ
                </Button>
                <Button size="sm" icon="print" onClick={() => window.print()} disabled={!tables.length}>
                  พิมพ์ QR ทั้งหมด
                </Button>
              </>
            }
          />

          <div className="mb-5 space-y-2">
            <div className="callout callout-info">
              <Icon name="lock" size={18} className="mt-0.5" />
              <span>
                QR แต่ละโต๊ะมีรหัสลับ — คนที่ไม่ได้อยู่ในร้านเดาเลขโต๊ะเพื่อสั่งแทนไม่ได้ ถ้าสงสัยว่ามีคนถ่ายรูป QR ไปใช้
                ให้กด <b>เปลี่ยนรหัส</b> แล้วพิมพ์ใหม่ (QR เก่าจะใช้ไม่ได้ทันที)
              </span>
            </div>
            {isLocalUrl && (
              <div className="callout callout-danger">
                <Icon name="warning" size={18} className="mt-0.5" />
                <span>
                  <b>ยังไม่ควรพิมพ์:</b> QR ตอนนี้ชี้ไปที่ {PUBLIC_URL} ซึ่งมือถือลูกค้าเปิดไม่ได้ — ตั้งค่า VITE_PUBLIC_URL ในไฟล์ .env เป็นโดเมนจริงของร้านก่อน
                </span>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <EmptyState tone="danger" icon="warning" title="โหลดข้อมูลโต๊ะไม่สำเร็จ" description={toThaiMessage(error)} action={<Button icon="refresh" onClick={refresh}>ลองใหม่</Button>} />
        ) : loading && !data ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 print:grid-cols-3 print:gap-6">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`card flex break-inside-avoid flex-col items-center p-4 text-center print:shadow-none print:ring-1 print:ring-black/20 ${
                  t.active ? '' : 'opacity-60 print:hidden'
                }`}
              >
                <div className="relative rounded-xl bg-white p-1">
                  <QRCodeCanvas value={`${PUBLIC_URL}/t/${t.token}`} size={132} level="M" includeMargin />
                  {!t.active && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="badge badge-neutral">ปิดใช้งาน</span>
                    </span>
                  )}
                </div>
                <p className="mt-1 font-display text-2xl">{t.label}</p>
                <p className="text-xs text-subtle">สแกนเพื่อสั่งอาหาร · TOKYO HOUSE</p>

                <div className="mt-3 w-full space-y-2 print:hidden">
                  <label className="sr-only" htmlFor={`table-label-${t.id}`}>
                    ชื่อโต๊ะ
                  </label>
                  <input
                    id={`table-label-${t.id}`}
                    key={t.label}
                    defaultValue={t.label}
                    maxLength={40}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== t.label) run(`label-${t.id}`, () => api.updateTable(t.id, { label: v }), 'เปลี่ยนชื่อโต๊ะแล้ว')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="input py-2 text-center text-sm"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" variant="secondary" icon="refresh" disabled={!!busy} onClick={() => setConfirmRotate(t)}>
                      เปลี่ยนรหัส
                    </Button>
                    <Button
                      size="sm"
                      variant={t.active ? 'ghost' : 'success'}
                      icon={t.active ? 'ban' : 'check'}
                      loading={busy === `active-${t.id}`}
                      disabled={!!busy}
                      onClick={() => run(`active-${t.id}`, () => api.updateTable(t.id, { active: !t.active }), t.active ? `ปิด ${t.label} แล้ว` : `เปิด ${t.label} แล้ว`)}
                    >
                      {t.active ? 'ปิด' : 'เปิด'}
                    </Button>
                  </div>
                  <a href={`${PUBLIC_URL}/t/${t.token}`} target="_blank" rel="noopener" className="inline-flex min-h-[2rem] items-center gap-1 text-xs font-semibold text-subtle hover:text-brand-ink">
                    ทดลองเปิดลิงก์ <Icon name="external" size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmRotate && (
        <Modal
          open
          onClose={() => setConfirmRotate(null)}
          title="เปลี่ยนรหัส QR?"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmRotate(null)}>
                ยกเลิก
              </Button>
              <Button
                variant="dark"
                icon="refresh"
                onClick={() => {
                  const t = confirmRotate
                  setConfirmRotate(null)
                  run(`rotate-${t.id}`, () => api.regenerateTableToken(t.id), `เปลี่ยนรหัส QR ${t.label} แล้ว — อย่าลืมพิมพ์ใหม่`)
                }}
              >
                เปลี่ยนรหัส
              </Button>
            </div>
          }
        >
          <p className="text-muted">
            QR เดิมของ <b className="text-brand-ink">{confirmRotate.label}</b> จะใช้สั่งอาหารไม่ได้ทันที ต้องพิมพ์ QR ใหม่ไปติดที่โต๊ะ
          </p>
        </Modal>
      )}
    </div>
  )
}
